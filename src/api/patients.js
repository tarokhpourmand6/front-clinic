// src/api/patients.js
import api from './axios';

// نرمال‌سازی خروجی /patients به یک آرایه
const normalizeList = (payload) => {
  // case 1: آرایه مستقیم
  if (Array.isArray(payload)) return payload;

  // case 2: { data: [] }
  if (Array.isArray(payload?.data)) return payload.data;

  // case 3: { patients: [] }
  if (Array.isArray(payload?.patients)) return payload.patients;

  // case 4: { data: { items: [] } }
  if (Array.isArray(payload?.data?.items)) return payload.data.items;

  // case 5: { items: [] }
  if (Array.isArray(payload?.items)) return payload.items;

  return [];
};

export const getPatients = async (params = {}) => {
  // پیش‌فرض‌های امن؛ اگر limit نگفتید 50 بگذاریم
  const { page = 1, limit = 50, q, hasPhone } = params;

  const res = await api.get('/patients', {
    params: { page, limit, q, hasPhone },
  });

  return normalizeList(res.data);
};

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
  // هم {data:{total}} و هم {total} را پوشش می‌دهیم
  return res?.data?.data?.total ?? res?.data?.total ?? 0;
};