import api from "./axios";

const toArray = (b) => {
  if (Array.isArray(b?.data?.data)) return b.data.data; // {data:{data:[]}}
  if (Array.isArray(b?.data))       return b.data;      // {data:[]}
  if (Array.isArray(b))             return b;           // []
  return [];
};

export const getCareProducts = async () => {
  const res = await api.get("/care-products");
  return toArray(res?.data ?? {});
};

export const createCareProduct = async (payload) => {
  const res = await api.post("/care-products", payload);
  return res?.data?.data ?? res?.data ?? null;
};

export const updateCareProduct = async (id, payload) => {
  const res = await api.put(`/care-products/${id}`, payload);
  return res?.data?.data ?? res?.data ?? null;
};

export const deleteCareProduct = async (id) => {
  const res = await api.delete(`/care-products/${id}`);
  return res?.data?.message ?? "OK";
};