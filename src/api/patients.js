// src/api/patients.js
import api from './axios';

// --- Helpers -------------------------------------------------
const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;                 // []
  if (Array.isArray(payload?.data)) return payload.data;      // { data: [] }
  if (Array.isArray(payload?.patients)) return payload.patients; // { patients: [] }
  if (Array.isArray(payload?.data?.items)) return payload.data.items; // { data:{items:[]} }
  if (Array.isArray(payload?.items)) return payload.items;    // { items: [] }
  return [];
};

const buildParams = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ''));

// --- APIs ----------------------------------------------------
export const getPatients = async (params = {}) => {
  // پیش‌فرض امن: صفحه 1، 50 تا (اگر limit دادی همان را می‌فرستیم)
  const {
    page = 1,
    limit = 50,
    q,
    hasPhone,
    // هر فیلتر دیگری که بعداً خواستی اضافه کن (مثلاً appointmentFrom/To, birthdayFrom/To, tag, ...)
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
    return normalizeList(res.data);
  } catch {
    return []; // نذار UI خراب بشه
  }
};

// سازگاری با کدی که قبلاً getPatientsArray را ایمپورت می‌کرد
export const getPatientsArray = (params) => getPatients(params);

export const getPatientByPhone = async (phone) => {
  const res = await api.get(`/patients/by-phone/${phone}`);
  return res?.data?.data ?? res?.data ?? null;
};

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

export const deletePatient = async (id) => {
  const res = await api.delete(`/patients/${id}`);
  return res?.data?.message ?? 'OK';
};

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

export const getPatientsCount = async () => {
  const res = await api.get('/patients/count');
  return res?.data?.data?.total ?? res?.data?.total ?? 0;
};