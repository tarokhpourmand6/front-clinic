// src/api/patients.js
import api from './axios';

/* ---------- helpers ---------- */

// اولین آرایه‌ی «محتملِ لیست» را در هر عمقی برمی‌گرداند.
const deepFindFirstList = (obj) => {
  if (!obj || typeof obj !== 'object') return [];
  if (Array.isArray(obj)) return obj;

  const q = [obj];
  while (q.length) {
    const cur = q.shift();

    // 1) کلیدهای رایج
    for (const k of ['patients', 'items', 'list', 'data', 'results', 'rows']) {
      const v = cur?.[k];
      if (Array.isArray(v)) return v;
    }

    // 2) هر کلید دیگر که آرایه باشد
    for (const v of Object.values(cur)) {
      if (Array.isArray(v)) {
        const looksLikePatients = v.some(
          (it) => it && typeof it === 'object' && (it._id || it.phone || it.fullName)
        );
        if (looksLikePatients) return v;
      } else if (v && typeof v === 'object') {
        q.push(v);
      }
    }
  }
  return [];
};

// فقط پارام‌های تعریف‌شده را بفرستیم
const buildParams = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );

/* ---------- core APIs (تک صفحه) ---------- */

// لیست بیماران (صفحه‌ای)
export const getPatients = async (params = {}) => {
  const {
    page = 1,
    limit = 50,
    q,
    hasPhone,
    appointmentFrom,
    appointmentTo,
    birthdayFrom,
    birthdayTo,
    tag,
  } = params;

  try {
    const res = await api.get('/patients', {
      params: buildParams({
        page,
        limit,
        q,
        hasPhone,
        appointmentFrom,
        appointmentTo,
        birthdayFrom,
        birthdayTo,
        tag,
      }),
    });

    const d = res?.data;
    if (Array.isArray(d)) return d;            // []
    if (Array.isArray(d?.data)) return d.data; // { data: [] }
    return deepFindFirstList(d);               // حالت‌های عمومی/تو در تو
  } catch {
    return [];
  }
};

// برای سازگاری با ایمپورت‌های قدیمی
export const getPatientsArray = (params) => getPatients(params);

/* ---------- helper: همه صفحات ---------- */

// همه‌ی صفحات را می‌خواند تا خالی شود یا به maxPages برسد
export const getAllPatients = async (
  params = {},
  options = {}
) => {
  // پارامترهای فیلتر/جستجو سمت سرور
  const {
    q,
    hasPhone,
    appointmentFrom,
    appointmentTo,
    birthdayFrom,
    birthdayTo,
    tag,
  } = params;

  // تنظیمات پیمایش
  const {
    limit = 200,     // اندازه‌ی هر صفحه (برای سرعت بیشتر از 50 بالاتره)
    maxPages = 1000, // سقف ایمنی
    dedupeBy = '_id' // معیار یکتاسازی: '_id' یا 'phone'
  } = options;

  const outMap = new Map(); // برای حذف رکوردهای تکراری
  let page = 1;

  while (page <= maxPages) {
    const pageItems = await getPatients({
      page,
      limit,
      q,
      hasPhone,
      appointmentFrom,
      appointmentTo,
      birthdayFrom,
      birthdayTo,
      tag,
    });

    // اگر خالی شد، یعنی صفحات تمام شده
    if (!Array.isArray(pageItems) || pageItems.length === 0) break;

    // ادغام یکتا
    for (const it of pageItems) {
      const key =
        (dedupeBy && it && it[dedupeBy]) ||
        it?._id ||
        it?.phone ||
        JSON.stringify(it);
      if (!outMap.has(key)) outMap.set(key, it);
    }

    // اگر تعداد دریافتی کمتر از limit بود، صفحه آخر است
    if (pageItems.length < limit) break;

    page += 1;
  }

  return Array.from(outMap.values());
};

/* ---------- باقی CRUDها ---------- */

// جستجو بر اساس شماره
export const getPatientByPhone = async (phone) => {
  const res = await api.get(`/patients/by-phone/${phone}`);
  return res?.data?.data ?? res?.data ?? null;
};

// ایجاد بیمار
export const createPatient = async (patient) => {
  const fullName =
    patient.fullName ||
    `${patient.firstName || ''} ${patient.lastName || ''}`.trim();

  const payload = {
    fullName,
    birthDate: patient.birthDate,
    phone: patient.phone,
    address: patient.address || '',
    tag: '',
    notes: patient.notes || '',
    photos: { before: [], after: [] },
  };

  const res = await api.post('/patients', payload);
  return res?.data?.data ?? res?.data ?? null;
};

// به‌روزرسانی بیمار
export const updatePatient = async (id, patient) => {
  const fullName =
    patient.fullName ||
    `${patient.firstName || ''} ${patient.lastName || ''}`.trim();

  const payload = {
    fullName,
    birthDate: patient.birthDate,
    phone: patient.phone,
    address: patient.address || '',
    tag: '',
    notes: patient.notes || '',
    photos: { before: [], after: [] },
  };

  const res = await api.put(`/patients/${id}`, payload);
  return res?.data?.data ?? res?.data ?? null;
};

// حذف بیمار
export const deletePatient = async (id) => {
  const res = await api.delete(`/patients/${id}`);
  return res?.data?.message ?? 'OK';
};

// عکس بیمار
export const updatePatientPhoto = async (patientId, type, data) => {
  if (data.method === 'DELETE') {
    const res = await api.put(`/patients/${patientId}/photos/${type}`, {
      path: data.imagePath,
      method: 'DELETE',
    });
    return res?.data?.data ?? res?.data ?? null;
  }

  const res = await api.put(`/patients/${patientId}/photos/${type}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res?.data?.data ?? res?.data ?? null;
};

// تعداد بیماران (در صورت داشتن API شمارنده)
export const getPatientsCount = async () => {
  const res = await api.get('/patients/count');
  return res?.data?.data?.total ?? res?.data?.total ?? 0;
};