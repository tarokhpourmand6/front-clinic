// src/api/careProducts.js
import api from "./axios";

export const getCareProducts = async () => {
  const res = await api.get("/care-products");
  return res?.data?.data ?? [];
};

export const createCareProduct = async (item) => {
  const res = await api.post("/care-products", item);
  return res?.data?.data ?? null;
};

export const updateCareProduct = async (id, item) => {
  const res = await api.put(`/care-products/${id}`, item);
  return res?.data?.data ?? null;
};

export const deleteCareProduct = async (id) => {
  const res = await api.delete(`/care-products/${id}`);
  return res?.data?.message ?? "OK";
};