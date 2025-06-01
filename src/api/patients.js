import api from './axios';

export const getPatients = async () => {
  const res = await api.get('/patients');
  return res.data.data || [];
};

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
    // حذف عکس
    const res = await api.put(`/patients/${patientId}/photos/${type}`, {
      path: data.imagePath,
      method: "DELETE",
    });
    return res.data.data;
  }

  // افزودن عکس
  const res = await api.put(`/patients/${patientId}/photos/${type}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
};