import { useEffect, useState } from "react";
import {
  getCareProducts,
  createCareProduct,
  updateCareProduct,
  deleteCareProduct,
} from "../../api/careProductsApi";

const arr = (x) => (Array.isArray(x) ? x : []);

export default function CareProductsManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name:"", brand:"", costPrice:"", salePrice:"", stock:"" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setItems(arr(await getCareProducts())); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async () => {
    const payload = {
      name: form.name.trim(),
      brand: form.brand?.trim() || "",
      costPrice: Number(form.costPrice) || 0,
      salePrice: Number(form.salePrice) || 0,
      stock: Number(form.stock) || 0,
    };
    if (!payload.name) return;

    if (editingId) await updateCareProduct(editingId, payload);
    else await createCareProduct(payload);

    setForm({ name:"", brand:"", costPrice:"", salePrice:"", stock:"" });
    setEditingId(null);
    load();
  };

  const startEdit = (it) => {
    setEditingId(it._id);
    setForm({
      name: it.name || "",
      brand: it.brand || "",
      costPrice: it.costPrice ?? "",
      salePrice: it.salePrice ?? "",
      stock: it.stock ?? "",
    });
  };

  return (
    <div className="p-4 border rounded-md shadow bg-white mt-4">
      <h2 className="text-lg font-semibold mb-3">🧴 محصولات مراقبتی</h2>

      <div className="grid md:grid-cols-5 gap-2 mb-3">
        <input name="name" placeholder="نام *" className="border p-2 rounded"
               value={form.name} onChange={onChange}/>
        <input name="brand" placeholder="برند" className="border p-2 rounded"
               value={form.brand} onChange={onChange}/>
        <input name="costPrice" placeholder="قیمت خرید" className="border p-2 rounded"
               value={form.costPrice} onChange={onChange} />
        <input name="salePrice" placeholder="قیمت فروش" className="border p-2 rounded"
               value={form.salePrice} onChange={onChange} />
        <input name="stock" placeholder="موجودی" className="border p-2 rounded"
               value={form.stock} onChange={onChange} />
      </div>

      <div className="mb-4">
        <button onClick={save} className="bg-brand text-white px-4 py-2 rounded">
          {editingId ? "ذخیره ویرایش" : "افزودن"}
        </button>
        {editingId && (
          <button onClick={() => { setEditingId(null); setForm({ name:"", brand:"", costPrice:"", salePrice:"", stock:"" }); }}
                  className="ml-2 px-3 py-2 rounded border">
            انصراف
          </button>
        )}
      </div>

      {loading ? <div className="text-sm text-gray-500">در حال بارگذاری…</div> : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-right">نام</th>
                <th className="p-2 text-right">برند</th>
                <th className="p-2 text-right">خرید</th>
                <th className="p-2 text-right">فروش</th>
                <th className="p-2 text-right">موجودی</th>
                <th className="p-2 text-right">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {arr(items).map((it) => (
                <tr key={it._id} className="border-t">
                  <td className="p-2">{it.name}</td>
                  <td className="p-2">{it.brand || "-"}</td>
                  <td className="p-2">{it.costPrice?.toLocaleString("fa-IR")}</td>
                  <td className="p-2">{it.salePrice?.toLocaleString("fa-IR")}</td>
                  <td className="p-2">{it.stock ?? 0}</td>
                  <td className="p-2 flex gap-3">
                    <button onClick={() => startEdit(it)} className="text-blue-600">ویرایش</button>
                    <button onClick={async () => { await deleteCareProduct(it._id); load(); }} className="text-red-600">حذف</button>
                  </td>
                </tr>
              ))}
              {arr(items).length === 0 && (
                <tr><td className="p-3 text-gray-500" colSpan={6}>موردی ثبت نشده</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}