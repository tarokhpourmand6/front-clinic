// src/components/finance/FacialPackageManager.jsx
import { useEffect, useState } from "react";
import { getFacialPackages, createFacialPackage, updateFacialPackage, deleteFacialPackage } from "../../api/facialPackages";

export default function FacialPackageManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", steps: "" }); // steps: متنِ توضیح آیتم‌ها
  const [editId, setEditId] = useState(null);

  useEffect(() => { (async () => setItems(await getFacialPackages()))(); }, []);

  const save = async () => {
    const payload = {
      name: form.name.trim(),
      price: Number(form.price) || 0,
      steps: form.steps?.trim() || "", // مثلا: "پاکسازی + آبرسانی + ماسک"
    };
    if (!payload.name) return alert("نام الزامی است");

    if (editId) await updateFacialPackage(editId, payload);
    else await createFacialPackage(payload);

    setItems(await getFacialPackages());
    setForm({ name: "", price: "", steps: "" });
    setEditId(null);
  };

  const startEdit = (it) => {
    setEditId(it._id);
    setForm({ name: it.name, price: it.price ?? "", steps: it.steps || "" });
  };

  const remove = async (id) => {
    if (!confirm("حذف شود؟")) return;
    await deleteFacialPackage(id);
    setItems(await getFacialPackages());
  };

  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold mb-3">🧖‍♀️ پکیج‌های فیشیال</h2>

      <div className="bg-white p-4 rounded-lg border space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input className="border p-2 rounded" placeholder="نام پکیج"
                 value={form.name} onChange={(e)=>setForm(f=>({...f,name:e.target.value}))}/>
          <input className="border p-2 rounded" placeholder="قیمت" type="number"
                 value={form.price} onChange={(e)=>setForm(f=>({...f,price:e.target.value}))}/>
          <input className="border p-2 rounded" placeholder="مرحله‌ها (اختیاری، با + جدا کن)"
                 value={form.steps} onChange={(e)=>setForm(f=>({...f,steps:e.target.value}))}/>
        </div>
        <div className="text-left">
          <button onClick={save} className="bg-brand text-white px-4 py-2 rounded">
            {editId ? "ذخیره ویرایش" : "افزودن"}
          </button>
          {editId && (
            <button onClick={() => { setEditId(null); setForm({ name:"", price:"", steps:"" }); }}
                    className="ml-2 px-3 py-2 border rounded">انصراف</button>
          )}
        </div>
      </div>

      <div className="mt-3 bg-white p-3 rounded-lg border">
        {(items || []).map(it => (
          <div key={it._id} className="flex items-center justify-between py-2 border-b last:border-b-0 text-sm">
            <div>
              <div className="font-medium">{it.name}</div>
              <div className="text-gray-500">قیمت: {it.price?.toLocaleString("fa-IR")}</div>
              {it.steps ? <div className="text-gray-500 mt-1">مراحل: {it.steps}</div> : null}
            </div>
            <div className="flex gap-2">
              <button onClick={()=>startEdit(it)} className="px-3 py-1 border rounded">ویرایش</button>
              <button onClick={()=>remove(it._id)} className="px-3 py-1 border rounded text-red-600">حذف</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}