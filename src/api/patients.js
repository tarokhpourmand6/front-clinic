// src/api/patients.js
import api from './axios';

/** کمکی: اطمینان از آرایه بودن خروجی */
const asArray = (v) => (Array.isArray(v) ? v : (v?.data && Array.isArray(v.data) ? v.data : []));

/**
 * گرفتن لیست بیماران با صفحه‌بندی
 * - پیش‌فرض: limit=100, page=1
 * - backward compatible: اگر چیزی ندهی، قبلاً 2000 می‌گرفت؛ الان 100 می‌گیریم. اگر مثل قبل همه را خواستی، limit را بزرگ‌تر بده.
 * - اگر بک‌اند total برنگرداند، می‌توانی از getPatientsCount استفاده کنی.
 */
export const getPatients = async ({ limit = 100, page = 1 } = {}) => {
  const res = await api.get('/patients', { params: { limit, page } });
  const items = asArray(res.data);
  // تلاش برای خواندن total اگر بک‌اند داده باشد:
  const total = res?.data?.total ?? res?.data?.data?.total ?? undefined;

  return {
    items,
    page,
    limit,
    total,
    hasMore: typeof total === 'number' ? page * limit < total : undefined,
  };
};

/** نسخهٔ سادهٔ قدیمی برای سازگاری با کدهای قبلی (اگر جایی فقط آرایه می‌خواهد) */
export const getPatientsArray = async ({ limit = 100, page = 1 } = {}) => {
  const { items } = await getPatients({ limit, page });
  return items;
};

/** جستجو بر اساس شماره */
export const getPatientByPhone = async (phone) => {
  const res = await api.get(`/patients/by-phone/${phone}`);
  return res?.data?.data;
};

/** ایجاد بیمار */
export const createPatient = async (patient) => {
  const fullName =
    patient.fullName ||
    `${patient.firstName || ''} ${patient.lastName || ''}`.trim();

  const payload = {
    fullName,
    birthDate: patient.birthDate,
    phone: patient.phone,
    address: patient.address || '',
    tag: '',
    notes: patient.notes || '',
    photos: { before: [], after: [] },
  };

  const res = await api.post('/patients', payload);
  return res?.data?.data;
};

/** ویرایش بیمار */
export const updatePatient = async (id, patient) => {
  const fullName =
    patient.fullName ||
    `${patient.firstName || ''} ${patient.lastName || ''}`.trim();

  const payload = {
    fullName,
    birthDate: patient.birthDate,
    phone: patient.phone,
    address: patient.address || '',
    tag: '',
    notes: patient.notes || '',
    photos: { before: [], after: [] },
  };

  const res = await api.put(`/patients/${id}`, payload);
  return res?.data?.data;
};

/** حذف بیمار */
export const deletePatient = async (id) => {
  const res = await api.delete(`/patients/${id}`);
  return res?.data?.message;
};

/** مدیریت عکس بیمار (افزودن/حذف) */
export const updatePatientPhoto = async (patientId, type, data) => {
  if (data.method === 'DELETE') {
    const res = await api.put(`/patients/${patientId}/photos/${type}`, {
      path: data.imagePath,
      method: 'DELETE',
    });
    return res?.data?.data;
  }
  const res = await api.put(`/patients/${patientId}/photos/${type}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res?.data?.data;
};

/** شمارش کل بیماران (برای نمایش آمار یا محاسبه hasMore در صورت نیاز) */
export const getPatientsCount = async () => {
  const res = await api.get('/patients/count');
  // بک‌اندت data: { total } برمی‌گرداند
  return res?.data?.data?.total;
};