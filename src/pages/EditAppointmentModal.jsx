// components/EditAppointmentModal.jsx
import { useState } from "react";
import DatePicker from "../components/DatePicker/DatePicker";

const EditAppointmentModal = ({ isOpen, onClose, appointment, onSave }) => {
  if (!isOpen || !appointment) return null;

  const [form, setForm] = useState({
    ...appointment,
    appointmentDate: appointment.appointmentDate || null,
    appointmentHour: appointment.appointmentTime?.split(":")[0] || "08",
    appointmentMinute: appointment.appointmentTime?.split(":")[1] || "00",
  });

  const hours = Array.from({ length: 15 }, (_, i) => (8 + i).toString().padStart(2, "0"));
  const minutes = ["00", "10", "20", "30", "40", "50"];

  const handleSave = () => {
    onSave({
      ...form,
      appointmentTime: `${form.appointmentHour}:${form.appointmentMinute}`,
    }, true);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center font-vazir">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4">ویرایش نوبت</h2>

        <div className="mb-4">
          <label className="text-sm block mb-1">تاریخ نوبت:</label>
          <DatePicker
            value={form.appointmentDate}
            onChange={(date) => setForm({ ...form, appointmentDate: date })}
            inputPlaceholder="تاریخ"
            locale="fa"
            calendarClassName="custom-calendar"
            inputClassName="border p-2 rounded w-full"
            shouldHighlightWeekends
          />
        </div>

        <div className="mb-4 flex gap-2">
          <div className="w-1/2">
            <label className="text-sm block mb-1">دقیقه:</label>
            <select
              value={form.appointmentMinute}
              onChange={(e) => setForm({ ...form, appointmentMinute: e.target.value })}
              className="border p-2 rounded w-full"
            >
              {minutes.map((m, i) => <option key={i} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="w-1/2">
            <label className="text-sm block mb-1">ساعت:</label>
            <select
              value={form.appointmentHour}
              onChange={(e) => setForm({ ...form, appointmentHour: e.target.value })}
              className="border p-2 rounded w-full"
            >
              {hours.map((h, i) => <option key={i} value={h}>{h}</option>)}
            </select>
          </div>
        </div>

       

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="bg-gray-200 text-sm px-4 py-2 rounded hover:bg-gray-300">انصراف</button>
          <button onClick={handleSave} className="bg-brand text-white text-sm px-4 py-2 rounded hover:bg-blue-700">ذخیره تغییرات</button>
        </div>
      </div>
    </div>
  );
};

export default EditAppointmentModal;