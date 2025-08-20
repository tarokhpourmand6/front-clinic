// src/api/patients.js
import api from './axios';

/* ---------- helpers ---------- */
// فقط پارام‌های تعریف‌شده را بفرستیم
const buildParams = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );

// اولین آرایه‌ی «محتملِ لیست» را در هر عمقی برمی‌گرداند.
const deepFindFirstList = (obj) => {
  if (!obj || typeof obj !== 'object') return [];
  if (Array.isArray(obj)) return obj;

  const q = [obj];
  while (q.length) {
    const cur = q.shift();

    for (const k of ['patients', 'items', 'list', 'data', 'results', 'rows']) {
      const v = cur?.[k];
      if (Array.isArray(v)) return v;
    }

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

/* ---------- APIs ---------- */

// لیست بیماران (با صفحه‌بندی/سرچ اختیاری)
// src/api/patients.js
export const getPatientsPaged = async (params = {}) => {
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

// ✅ سازگاری با کدهای قبلی: فقط آرایه برمی‌گرداند
export const getPatients = async (params = {}) => {
  const result = await getPatientsPaged(params);
  return Array.isArray(result?.data) ? result.data : [];
};

// ✅ اگر جایی از پروژه هنوز از اسم قدیمی استفاده می‌کند
export const getPatientsArray = getPatients;

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

  // تلاش برای خواندن متادیتا از چند شکل متداول
  const raw = res?.data ?? {};
  // حالت استاندارد بک‌اند شما: { data:[], currentPage, totalPages, totalItems, pageSize }
  if (Array.isArray(raw?.data)) {
    return {
      data: raw.data,
      currentPage: Number(raw.currentPage ?? page),
      totalPages: Number(raw.totalPages ?? 1),
      totalItems: Number(raw.totalItems ?? raw.total ?? raw.count ?? raw.data.length),
      pageSize: Number(raw.pageSize ?? limit),
    };
  }

  // اگر بک‌اند قدیمی فقط آرایه می‌داد:
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : deepFindFirstList(raw);
  const total = Number(raw?.totalItems ?? raw?.total ?? list.length);
  return {
    data: list,
    currentPage: Number(raw?.currentPage ?? 1),
    totalPages: Number(raw?.totalPages ?? 1),
    totalItems: total,
    pageSize: Number(raw?.pageSize ?? list.length),
  };
};

export const createPatient = async (patient) => {
  const fullName =
    patient.fullName ||
    `${patient.firstName || ''} ${patient.lastName || ''}`.trim();

  const payload = {
    fullName,
    birthDate: patient.birthDate || null,
    phone: patient.phone,
    address: patient.address || '',
    tag: patient.tag || '',
    notes: patient.notes || '',
    photos: { before: [], after: [] },
  };

  const res = await api.post('/patients', payload);
  return res?.data?.data ?? res?.data ?? null;
};

export const updatePatient = async (id, patient) => {
  const fullName =
    patient.fullName ||
    `${patient.firstName || ''} ${patient.lastName || ''}`.trim();

  const payload = {
    fullName,
    birthDate: patient.birthDate || null,
    phone: patient.phone,
    address: patient.address || '',
    tag: patient.tag || '',
    notes: patient.notes || '',
    photos: patient.photos || { before: [], after: [] },
  };

  const res = await api.put(`/patients/${id}`, payload);
  return res?.data?.data ?? res?.data ?? null;
};

export const deletePatient = async (id) => {
  const res = await api.delete(`/patients/${id}`);
  return res?.data?.message ?? 'OK';
};

// عکس بیمار (افزودن/حذف)
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

// تعداد کل بیماران
export const getPatientsCount = async () => {
  const res = await api.get('/patients/count');
  return res?.data?.data?.total ?? res?.data?.total ?? 0;
};