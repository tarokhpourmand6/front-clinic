import { useState } from "react";
import { createPatient } from "../../api/patients";

export default function PatientCreateModal({ open, onClose, onCreated }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    birthDate: null,   // اختیاری
    address: "",       // اختیاری
    notes: "",         // اختیاری
  });

  if (!open) return null;

  const handleSubmit = async () => {
    if (!form.fullName?.trim() || !form.phone?.trim()) {
      alert("نام و شماره الزامی است");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.replace(/[^0-9]/g, ""),
        birthDate: form.birthDate || null,
        address: form.address || "",
        notes: form.notes || "",
      };
      const p = await createPatient(payload);
      onCreated?.(p);      // به مودال نوبت برگردونیم/یا لیست را رفرش کنیم
      onClose?.();
    } catch (e) {
      alert("ثبت بیمار ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-4 font-vazir">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold">ثبت بیمار جدید</h3>
          <button onClick={onClose} className="px-2 py-1 rounded-lg border">بستن</button>
        </div>

        <div className="space-y-2">
          <input
            className="border p-2 rounded w-full"
            placeholder="نام و نام خانوادگی *"
            value={form.fullName}
            onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
          />
          <input
            className="border p-2 rounded w-full"
            placeholder="شماره تماس *"
            value={form.phone}
            onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
          />
          <input
            className="border p-2 rounded w-full"
            placeholder="آدرس (اختیاری)"
            value={form.address}
            onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
          />
          <textarea
            className="border p-2 rounded w-full"
            placeholder="یادداشت (اختیاری)"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="mt-4 w-full bg-brand text-white px-4 py-2 rounded"
        >
          {saving ? "در حال ثبت..." : "ثبت بیمار"}
        </button>
      </div>
    </div>
  );
}