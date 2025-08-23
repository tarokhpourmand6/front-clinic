import api from "./axios";

const toArray = (b) => {
  if (Array.isArray(b?.data?.data)) return b.data.data;
  if (Array.isArray(b?.data))       return b.data;
  if (Array.isArray(b))             return b;
  return [];
};

export const getFacialPackages = async () => {
  const res = await api.get("/facial-packages");
  return toArray(res?.data ?? {});
};

export const createFacialPackage = async (payload) => {
  const res = await api.post("/facial-packages", payload);
  return res?.data?.data ?? res?.data ?? null;
};

export const updateFacialPackage = async (id, payload) => {
  const res = await api.put(`/facial-packages/${id}`, payload);
  return res?.data?.data ?? res?.data ?? null;
};

export const deleteFacialPackage = async (id) => {
  const res = await api.delete(`/facial-packages/${id}`);
  return res?.data?.message ?? "OK";
};