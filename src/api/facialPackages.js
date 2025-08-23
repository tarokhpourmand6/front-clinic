// src/api/facialPackages.js
import api from "./axios";

export const getFacialPackages = async () => {
  const res = await api.get("/facial-packages");
  return res?.data?.data ?? [];
};

export const createFacialPackage = async (pkg) => {
  const res = await api.post("/facial-packages", pkg);
  return res?.data?.data ?? null;
};

export const updateFacialPackage = async (id, pkg) => {
  const res = await api.put(`/facial-packages/${id}`, pkg);
  return res?.data?.data ?? null;
};

export const deleteFacialPackage = async (id) => {
  const res = await api.delete(`/facial-packages/${id}`);
  return res?.data?.message ?? "OK";
};