// src/components/appointments/CareProductSalesTable.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { getCareProducts } from "../../api/careProductsApi";

const arr = (x) => (Array.isArray(x) ? x : []);
const toFa = (n) => Number(n || 0).toLocaleString("fa-IR");

// محاسبه قیمت کل از روی خطوط (fallback اگر price روی رکورد نبود)
const sumLines = (lines) =>
  arr(lines).reduce((s, l) => s + (Number(l.unitPrice || 0) * Number(l.qty || 0)), 0);

export default function CareProductSalesTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // فیلترها
  const [q, setQ] = useState("");
  const [from, setFrom] = useState(""); // "1403-06-01"
  const [to, setTo] = useState("");

  // محصولات برای مپ‌کردن نام
  const [products, setProducts] = useState([]);
  const productMap = useMemo(() => {
    const m = new Map();
    arr(products).forEach((p) => m.set(String(p._id), p));
    return m;
  }, [products]);

  // وضعیت ویرایش
  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState(""); // jYYYY-jMM-jDD
  const [editLines, setEditLines] = useState([]); // [{productId, qty, unitPrice}]

  const load = async () => {
    setLoading(true);
    try {
      // موازی: فروش‌ها + محصولات
      const [salesRes, prods] = await Promise.all([
        api.get("/appointments/care-sales", { params: { q, from, to } }),
        getCareProducts(),
      ]);
      setRows(arr(salesRes?.data?.data));
      setProducts(arr(prods));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []); // بار اول

  const beginEdit = (row) => {
    setEditingId(row._id);
    setEditDate(row.dateShamsi || "");
    // فقط qty قابل ادیت است؛ unitPrice را دست نمیزنیم تا گزارش مالی درست بماند
    setEditLines(arr(row.products).map((l) => ({
      productId: l.productId?._id || l.productId, // اگر populate نشده بود
      qty: Number(l.qty || 1),
      unitPrice: Number(l.unitPrice || 0),
    })));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditLines([]);
    setEditDate("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    // اعتبارسنجی ساده
    const cleaned = arr(editLines)
      .filter((l) => l.productId && Number(l.qty) > 0)
      .map((l) => ({
        productId: l.productId,
        qty: Number(l.qty),
        unitPrice: Number(l.unitPrice || 0),
      }));
    const price = sumLines(cleaned);

    await api.put(`/appointments/${editingId}/care-sale`, {
      products: cleaned,
      price,
      // اگر خواستی تاریخ را هم بتوانی عوض کنی:
      ...(editDate ? { dateShamsi: editDate } : {}),
    });

    cancelEdit();
    load();
  };

  const removeRow = async (id) => {
    if (!confirm("حذف این فروش؟ موجودی برمی‌گردد.")) return;
    await api.delete(`/appointments/${id}/care-sale`);
    load();
  };

  return (
    <div className="p-4 border rounded-md shadow bg-white mt-4">
      <h2 className="text-lg font-semibold mb-3">📦 فروش محصولات</h2>

      <div className="grid md:grid-cols-4 gap-2 mb-3">
        <input
          className="border p-2 rounded"
          placeholder="جستجو نام/شماره"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          className="border p-2 rounded"
          placeholder="از تاریخ (مثلاً 1403-06-01)"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <input
          className="border p-2 rounded"
          placeholder="تا تاریخ (مثلاً 1403-06-31)"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <button onClick={load} className="bg-brand text-white px-4 py-2 rounded">
          اعمال فیلتر
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">در حال بارگذاری…</div>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-right">تاریخ</th>
                <th className="p-2 text-right">بیمار</th>
                <th className="p-2 text-right">اقلام</th>
                <th className="p-2 text-right">مبلغ کل</th>
                <th className="p-2 text-right">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isEditing = editingId === r._id;
                const lines = isEditing ? editLines : arr(r.products);

                return (
                  <tr key={r._id} className="border-t align-top">
                    {/* تاریخ */}
                    <td className="p-2">
                      {isEditing ? (
                        <input
                          className="border p-1 rounded w-36 text-center"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          placeholder="مثلاً 1403-06-01"
                        />
                      ) : (
                        r.dateShamsi
                      )}
                    </td>

                    {/* بیمار */}
                    <td className="p-2">
                      {r.patientId?.fullName} — {r.patientId?.phone}
                    </td>

                    {/* اقلام */}
                    <td className="p-2">
                      {lines.map((l, i) => {
                        const pid = l.productId?._id || l.productId;
                        const pInfo = productMap.get(String(pid));
                        const title = pInfo
                          ? `${pInfo.name}${pInfo.brand ? ` — ${pInfo.brand}` : ""}`
                          : (l.name || `#${pid}`);

                        return (
                          <div key={i} className="flex items-center gap-2 mb-1">
                            <div className="flex-1">
                              {title}{" "}
                              <span className="text-xs text-gray-500">
                                {toFa(l.unitPrice)} ت
                              </span>
                            </div>
                            {isEditing ? (
                              <input
                                type="number"
                                min="1"
                                className="w-16 border p-1 rounded text-center"
                                value={l.qty}
                                onChange={(e) => {
                                  const qty = Math.max(1, Number(e.target.value) || 1);
                                  setEditLines((prev) =>
                                    prev.map((x, idx) =>
                                      idx === i ? { ...x, qty } : x
                                    )
                                  );
                                }}
                              />
                            ) : (
                              <>× {l.qty}</>
                            )}
                          </div>
                        );
                      })}
                    </td>

                    {/* مبلغ کل */}
                    <td className="p-2">
                      {toFa(r.price ?? sumLines(r.products))}
                    </td>

                    {/* عملیات */}
                    <td className="p-2 whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button
                            onClick={saveEdit}
                            className="px-3 py-1 rounded bg-green-600 text-white"
                          >
                            ذخیره
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1 rounded border"
                          >
                            انصراف
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <button
                            onClick={() => beginEdit(r)}
                            className="text-blue-600"
                          >
                            ویرایش
                          </button>
                          <button
                            onClick={() => removeRow(r._id)}
                            className="text-red-600"
                          >
                            حذف
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td className="p-3 text-gray-500 text-center" colSpan={5}>
                    موردی یافت نشد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}