// src/api/patients.js
import api from "./axios";

const PAGE_SIZE = 200;
const MAX_PAGES_SAFE = 200; // برای جلوگیری از لوپ بی‌نهایت

/* ---------------- helpers ---------------- */

const normalizeList = (body) => {
  // خروجی استاندارد بک‌اند شما: { data:[], currentPage, totalPages, totalItems, pageSize }
  if (Array.isArray(body?.data)) return body.data;
  // اگر برخی نسخه‌ها مستقیماً آرایه بدهند
  if (Array.isArray(body)) return body;
  return [];
};

const toNumber = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/* ---------------- paged API ---------------- */

/**
 * دریافت صفحه‌ای بیماران با جستجو/فیلتر اختیاری
 * @returns { data, currentPage, totalPages, totalItems, pageSize }
 */
export const getPatientsPaged = async (params = {}) => {
  const {
    page = 1,
    limit = PAGE_SIZE,
    q,           // جستجو روی نام/شماره (بک‌اند از q پشتیبانی می‌کند)
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
  const data = normalizeList(body);

  return {
    data,
    currentPage: toNumber(body?.currentPage, page),
    totalPages: toNumber(body?.totalPages, 1),
    totalItems: toNumber(body?.totalItems ?? body?.total, data.length),
    pageSize: toNumber(body?.pageSize, limit),
  };
};

/* ---------------- load-all (compat) ---------------- */

/**
 * دریافت همه بیماران با صفحه‌به‌صفحه (برای سازگاری قدیمی)
 * نکته: می‌توانی q بدهی تا همه صفحاتِ نتایجِ جستجو لود شود.
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
      totalPages = currentPage; // پایان عملیات
      break;
    }

    all = all.concat(data);
    totalPages = tp || totalPages;
    page += 1;
  }

  return all;
};

// اگر دوست داری اسم شفاف‌تری داشته باشی
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