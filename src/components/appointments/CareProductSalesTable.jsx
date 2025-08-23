// src/components/appointments/CareProductSalesTable.jsx
import { useEffect, useState } from "react";
import api from "../../api/axios";

const arr = (x) => (Array.isArray(x) ? x : []);
const toFa = (n) => Number(n || 0).toLocaleString("fa-IR");

export default function CareProductSalesTable() {
  const [rows, setRows]   = useState([]);
  const [loading, setL]   = useState(false);
  const [q, setQ]         = useState("");
  const [from, setFrom]   = useState("");
  const [to, setTo]       = useState("");

  const load = async () => {
    setL(true);
    try {
      const res = await api.get("/appointments/care-sales", { params: { q, from, to } });
      setRows(arr(res?.data?.data));
    } catch (e) {
      console.error("[care-sales] load error:", e);
    } finally {
      setL(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-4 border rounded-md shadow bg-white mt-4">
      <h2 className="text-lg font-semibold mb-3">📦 فروش محصولات</h2>

      <div className="grid md:grid-cols-4 gap-2 mb-3">
        <input className="border p-2 rounded" placeholder="جستجو نام/شماره" value={q} onChange={(e)=>setQ(e.target.value)} />
        <input className="border p-2 rounded" placeholder="از تاریخ (مثلاً 1403-06-01)" value={from} onChange={(e)=>setFrom(e.target.value)} />
        <input className="border p-2 rounded" placeholder="تا تاریخ (مثلاً 1403-06-31)" value={to} onChange={(e)=>setTo(e.target.value)} />
        <button onClick={load} className="bg-brand text-white px-4 py-2 rounded">اعمال فیلتر</button>
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
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-t align-top">
                  <td className="p-2">{r.dateShamsi}</td>
                  <td className="p-2">{r.patientId?.fullName} — {r.patientId?.phone}</td>
                  <td className="p-2">
                    {arr(r.products).map((l, i) => (
                      <div key={i}>
                        {(l.productId?.name || l.name || `#${l.productId}`)}
                        {l.unitPrice ? ` (${toFa(l.unitPrice)})` : ""} × {l.qty}
                      </div>
                    ))}
                  </td>
                  <td className="p-2">{toFa(r.price)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td className="p-3 text-gray-500 text-center" colSpan={4}>موردی یافت نشد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}