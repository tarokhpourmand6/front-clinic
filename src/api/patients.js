// src/api/patients.js
import api from './axios';

/* ---------- helpers ---------- */

// اولین آرایه‌ی «محتملِ لیست» را در هر عمقی برمی‌گرداند.
// اگر چند آرایه هست، اولویتش با آرایه‌های شامل آبجکت‌های دارای _id یا phone یا fullName است.
const deepFindFirstList = (obj) => {
  if (!obj || typeof obj !== 'object') return [];

  // اگر خودش آرایه است
  if (Array.isArray(obj)) return obj;

  // صف برای BFS
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
        // بررسی کیفیت آرایه
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

/* ---------- APIs ---------- */

// لیست بیماران
export const getPatients = async (params = {}) => {
  // پیش‌فرض‌های امن
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

    // حالت‌های رایج سریع
    const d = res?.data;
    if (Array.isArray(d)) return d;                  // []
    if (Array.isArray(d?.data)) return d.data;       // { data: [] }

    // حالت عمومی/عمیق
    return deepFindFirstList(d);
  } catch (err) {
    // اگر احراز هویت مشکل داشته باشد، برنگرداندن آرایه خالی باعث می‌شود صفحه بالا بیاید
    // و بتوانی از طریق Network جزئیات را ببینی.
    return [];
  }
};

// برای سازگاری با ایمپورت‌های قدیمی
export const getPatientsArray = (params) => getPatients(params);

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

// تعداد بیماران
export const getPatientsCount = async () => {
  const res = await api.get('/patients/count');
  return res?.data?.data?.total ?? res?.data?.total ?? 0;
};