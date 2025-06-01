// src/api/inventory.js
import axios from './axios';

export const getAllProducts = async () => {
  const res = await axios.get('/inventory'); // ✅ درسته چون baseURL قبلاً /api داره
  return res.data;
};
export const createProduct = async (productData) => {
  const res = await axios.post("/inventory", productData);
  return res.data;
};

export const addPurchase = async (productId, purchaseData) => {
  const res = await axios.post(`/inventory/${productId}/purchases`, purchaseData);
  return res.data;
};

export const updateSalePrice = async (productId, price) => {
  const res = await axios.put(`/inventory/${productId}/price`, { salePrice: price });
  return res.data;
};

export const deleteProduct = async (productId) => {
  const res = await axios.delete(`/inventory/${productId}`);
  return res.data;
};

export const deletePurchase = async (productId, purchaseIndex) => {
  const res = await axios.delete(`/inventory/${productId}/purchases/${purchaseIndex}`);
  return res.data;
};

export const updateProduct = async (productId, data) => {
  const res = await axios.put(`/inventory/${productId}`, data);
  return res.data;
};