// src/api/patients.js
import api from "./axios";

const PAGE_SIZE = 200;       // سقف امن بک‌اند
const MAX_PAGES_SAFE = 200;  // برای جلوگیری از لوپ بی‌نهایت

/* ---------- helpers ---------- */
// آرایه‌ی بیماران را صرف‌نظر از شکل پاسخ برمی‌گرداند
const normalizeList = (body) => {
  // 1) دولایه: { status, message, data: { data: [...] } }
  if (Array.isArray(body?.data?.data)) return body.data.data;
  // 2) تک‌لایه: { data: [...] }
  if (Array.isArray(body?.data)) return body.data;
  // 3) آرایه خام
  if (Array.isArray(body)) return body;
  return [];
};

const toNum = (v, fb) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

// متادیتا را (چه در ریشه چه در data) بخوان
const parsePaged = (body, { page, limit }) => {
  const meta = body?.data && typeof body.data === "object" ? body.data : body;
  const data = normalizeList(body);
  return {
    data,
    currentPage: toNum(meta?.currentPage, page),
    totalPages: toNum(meta?.totalPages, 1),
    totalItems: toNum(meta?.totalItems ?? meta?.total, data.length),
    pageSize: toNum(meta?.pageSize, limit),
  };
};

/* ---------- Paged API ---------- */
export const getPatientsPaged = async (params = {}) => {
  const {
    page = 1,
    limit = PAGE_SIZE,
    q,
    hasPhone,
    tag,
    sort,
    order,
  } = params;

  const res = await api.get("/patients", {
    params: {
      page,
      limit,
      q: q || undefined,
      hasPhone: hasPhone ?? undefined,
      tag: tag || undefined,
      sort: sort || undefined,
      order: order || undefined,
    },
  });

  return parsePaged(res?.data ?? {}, { page, limit });
};

/* ---------- Load-all (loop) ---------- */
export const getPatients = async (params = {}) => {
  const { q, hasPhone, tag } = params;
  let all = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= MAX_PAGES_SAFE) {
    const { data, currentPage, totalPages: tp } = await getPatientsPaged({
      page,
      limit: PAGE_SIZE,
      q,
      hasPhone,
      tag,
    });

    if (!Array.isArray(data) || data.length === 0) {
      totalPages = currentPage; // پایان
      break;
    }
    all = all.concat(data);
    totalPages = tp || totalPages;
    page += 1;
  }
  return all;
};

/* ---------- Fast (parallel) ----------
   همه صفحات را به‌صورت موازی می‌آورد؛ برای مودال عالی است */
export const getPatientsFast = async ({ q, hasPhone, tag } = {}) => {
  // صفحه 1 برای فهمیدن totalPages
  const first = await api.get("/patients", {
    params: { page: 1, limit: PAGE_SIZE, q, hasPhone, tag },
  });
  const parsedFirst = parsePaged(first?.data ?? {}, { page: 1, limit: PAGE_SIZE });
  const firstList = parsedFirst.data;
  const totalPages = Math.min(toNum(parsedFirst.totalPages, 1), MAX_PAGES_SAFE);

  if (totalPages <= 1) return firstList;

  // صفحات 2..N موازی
  const pages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
  const reqs = pages.map((p) =>
    api
      .get("/patients", { params: { page: p, limit: PAGE_SIZE, q, hasPhone, tag } })
      .then((r) => parsePaged(r?.data ?? {}, { page: p, limit: PAGE_SIZE }).data)
      .catch(() => [])
  );
  const rest = await Promise.all(reqs);
  return firstList.concat(...rest);
};

// اگر جایی هنوز اسم قبلی را صدا می‌زند:
export const getAllPatients = getPatients;

/* ---------- Single & mutations ---------- */
export const getPatientByPhone = async (phone) => {
  const res = await api.get(`/patients/by-phone/${phone}`);
  return res?.data?.data ?? null;
};

export const createPatient = async (patient) => {
  const fullName =
    patient.fullName || `${patient.firstName || ""} ${patient.lastName || ""}`.trim();

  const payload = {
    fullName,
    birthDate: patient.birthDate ?? null,
    phone: patient.phone,
    address: patient.address || "",
    tag: patient.tag || "",
    notes: patient.notes || "",
  // بک‌اند خودش پیش‌فرضِ photos دارد؛ ارسالش اختیاری است
    photos: patient.photos || { before: [], after: [] },
  };

  const res = await api.post("/patients", payload);
  return res?.data?.data ?? null;
};

export const updatePatient = async (id, patient) => {
  const fullName =
    patient.fullName || `${patient.firstName || ""} ${patient.lastName || ""}`.trim();

  const payload = {
    fullName,
    birthDate: patient.birthDate ?? null,
    phone: patient.phone,
    address: patient.address || "",
    tag: patient.tag || "",
    notes: patient.notes || "",
    photos: patient.photos || { before: [], after: [] },
  };

  const res = await api.put(`/patients/${id}`, payload);
  return res?.data?.data ?? null;
};

export const deletePatient = async (id) => {
  const res = await api.delete(`/patients/${id}`);
  return res?.data?.message ?? "OK";
};

export const updatePatientPhoto = async (patientId, type, data) => {
  if (data.method === "DELETE") {
    const res = await api.put(`/patients/${patientId}/photos/${type}`, {
      path: data.imagePath,
      method: "DELETE",
    });
    return res?.data?.data ?? null;
  }
  const res = await api.put(`/patients/${patientId}/photos/${type}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res?.data?.data ?? null;
};

export const getPatientsCount = async () => {
  const res = await api.get("/patients/count");
  return res?.data?.data?.total ?? 0;
};