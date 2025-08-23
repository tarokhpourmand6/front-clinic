import { useEffect, useState } from "react";
import {
  getFacialPackages,
  createFacialPackage,
  updateFacialPackage,
  deleteFacialPackage,
} from "../../api/facialPackagesApi";

const arr = (x) => (Array.isArray(x) ? x : []);

export default function FacialPackagesManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name:"", itemsText:"", price:"" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setItems(arr(await getFacialPackages())); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const payload = {
      name: form.name.trim(),
      price: Number(form.price) || 0,
      items: form.itemsText.split(",").map(s => s.trim()).filter(Boolean),
    };
    if (!payload.name) return;

    if (editingId) await updateFacialPackage(editingId, payload);
    else await createFacialPackage(payload);

    setForm({ name:"", itemsText:"", price:"" });
    setEditingId(null);
    load();
  };

  const startEdit = (it) => {
    setEditingId(it._id);
    setForm({
      name: it.name || "",
      price: it.price ?? "",
      itemsText: arr(it.items).join(", "),
    });
  };

  return (
    <div className="p-4 border rounded-md shadow bg-white mt-4">
      <h2 className="text-lg font-semibold mb-3">💆🏻‍♀️ پکیج‌های فیشیال</h2>

      <div className="grid md:grid-cols-3 gap-2 mb-3">
        <input className="border p-2 rounded" placeholder="نام پکیج *"
               value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})}/>
        <input className="border p-2 rounded" placeholder="قیمت"
               value={form.price} onChange={(e)=>setForm({...form, price:e.target.value})}/>
        <input className="border p-2 rounded" placeholder="آیتم‌ها (با کاما جدا)"
               value={form.itemsText} onChange={(e)=>setForm({...form, itemsText:e.target.value})}/>
      </div>

      <div className="mb-4">
        <button onClick={save} className="bg-brand text-white px-4 py-2 rounded">
          {editingId ? "ذخیره ویرایش" : "افزودن"}
        </button>
        {editingId && (
          <button onClick={() => { setEditingId(null); setForm({ name:"", itemsText:"", price:"" }); }}
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
                <th className="p-2 text-right">قیمت</th>
                <th className="p-2 text-right">آیتم‌ها</th>
                <th className="p-2 text-right">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {arr(items).map((it) => (
                <tr key={it._id} className="border-t">
                  <td className="p-2">{it.name}</td>
                  <td className="p-2">{it.price?.toLocaleString("fa-IR")}</td>
                  <td className="p-2">{arr(it.items).join("، ") || "-"}</td>
                  <td className="p-2 flex gap-3">
                    <button onClick={() => startEdit(it)} className="text-blue-600">ویرایش</button>
                    <button onClick={async () => { await deleteFacialPackage(it._id); load(); }} className="text-red-600">حذف</button>
                  </td>
                </tr>
              ))}
              {arr(items).length === 0 && (
                <tr><td className="p-3 text-gray-500" colSpan={4}>موردی ثبت نشده</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}