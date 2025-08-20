// src/api/patients.js
import api from "./axios";

const PAGE_SIZE = 200;
const MAX_PAGES_SAFE = 200; // سقف ایمنی برای جلوگیری از لوپ بی‌نهایت

// یک صفحه را می‌گیرد و خروجی را نرمال می‌کند
async function fetchPatientsPage(page) {
  const res = await api.get("/patients", {
    params: { page, limit: PAGE_SIZE },
  });

  const body = res?.data ?? {};
  // حالت استاندارد بک‌اند: { data:[], currentPage, totalPages, totalItems, pageSize }
  let list = Array.isArray(body?.data) ? body.data : [];
  // اگر برخی نسخه‌ها مستقیماً آرایه بدهند
  if (!list.length && Array.isArray(body)) list = body;

  const currentPage = Number(body?.currentPage ?? page);
  // اگر totalPages نبود، با توجه به طول لیست حدس می‌زنیم
  const totalPages =
    Number(body?.totalPages) ||
    (list.length < PAGE_SIZE ? currentPage : currentPage + 1);

  return { list, currentPage, totalPages };
}

// ✅ دریافت همه بیماران (لوپ روی صفحات)
export const getPatients = async () => {
  let all = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= MAX_PAGES_SAFE) {
    const { list, currentPage, totalPages: tp } = await fetchPatientsPage(page);

    // اگر سرور داده‌ای برنگرداند، برای جلوگیری از حلقه بی‌پایان می‌شکنیم
    if (!Array.isArray(list) || list.length === 0) {
      totalPages = currentPage; // پایان
      break;
    }

    all = all.concat(list);
    totalPages = tp || totalPages;
    page += 1;
  }

  return all;
};

// ✅ دریافت بیمار با شماره
export const getPatientByPhone = async (phone) => {
  const res = await api.get(`/patients/by-phone/${phone}`);
  return res?.data?.data ?? null;
};

// ✅ ساخت بیمار
export const createPatient = async (patient) => {
  const fullName =
    patient.fullName ||
    `${patient.firstName || ""} ${patient.lastName || ""}`.trim();

  const payload = {
    fullName,
    birthDate: patient.birthDate, // می‌تواند null/undefined باشد
    phone: patient.phone,
    address: patient.address || "",
    tag: "",
    notes: patient.notes || "",
    photos: { before: [], after: [] },
  };

  const res = await api.post("/patients", payload);
  return res?.data?.data ?? null;
};

// ✅ ویرایش بیمار
export const updatePatient = async (id, patient) => {
  const fullName =
    patient.fullName ||
    `${patient.firstName || ""} ${patient.lastName || ""}`.trim();

  const payload = {
    fullName,
    birthDate: patient.birthDate,
    phone: patient.phone,
    address: patient.address || "",
    tag: "",
    notes: patient.notes || "",
    photos: { before: [], after: [] },
  };

  const res = await api.put(`/patients/${id}`, payload);
  return res?.data?.data ?? null;
};

// ✅ حذف بیمار
export const deletePatient = async (id) => {
  const res = await api.delete(`/patients/${id}`);
  return res?.data?.message ?? "OK";
};

// ✅ مدیریت عکس‌های بیمار
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

// ✅ تعداد کل بیماران
export const getPatientsCount = async () => {
  const res = await api.get("/patients/count");
  return res?.data?.data?.total ?? 0;
};