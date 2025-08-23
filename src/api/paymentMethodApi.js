// src/api/paymentMethodApi.js
import api from "./axios";

// خروجی را همیشه به آرایه یکدست می‌کنیم
const normalizeList = (body) => {
  if (Array.isArray(body?.data?.data)) return body.data.data; // { data: { data: [] } }
  if (Array.isArray(body?.data)) return body.data;            // { data: [] }
  if (Array.isArray(body)) return body;                       // []
  return [];
};

// ورودی را به آبجکت {name} یکدست می‌کنیم
const toNamePayload = (payload) =>
  typeof payload === "string" ? { name: payload.trim() } : { name: (payload?.name || "").trim() };

export const getPaymentMethods = async () => {
  const res = await api.get("/payment-methods");
  return normalizeList(res?.data ?? {});
};

export const createPaymentMethod = async (payload) => {
  const body = toNamePayload(payload);
  if (!body.name) throw new Error("نام روش پرداخت خالی است");
  const res = await api.post("/payment-methods", body);
  // سرور ممکن است در data یا data.data برگرداند
  return res?.data?.data ?? res?.data ?? null;
};

export const updatePaymentMethod = async (id, payload) => {
  const body = toNamePayload(payload);
  if (!body.name) throw new Error("نام روش پرداخت خالی است");
  const res = await api.put(`/payment-methods/${id}`, body);
  return res?.data?.data ?? res?.data ?? null;
};

export const deletePaymentMethod = async (id) => {
  const res = await api.delete(`/payment-methods/${id}`);
  return res?.data?.message ?? "OK";
};