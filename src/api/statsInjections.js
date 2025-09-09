import api from "./axios";

// لیست نوبت‌های تزریقی با جزئیات هزینه/دریافت
export const getInjectionBreakdown = async ({ start, end, patientId } = {}) => {
  const res = await api.get("/stats/injections", {
    params: {
      start: start || undefined,   // "2025-09-01"
      end: end || undefined,       // "2025-09-09"
      patientId: patientId || undefined,
    },
  });
  return res?.data?.data || [];
};

// جزئیات یک نوبت
export const getInjectionById = async (id) => {
  const res = await api.get(`/stats/injections/${id}`);
  return res?.data?.data || null;
};