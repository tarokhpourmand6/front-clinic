// src/api/patients.js
import api from "./axios";

const PAGE_SIZE = 200;
const MAX_PAGES_SAFE = 200;

/* ---------- helpers ---------- */
const normalizeList = (body) => {
  // 1) حالت دولایه: { status, message, data: { data: [...] } }
  if (Array.isArray(body?.data?.data)) return body.data.data;
  // 2) حالت تک‌لایه: { data: [...] }
  if (Array.isArray(body?.data)) return body.data;
  // 3) آرایه‌ی خام
  if (Array.isArray(body)) return body;
  return [];
};

const num = (v, fb) => (Number.isFinite(+v) ? +v : fb);

// meta را هم از هر دو حالت بخوانیم
const parsePaged = (body, { page, limit }) => {
  const wrapper = body?.data && typeof body.data === "object" ? body.data : body; // لایه داخلی اگر بود
  const data = normalizeList(body);
  return {
    data,
    currentPage: num(wrapper?.currentPage, page),
    totalPages: num(wrapper?.totalPages, 1),
    totalItems: num(wrapper?.totalItems ?? wrapper?.total, data.length),
    pageSize: num(wrapper?.pageSize, limit),
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

/* ---------- Load-all (paged loop) ---------- */
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
      totalPages = currentPage;
      break;
    }
    all = all.concat(data);
    totalPages = tp || totalPages;
    page += 1;
  }
  return all;
};

/* ---------- Fast (single request, limit=5000) ---------- */
export const getPatientsQuick = async () => {
  const res = await api.get("/patients", { params: { page: 1, limit: 5000 } });
  // همان پارسِ یکسان
  const { data } = parsePaged(res?.data ?? {}, { page: 1, limit: 5000 });
  return data;
};

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
    photos: { before: [], after: [] },
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