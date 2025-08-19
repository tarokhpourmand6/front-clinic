// src/api/axios.js
import axios from "axios";

const fallback = "https://clinic-crm-backend.onrender.com";
const RAW = import.meta.env.VITE_BACKEND_URL || fallback;

// حذف اسلش انتهایی اگر هست
const BASE = (RAW || "").replace(/\/+$/, "");

console.log("[api] baseURL =", BASE); // دیباگ: یک بار در کنسول می‌بینی

const api = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,
});

export default api;