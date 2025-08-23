// src/components/appointments/CareProductSalesTable.jsx
import { useEffect, useMemo, useState } from "react";
import { getCareProducts } from "../../api/careProductsApi";

const fa = (n) => (Number(n) || 0).toLocaleString("fa-IR");
const arr = (x) => (Array.isArray(x) ? x : []);

export default function CareProductSalesTable({
  data = [],                         // آرایه‌ی appointment هایی که type==='CareProductSale' هستند
  onDateChange,                      // (appointmentId, jdateObj) => Promise
  onDelete,                          // حذف کل رکورد فروش: (appointmentId) => Promise
  onOpenPaymentModal,                // برای ثبت پرداخت
  onPatientClick,                    // کلیک روی نام بیمار
  onUpdateSale,                      // 👈 جدید: (appointmentId, nextProductsArray, nextTotalPrice) => Promise
}) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const list = await getCareProducts();
        setProducts(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("care-products load failed:", e?.message || e);
      }
    })();
  }, []);

  // map از productId به خود محصول
  const byId = useMemo(() => {
    const m = new Map();
    for (const p of arr(products)) m.set(p._id, p);
    return m;
  }, [products]);

  // محاسبه جمع هر رکورد (در صورتی که server price نیامده باشد)
  const calcTotal = (appt) => {
    const items = arr(appt.products);
    if (!items.length) return Number(appt.price) || 0;
    return items.reduce((sum, it) => {
      const p = byId.get(it.productId);
      const unit = Number(it.unitPrice ?? p?.sellPrice ?? 0);
      return sum + unit * (Number(it.qty) || 1);
    }, 0);
  };

  const handleQtyChange = async (appt, productId, nextQty) => {
    const safeQty = Math.max(1, Number(nextQty) || 1);
    const next = arr(appt.products).map((it) =>
      it.productId === productId ? { ...it, qty: safeQty } : it
    );
    const nextTotal = next.reduce((s, it) => {
      const p = byId.get(it.productId);
      const unit = Number(it.unitPrice ?? p?.sellPrice ?? 0);
      return s + unit * (Number(it.qty) || 1);
    }, 0);
    await onUpdateSale?.(appt._id, next, nextTotal);
  };

  const handleRemoveLine = async (appt, productId) => {
    const next = arr(appt.products).filter((it) => it.productId !== productId);
    const nextTotal = next.reduce((s, it) => {
      const p = byId.get(it.productId);
      const unit = Number(it.unitPrice ?? p?.sellPrice ?? 0);
      return s + unit * (Number(it.qty) || 1);
    }, 0);
    await onUpdateSale?.(appt._id, next, nextTotal);
  };

  return (
    <div className="mt-6 bg-white border rounded-xl p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-base">فروش محصولات 🧴</h3>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-right w-28">تاریخ</th>
              <th className="p-2 text-right">بیمار</th>
              <th className="p-2 text-right">اقلام</th>
              <th className="p-2 text-right w-28">مبلغ کل</th>
              <th className="p-2 text-right w-40">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {arr(data).map((appt) => {
              const total = calcTotal(appt);
              return (
                <tr key={appt._id} className="border-t">
                  <td className="p-2">{appt.dateShamsi}</td>
                  <td className="p-2">
                    <button
                      className="text-brand hover:underline"
                      onClick={() => onPatientClick?.(appt.patientId)}
                    >
                      {appt.patientId?.fullName}
                    </button>
                    <div className="text-xs text-gray-500">{appt.patientId?.phone}</div>
                  </td>
                  <td className="p-2">
                    <div className="flex flex-col gap-1">
                      {arr(appt.products).map((it) => {
                        const p = byId.get(it.productId);
                        const title = p ? `${p.name}${p.brand ? " — " + p.brand : ""}` : `#${it.productId}`;
                        const unit = Number(it.unitPrice ?? p?.sellPrice ?? 0);
                        return (
                          <div key={it.productId} className="flex items-center gap-2">
                            <span className="whitespace-nowrap">{title}</span>
                            <input
                              type="number"
                              min="1"
                              className="w-16 border rounded text-center"
                              value={Number(it.qty) || 1}
                              onChange={(e) => handleQtyChange(appt, it.productId, e.target.value)}
                              title="تغییر تعداد"
                            />
                            <span className="text-xs text-gray-500">
                              × {fa(unit)}
                            </span>
                            <button
                              className="text-red-600 text-xs px-2 py-1"
                              onClick={() => handleRemoveLine(appt, it.productId)}
                              title="حذف این قلم از فروش"
                            >
                              حذف
                            </button>
                          </div>
                        );
                      })}
                      {(!appt.products || !appt.products.length) && (
                        <div className="text-gray-500 text-xs">—</div>
                      )}
                    </div>
                  </td>
                  <td className="p-2">{fa(total)}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-3">
                      <button
                        className="text-blue-600"
                        onClick={() => onOpenPaymentModal?.(appt._id, appt.paymentDetails, total)}
                      >
                        پرداخت
                      </button>
                      <button
                        className="text-red-600"
                        onClick={() => onDelete?.(appt._id)}
                      >
                        حذف فروش
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {arr(data).length === 0 && (
              <tr>
                <td className="p-3 text-center text-gray-500" colSpan={5}>
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