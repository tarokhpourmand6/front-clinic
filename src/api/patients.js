// src/api/patients.js
import api from "./axios";

const PAGE_SIZE = 200;
const MAX_PAGES_SAFE = 200; // جلوگیری از لوپ بی‌نهایت

/* ---------------- helpers ---------------- */

// بعضی پاسخ‌ها این‌شکلی‌اند: { success, message, data: { data:[], currentPage,... } }
const unwrap = (body) => (body && body.data !== undefined ? body.data : body);

const normalizeList = (body) => {
  const payload = unwrap(body);
  if (Array.isArray(payload?.data)) return payload.data; // فرم استاندارد: {data:[...], ...}
  if (Array.isArray(payload)) return payload;            // مستقیماً آرایه
  if (Array.isArray(body?.data)) return body.data;       // سازگاری قدیمی
  return [];
};

const toNumber = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/* ---------------- paged API ---------------- */

/**
 * دریافت صفحه‌ای بیماران با جستجو/فیلتر اختیاری
 * خروجی: { data, currentPage, totalPages, totalItems, pageSize }
 */
export const getPatientsPaged = async (params = {}) => {
  const {
    page = 1,
    limit = PAGE_SIZE,
    q,           // جستجو روی نام/شماره
    hasPhone,    // "true" | "false"
    tag,
    sort,
    order,       // 'asc' | 'desc'
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

  const body = res?.data ?? {};
  const payload = unwrap(body);
  const data = normalizeList(body);

  return {
    data,
    currentPage: toNumber(payload?.currentPage ?? body?.currentPage, page),
    totalPages:  toNumber(payload?.totalPages  ?? body?.totalPages,  1),
    totalItems:  toNumber(
      payload?.totalItems ?? payload?.total ?? body?.totalItems ?? body?.total,
      data.length
    ),
    pageSize:    toNumber(payload?.pageSize   ?? body?.pageSize,    limit),
  };
};

/* ---------------- load-all (compat) ---------------- */

/**
 * دریافت همه بیماران صفحه‌به‌صفحه (در صورت نیاز می‌توانی q/hasPhone/tag بدهی)
 */
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
      totalPages = currentPage; // صفحه خالی → پایان
      break;
    }

    all = all.concat(data);
    totalPages = tp || totalPages;
    page += 1;
  }

  return all;
};

// نام معادل
export const getAllPatients = getPatients;

/* ---------------- single item & mutations ---------------- */

export const getPatientByPhone = async (phone) => {
  const res = await api.get(`/patients/by-phone/${phone}`);
  return res?.data?.data ?? null;
};

export const createPatient = async (patient) => {
  const fullName =
    patient.fullName ||
    `${patient.firstName || ""} ${patient.lastName || ""}`.trim();

  const payload = {
    fullName,
    birthDate: patient.birthDate ?? null,
    phone: patient.phone,
    address: patient.address || "",
    tag: patient.tag || "",
    notes: patient.notes || "",
    photos: { before: [], after: [] },
  };

  const res = await api.post("/patients", payload);
  return res?.data?.data ?? null;
};

export const updatePatient = async (id, patient) => {
  const fullName =
    patient.fullName ||
    `${patient.firstName || ""} ${patient.lastName || ""}`.trim();

  const payload = {
    fullName,
    birthDate: patient.birthDate ?? null,
    phone: patient.phone,
    address: patient.address || "",
    tag: patient.tag || "",
    notes: patient.notes || "",
  // مهم: اگر بک‌اند خودش photos را نگه می‌دارد، همین کافیست؛
  // در غیر اینصورت از patient.photos استفاده کن:
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