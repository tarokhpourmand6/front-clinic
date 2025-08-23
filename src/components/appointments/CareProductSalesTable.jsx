// src/components/appointments/CareProductSalesTable.jsx
import { useMemo, useState } from "react";

const arr = (x) => (Array.isArray(x) ? x : []);

export default function CareProductSalesTable({
  data = [],                         // آرایه‌ی نوبت‌های type = CareProductSale
  onDateChange,                      // (appointmentId, jDateObj) -> Promise
  onDelete,                          // (appointmentId) -> Promise
  onOpenPaymentModal,                // (appointmentId, paymentDetails, price) -> void
  onPatientClick,                    // (patientObj) -> void
  onUpdateSale,                      // (appointmentId, nextProducts, nextTotal) -> Promise
}) {
  const [editing, setEditing] = useState(null);          // appointmentId که در حال ادیت است
  const [draftLines, setDraftLines] = useState([]);      // products موقت
  const [savingId, setSavingId] = useState(null);        // برای دکمه‌ها

  // شروع ادیت یک ردیف
  const startEdit = (row) => {
    setEditing(row._id);
    setDraftLines(arr(row.products).map((l) => ({
      productId: l.productId?._id || l.productId, // هم object هم id را پشتیبانی کن
      name: l.name ?? l.productId?.name ?? "",
      qty: Number(l.qty) || 1,
      unitPrice: Number(l.unitPrice) || 0,
    })));
  };

  // لغو ادیت
  const cancelEdit = () => {
    setEditing(null);
    setDraftLines([]);
  };

  // تغییر تعداد یک قلم
  const changeQty = (idx, val) => {
    const qty = Math.max(1, Number(val) || 1);
    setDraftLines((lines) =>
      lines.map((l, i) => (i === idx ? { ...l, qty } : l))
    );
  };

  // حذف یک قلم از فروش
  const removeLine = (idx) => {
    setDraftLines((lines) => lines.filter((_, i) => i !== idx));
  };

  // جمع کل پیشنویس
  const draftTotal = useMemo(
    () => draftLines.reduce((s, l) => s + (Number(l.unitPrice) || 0) * (Number(l.qty) || 0), 0),
    [draftLines]
  );

  // ذخیره تغییرات به بک‌اند
  const save = async (row) => {
    setSavingId(row._id);
    try {
      // بک‌اند شما انتظار [{productId, qty, unitPrice}] دارد
      const payloadLines = draftLines.map(({ productId, qty, unitPrice }) => ({
        productId,
        qty,
        unitPrice,
      }));
      await onUpdateSale?.(row._id, payloadLines, draftTotal);
      setEditing(null);
      setDraftLines([]);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-4 border rounded-md shadow bg-white mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">📦 فروش محصولات</h2>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-right w-40">تاریخ</th>
              <th className="p-2 text-right">بیمار</th>
              <th className="p-2 text-right">اقلام</th>
              <th className="p-2 text-right w-32">مبلغ کل</th>
              <th className="p-2 text-right w-28">پرداخت</th>
              <th className="p-2 text-right w-40">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {arr(data).map((row) => {
              const isEditing = editing === row._id;
              return (
                <tr key={row._id} className="border-t align-top">
                  {/* تاریخ */}
                  <td className="p-2">
                    <input
                      type="text"
                      defaultValue={row.dateShamsi}
                      className="w-36 border p-1 rounded text-left"
                      onBlur={async (e) => {
                        // اگر تاریخ عوض شد، به فرمت jYYYY-jMM-jDD بفرست
                        const val = e.target.value.trim();
                        if (val && val !== row.dateShamsi) {
                          const [y, m, d] = val.split("-");
                          await onDateChange?.(row._id, { year: +y, month: +m, day: +d });
                        }
                      }}
                    />
                    {row.time ? (
                      <div className="text-[11px] text-gray-500 mt-1">ساعت: {row.time}</div>
                    ) : null}
                  </td>

                  {/* بیمار */}
                  <td className="p-2">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => onPatientClick?.(row.patientId)}
                    >
                      {row.patientId?.fullName || "—"}
                    </button>
                    <div className="text-[11px] text-gray-500">
                      {row.patientId?.phone || ""}
                    </div>
                  </td>

                  {/* اقلام */}
                  <td className="p-2">
                    {!isEditing ? (
                      <div className="space-y-1">
                        {arr(row.products).map((l, i) => {
                          const name = l.name ?? l.productId?.name ?? "—";
                          const price = Number(l.unitPrice) || 0;
                          return (
                            <div key={i} className="flex items-center justify-between gap-2">
                              <div className="truncate">{name}</div>
                              <div className="whitespace-nowrap text-gray-600">
                                {price.toLocaleString("fa-IR")} × {l.qty}
                              </div>
                            </div>
                          );
                        })}
                        {arr(row.products).length === 0 && (
                          <div className="text-gray-400">—</div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {draftLines.map((l, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="flex-1 truncate">
                              {l.name || "—"}
                              <span className="text-xs text-gray-500 mr-2">
                                {(Number(l.unitPrice) || 0).toLocaleString("fa-IR")}
                              </span>
                            </div>
                            <input
                              type="number"
                              min="1"
                              value={l.qty}
                              onChange={(e) => changeQty(i, e.target.value)}
                              className="w-16 border p-1 rounded text-center"
                            />
                            <button
                              onClick={() => removeLine(i)}
                              className="text-red-600 text-xs px-2 py-1 border rounded"
                              type="button"
                            >
                              حذف
                            </button>
                          </div>
                        ))}
                        {draftLines.length === 0 && (
                          <div className="text-gray-500 text-xs">همه اقلام حذف شدند.</div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t mt-2">
                          <div className="text-xs text-gray-600">جمع موقت</div>
                          <div className="font-medium">
                            {draftTotal.toLocaleString("fa-IR")}
                          </div>
                        </div>
                      </div>
                    )}
                  </td>

                  {/* مبلغ کل */}
                  <td className="p-2 font-medium">
                    {(isEditing ? draftTotal : Number(row.price || 0)).toLocaleString("fa-IR")}
                  </td>

                  {/* پرداخت */}
                  <td className="p-2">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() =>
                        onOpenPaymentModal?.(row._id, row.paymentDetails || [], row.price || 0)
                      }
                    >
                      مدیریت پرداخت
                    </button>
                  </td>

                  {/* عملیات */}
                  <td className="p-2">
                    {!isEditing ? (
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 rounded border"
                          onClick={() => startEdit(row)}
                        >
                          ویرایش
                        </button>
                        <button
                          className="px-3 py-1 rounded border text-red-600"
                          onClick={() => onDelete?.(row._id)}
                        >
                          حذف فروش
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          disabled={savingId === row._id}
                          className="px-3 py-1 rounded bg-brand text-white disabled:opacity-60"
                          onClick={() => save(row)}
                        >
                          {savingId === row._id ? "در حال ذخیره..." : "ذخیره تغییرات"}
                        </button>
                        <button
                          className="px-3 py-1 rounded border"
                          onClick={cancelEdit}
                        >
                          انصراف
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {arr(data).length === 0 && (
              <tr>
                <td className="p-3 text-gray-500 text-center" colSpan={6}>
                  موردی یافت نشد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}