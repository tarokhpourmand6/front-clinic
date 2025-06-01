import api from './axios';

export const getAppointments = async () => {
  const res = await api.get('/appointments');
  return res.data;
};

export const updateAppointment = async (id, data) => {
  const res = await api.put(`/appointments/${id}`, data);
  return res.data;
};


export const deleteAppointment = async (id) => {
  const res = await api.delete(`/appointments/${id}`);
  return res.data;
};

export const getAppointmentsByPatient = async (patientId) => {
  const res = await api.get(`/appointments/patient/${patientId}`);
  return res.data;
};

export const createAppointment = async (appointment) => {
  const res = await api.post("/appointments", appointment);
  return res.data;
};