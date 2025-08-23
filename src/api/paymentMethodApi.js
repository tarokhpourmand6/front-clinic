import api from "./axios";

// همیشه خروجی را به آرایه تمیز کن
const normalizeList = (body) => {
  if (Array.isArray(body?.data?.data)) return body.data.data; // { data: { data: [...] } }
  if (Array.isArray(body?.data))       return body.data;      // { data: [...] }
  if (Array.isArray(body))             return body;           // [...]
  return [];
};

// اگر payload استرینگ بود، به {name} تبدیلش کن
const ensureObj = (payloadOrName) =>
  typeof payloadOrName === "string" ? { name: payloadOrName } : (payloadOrName || {});

export const getPaymentMethods = async () => {
  const res = await api.get("/payment-methods");
  return normalizeList(res?.data ?? {});
};

export const createPaymentMethod = async (payloadOrName) => {
  const payload = ensureObj(payloadOrName);
  const res = await api.post("/payment-methods", payload);
  return res?.data?.data ?? res?.data ?? null;
};

export const updatePaymentMethod = async (id, payloadOrName) => {
  const payload = ensureObj(payloadOrName);
  const res = await api.put(`/payment-methods/${id}`, payload);
  return res?.data?.data ?? res?.data ?? null;
};

export const deletePaymentMethod = async (id) => {
  const res = await api.delete(`/payment-methods/${id}`);
  return res?.data?.message ?? "OK";
};