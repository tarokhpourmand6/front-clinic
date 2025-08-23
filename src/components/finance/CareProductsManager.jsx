// src/components/finance/CareProductsManager.jsx
import { useEffect, useState } from "react";
import { getCareProducts, createCareProduct, updateCareProduct, deleteCareProduct } from "../../api/careProducts";

export default function CareProductsManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", brand: "", buyPrice: "", sellPrice: "", stock: "" });
  const [editId, setEditId] = useState(null);

  useEffect(() => { (async () => setItems(await getCareProducts()))(); }, []);

  const save = async () => {
    const payload = {
      name: form.name.trim(),
      brand: form.brand?.trim() || "",
      buyPrice: Number(form.buyPrice) || 0,
      sellPrice: Number(form.sellPrice) || 0,
      stock: Number(form.stock) || 0,
    };
    if (!payload.name) return alert("نام الزامی است");

    if (editId) await updateCareProduct(editId, payload);
    else await createCareProduct(payload);

    setItems(await getCareProducts());
    setForm({ name: "", brand: "", buyPrice: "", sellPrice: "", stock: "" });
    setEditId(null);
  };

  const startEdit = (it) => {
    setEditId(it._id);
    setForm({
      name: it.name, brand: it.brand || "",
      buyPrice: it.buyPrice ?? "", sellPrice: it.sellPrice ?? "", stock: it.stock ?? ""
    });
  };

  const remove = async (id) => {
    if (!confirm("حذف شود؟")) return;
    await deleteCareProduct(id);
    setItems(await getCareProducts());
  };

  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold mb-3">🧴 محصولات مراقبتی</h2>

      <div className="bg-white p-4 rounded-lg border space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input className="border p-2 rounded" placeholder="نام محصول"
                 value={form.name} onChange={(e)=>setForm(f=>({...f,name:e.target.value}))}/>
          <input className="border p-2 rounded" placeholder="برند"
                 value={form.brand} onChange={(e)=>setForm(f=>({...f,brand:e.target.value}))}/>
          <input className="border p-2 rounded" placeholder="قیمت خرید" type="number"
                 value={form.buyPrice} onChange={(e)=>setForm(f=>({...f,buyPrice:e.target.value}))}/>
          <input className="border p-2 rounded" placeholder="قیمت فروش" type="number"
                 value={form.sellPrice} onChange={(e)=>setForm(f=>({...f,sellPrice:e.target.value}))}/>
          <input className="border p-2 rounded" placeholder="موجودی" type="number"
                 value={form.stock} onChange={(e)=>setForm(f=>({...f,stock:e.target.value}))}/>
        </div>
        <div className="text-left">
          <button onClick={save} className="bg-brand text-white px-4 py-2 rounded">
            {editId ? "ذخیره ویرایش" : "افزودن"}
          </button>
          {editId && (
            <button onClick={() => { setEditId(null); setForm({ name:"", brand:"", buyPrice:"", sellPrice:"", stock:"" }); }}
                    className="ml-2 px-3 py-2 border rounded">انصراف</button>
          )}
        </div>
      </div>

      <div className="mt-3 bg-white p-3 rounded-lg border">
        {(items || []).map(it => (
          <div key={it._id} className="flex items-center justify-between py-2 border-b last:border-b-0 text-sm">
            <div>
              <div className="font-medium">{it.name}{it.brand ? ` — ${it.brand}` : ""}</div>
              <div className="text-gray-500">خرید: {it.buyPrice?.toLocaleString("fa-IR")} | فروش: {it.sellPrice?.toLocaleString("fa-IR")} | موجودی: {it.stock}</div>
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