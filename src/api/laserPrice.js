// src/api/laserPrice.js
import axios from "./axios";

// دریافت قیمت‌ها
export const getLaserPrices = async () => {
  const res = await axios.get("/laser-prices");
  return res.data;
};

// ذخیره قیمت‌ها (کل آبجکت یک‌جا)
export const saveLaserPrices = async (data) => {
  const res = await axios.post("/laser-prices", data);
  return res.data;
};