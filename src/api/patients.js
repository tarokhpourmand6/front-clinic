import api from "./axios";

// گرفتن همه بیماران با لیمیت بالا (مثلاً 5000)
export const getPatients = async () => {
  const res = await api.get("/patients?limit=5000");
  return res.data.data || [];
};

// سرچ بیمار بر اساس نام یا شماره
export const searchPatients = async (query) => {
  if (!query || query.trim() === "") return [];
  const res = await api.get(`/patients?search=${query}&limit=20`);
  return res.data.data || [];
};

// گرفتن بیمار با شماره
export const getPatientByPhone = async (phone) => {
  const res = await api.get(`/patients/by-phone/${phone}`);
  return res.data.data;
};

// ایجاد بیمار جدید
export const createPatient = async (patient) => {
  const fullName =
    patient.fullName ||
    `${patient.firstName || ""} ${patient.lastName || ""}`.trim();

  const payload = {
    fullName,
    birthDate: patient.birthDate,
    phone: patient.phone,
    address: patient.address,
    notes: patient.notes || "",
  };

  const res = await api.post("/patients", payload);
  return res.data.data;
};