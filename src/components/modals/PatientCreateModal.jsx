// src/components/modals/PatientCreateModal.jsx
import { useEffect, useState } from "react";
import DatePicker from "../DatePicker/DatePicker";
import LoadingSpinner from "../LoadingSpinner";
import { createPatient, updatePatient } from "../../api/patients";

const fa2enDigits = (s = "") => String(s).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
const normalizePhone = (raw = "") => fa2enDigits(raw).replace(/\D/g, "");

export default function PatientCreateModal({
  open,
  onClose,
  onCreated,           // (patient) => void
  onUpdated,           // (patient) => void  — اگر حالت ویرایش بود
  initialPatient = null, // اگر پاس بدهید، مودال در حالت ویرایش باز می‌شود
}) {
  const isEdit = !!initialPatient?._id;

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    birthDate: null, // {year,month,day} یا null
    address: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    if (!open) return;
    // پر کردن فرم در حالت ویرایش
    if (initialPatient) {
      let bd = null;
      if (initialPatient.birthDate) {
        const d = new Date(initialPatient.birthDate);
        bd = { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
      }
      setForm({
        fullName: initialPatient.fullName || "",
        phone: initialPatient.phone || "",
        birthDate: bd,
        address: initialPatient.address || "",
        notes: initialPatient.notes || "",
      });
    } else {
      // فرم خالی در حالت ایجاد
      setForm({
        fullName: "",
        phone: "",
        birthDate: null,
        address: "",
        notes: "",
      });
    }
    setError("");
  }, [open, initialPatient]);

  if (!open) return null;

  const handleChange = (key) => (e) => {
    setForm((s) => ({ ...s, [key]: e.target.value }));
  };

  const handleSubmit = async () => {
    setError("");

    const fullName = String(form.fullName || "").trim();
    const phoneNorm = normalizePhone(form.phone || "");

    if (!fullName || !phoneNorm) {
      setError("نام و شماره تلفن الزامی است.");
      return;
    }

    const birthISO =
      form.birthDate
        ? new Date(form.birthDate.year, (form.birthDate.month || 1) - 1, form.birthDate.day || 1).toISOString()
        : null;

    const payload = {
      fullName,
      phone: phoneNorm,
      birthDate: birthISO,      // بک‌اند null را می‌پذیرد
      address: form.address || "",
      notes: form.notes || "",
      // tag اختیاری است؛ اگر لازم شد اضافه کنید
    };

    try {
      setSaving(true);
      if (isEdit) {
        const updated = await updatePatient(initialPatient._id, payload);
        onUpdated?.(updated);
      } else {
        const created = await createPatient(payload);
        onCreated?.(created);
      }
      onClose?.();
    } catch (err) {
      // پیام‌های مفید از سرور
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.map?.((e) => e.msg).join("\n") ||
        "⛔️ خطا در ذخیره اطلاعات بیمار";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-4 font-vazir">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold">
            {isEdit ? "✏️ ویرایش اطلاعات بیمار" : "➕ ثبت بیمار جدید"}
          </h3>
          <button onClick={onClose} className="px-2 py-1 rounded-lg border">بستن</button>
        </div>

        {saving && (
          <div className="mb-3">
            <LoadingSpinner />
          </div>
        )}

        {!!error && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <input
            className="border p-2 rounded w-full"
            placeholder="نام و نام خانوادگی *"
            value={form.fullName}
            onChange={handleChange("fullName")}
            autoFocus
          />
          <input
            className="border p-2 rounded w-full"
            placeholder="شماره تماس *"
            value={form.phone}
            onChange={handleChange("phone")}
            inputMode="tel"
          />

          {/* اختیاری‌ها */}
          <DatePicker
            value={form.birthDate}
            onChange={(v) => setForm((s) => ({ ...s, birthDate: v }))}
            inputPlaceholder="تاریخ تولد (اختیاری)"
            locale="fa"
            inputClassName="border p-2 rounded w-full"
          />

          <input
            className="border p-2 rounded w-full"
            placeholder="آدرس (اختیاری)"
            value={form.address}
            onChange={handleChange("address")}
          />
          <textarea
            className="border p-2 rounded w-full"
            placeholder="یادداشت (اختیاری)"
            rows={3}
            value={form.notes}
            onChange={handleChange("notes")}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="mt-4 w-full bg-brand text-white px-4 py-2 rounded"
        >
          {saving ? "در حال ذخیره..." : isEdit ? "ذخیره تغییرات" : "ثبت بیمار"}
        </button>
      </div>
    </div>
  );
}