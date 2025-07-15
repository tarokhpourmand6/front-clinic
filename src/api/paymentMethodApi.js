import api from './axios'; // استفاده از همون axios مرکزی

export const getPaymentMethods = async () => {
  const res = await api.get('/payment-methods');
  return res.data;
};

export const createPaymentMethod = async (name) => {
  const res = await api.post('/payment-methods', { name });
  return res.data;
};

export const deletePaymentMethod = async (id) => {
  const res = await api.delete(`/payment-methods/${id}`);
  return res.data;
};

export const updatePaymentMethod = async (id, name) => {
  const res = await api.put(`/payment-methods/${id}`, { name });
  return res.data;
};