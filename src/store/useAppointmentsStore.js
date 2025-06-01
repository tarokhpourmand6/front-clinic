import { create } from 'zustand';
import {
  getAppointments,
  updateAppointment,
  deleteAppointment,
  createAppointment
} from '../api/appointments';

const useAppointmentsStore = create((set, get) => ({
  appointments: [],
  loading: false,
  error: null,

  filters: { name: '', phone: '', date: null },
  setFilters: (newFilters) => set({ filters: newFilters }),

  fetchAppointments: async () => {
    try {
      set({ loading: true });
      const data = await getAppointments();
      set({ appointments: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  updateAppointmentItem: async (id, updates) => {
    if (!id) {
      console.warn("⛔️ آیدی نوبت نامعتبر است:", id);
      return;
    }
    try {
      await updateAppointment(id, updates);
      const updatedList = get().appointments.map((a) =>
        a._id === id ? { ...a, ...updates } : a
      );
      set({ appointments: updatedList });
    } catch (err) {
      console.error("⛔️ خطا در به‌روزرسانی نوبت:", err);
    }
  },

  deleteAppointmentItem: async (id) => {
    try {
      await deleteAppointment(id);
      const updatedList = get().appointments.filter((a) => a._id !== id);
      set({ appointments: updatedList });
    } catch (err) {
      console.error("⛔️ خطا در حذف نوبت:", err);
    }
  },

  getAppointmentsByPatient: (patientId) => {
    return get().appointments.filter(
      (a) => a.patientId === patientId || a.patientId?._id === patientId
    );
  },

  addAppointmentItem: async (newAppointment) => {
  try {
    const created = await createAppointment(newAppointment);
    await get().fetchAppointments();
    return created; // 👈 این خط باعث میشه در OldAppointments بتونیم id جدید رو بگیریم
  } catch (err) {
    console.error("⛔️ خطا در ثبت نوبت جدید:", err);
    throw err; // برای مدیریت بهتر خطاها
  }
},
}));

export default useAppointmentsStore;