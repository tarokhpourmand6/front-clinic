import api from './axios';

// ✅ دریافت همه بیماران بدون محدودیت (loop روی صفحات)
export const getPatients = async () => {
  let allPatients = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const res = await api.get(`/patients?page=${page}&limit=200`);
    const { data, totalPages: tp } = res.data;

    allPatients = [...allPatients, ...data];
    totalPages = tp;
    page++;
  }

  return allPatients;
};

// ✅ بقیه متدها مثل قبل
export const getPatientByPhone = async (phone) => {
  const res = await api.get(`/patients/by-phone/${phone}`);
  return res.data.data;
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
    photos: { before: [], after: [] }
  };

  const res = await api.post('/patients', payload);
  return res.data.data;
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
    photos: { before: [], after: [] }
  };

  const res = await api.put(`/patients/${id}`, payload);
  return res.data.data;
};

export const deletePatient = async (id) => {
  const res = await api.delete(`/patients/${id}`);
  return res.data.message;
};

export const updatePatientPhoto = async (patientId, type, data) => {
  if (data.method === "DELETE") {
    const res = await api.put(`/patients/${patientId}/photos/${type}`, {
      path: data.imagePath,
      method: "DELETE",
    });
    return res.data.data;
  }

  const res = await api.put(`/patients/${patientId}/photos/${type}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
};

export const getPatientsCount = async () => {
  const res = await api.get('/patients/count');
  return res.data.data.total;
};