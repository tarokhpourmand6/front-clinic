// src/components/appointments/InjectionTable.jsx
import { useState } from "react";
import DatePicker from "../../components/DatePicker/DatePicker";
import { toPersianNumber, convertToObj } from "../../utils/number";
import { Plus } from "lucide-react";

export default function InjectionTable({
  data,
  onDateChange,
  onTimeChange,
  onStatusChange,
  onPriceChange,
  onDelete,
  onOpenConsumables,      // (appointmentId)
  onOpenPaymentModal,     // (appointmentId, paymentDetails, price)
  onPatientClick,         // (patientObj)
}) {
  const [sortField, setSortField] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedData = [...(data || [])].sort((a, b) => {
    if (!sortField) return 0;
    const A = (a?.[sortField] ?? "").toString();
    const B = (b?.[sortField] ?? "").toString();
    return sortAsc ? A.localeCompare(B, "fa") : B.localeCompare(A, "fa");
  });

  const timeOptions = [
    "09:30","10:00","10:30","11:00","11:30","12:00","12:30",
    "13:00","13:30","14:00","14:30","15:00","15:30","16:00",
    "16:30","17:00","17:30","18:00","18:30","19:30","20:00",
    "20:30","21:00","21:30","22:00",
  ];

  const toUiStatus = (s) =>
    s === "Completed" ? "done" : s === "Scheduled" ? "pending" : "canceled";

  return (
    <div className="mt-6">
      <h2 className="font-bold text-md mb-2">نوبت‌های تزریقات</h2>

      <table className="w-full text-sm text-right font-vazir">
        <thead className="bg-brand text-white">
          <tr>
            <th className="px-2 py-1">نام</th>
            <th className="px-2 py-1">تلفن</th>
            <th
              className="px-2 py-1 cursor-pointer"
              onClick={() => handleSort("dateShamsi")}
            >
              تاریخ {sortField === "dateShamsi" && (sortAsc ? "▲" : "▼")}
            </th>
            <th
              className="px-2 py-1 cursor-pointer"
              onClick={() => handleSort("time")}
            >
              ساعت {sortField === "time" && (sortAsc ? "▲" : "▼")}
            </th>
            <th className="px-2 py-1">وضعیت</th>
            <th className="px-2 py-1">مبلغ + موارد</th>
            <th className="px-2 py-1">روش پرداخت</th>
            <th className="px-2 py-1">عملیات</th>
          </tr>
        </thead>

        <tbody>
          {sortedData.map((a) => (
            <tr key={a._id} className="even:bg-gray-50 text-[12px]">
              {/* نام بیمار (کلیک‌پذیر برای باز کردن مودال ثبت نوبت) */}
              <td className="border px-2 py-1">
                <button
                  type="button"
                  title="ثبت نوبت برای این بیمار"
                  className="text-blue-600 hover:underline"
                  onClick={() => onPatientClick?.(a?.patientId)}
                >
                  {a?.patientId?.fullName || "—"}
                </button>
              </td>

              {/* تلفن */}
              <td className="border px-2 py-1">
                {toPersianNumber(a?.patientId?.phone || "")}
              </td>

              {/* تاریخ */}
              <td className="border px-2 py-1">
                <DatePicker
                  value={convertToObj(a?.dateShamsi)}
                  onChange={(dateObj) => onDateChange?.(a._id, dateObj)}
                  locale="fa"
                  inputClassName="border p-1 rounded w-full"
                />
              </td>

              {/* ساعت */}
              <td className="border px-2 py-1">
                <select
                  value={a?.time || ""}
                  onChange={(e) => onTimeChange?.(a._id, e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  {timeOptions.map((t) => (
                    <option key={t} value={t}>
                      {toPersianNumber(t)}
                    </option>
                  ))}
                </select>
              </td>

              {/* وضعیت */}
              <td className="border px-2 py-1">
                <select
                  value={toUiStatus(a?.status)}
                  onChange={(e) => onStatusChange?.(a._id, e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="pending">در انتظار</option>
                  <option value="done">انجام شده</option>
                  <option value="canceled">لغو شده</option>
                </select>
              </td>

              {/* مبلغ + اقلام مصرفی */}
              <td className="border px-2 py-1">
                <input
                  value={toPersianNumber(
                    (a?.price ?? "")
                      .toString()
                      .replace(/\B(?=(\d{3})+(?!\d))/g, "٬")
                  )}
                  onChange={(e) => onPriceChange?.(a._id, e.target.value)}
                  className="border rounded px-2 py-1 text-right"
                  inputMode="numeric"
                />
                {Array.isArray(a?.consumables) && a.consumables.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {a.consumables.map((c) => `${c.name} (${c.amount})`).join(" + ")}
                  </div>
                )}
              </td>

              {/* پرداخت */}
              <td className="border px-2 py-1 text-center">
                <button
                  onClick={() =>
                    onOpenPaymentModal?.(a._id, a?.paymentDetails || [], a?.price || 0)
                  }
                  className="text-blue-600 hover:text-blue-800 underline text-xs"
                >
                  مدیریت پرداخت
                </button>
              </td>

              {/* عملیات */}
              <td className="border px-2 py-1 flex gap-2 items-center">
                <button className="text-red-500" onClick={() => onDelete?.(a._id)}>
                  حذف
                </button>
                <button
                  title="ثبت آیتم مصرفی"
                  onClick={() => onOpenConsumables?.(a._id)}
                  className="text-emerald-600 hover:text-emerald-800"
                >
                  <Plus size={18} />
                </button>
              </td>
            </tr>
          ))}

          {sortedData.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center text-xs text-gray-500 py-4">
                موردی یافت نشد.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}