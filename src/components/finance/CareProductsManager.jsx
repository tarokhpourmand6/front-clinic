import { useEffect, useState } from "react";
import {
  getCareProducts,
  createCareProduct,
  updateCareProduct,
  deleteCareProduct,
} from "../../api/careProductsApi";

const arr = (x) => (Array.isArray(x) ? x : []);

// ارقام فارسی → انگلیسی و تبدیل به عدد
const fa2en = (s = "") => String(s).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
const toNum = (v) => {
  const n = Number(fa2en(String(v)).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export default function CareProductsManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: "",
    brand: "",
    buyPrice: "",  // ⬅️ نام صحیح
    sellPrice: "", // ⬅️ نام صحیح
    stock: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setItems(arr(await getCareProducts()));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async () => {
    const payload = {
      name: form.name?.trim(),
      brand: form.brand?.trim() || "",
      buyPrice: toNum(form.buyPrice),
      sellPrice: toNum(form.sellPrice),
      stock: toNum(form.stock),
    };
    if (!payload.name) return;

    if (editingId) await updateCareProduct(editingId, payload);
    else await createCareProduct(payload);

    setForm({ name: "", brand: "", buyPrice: "", sellPrice: "", stock: "" });
    setEditingId(null);
    load();
  };

  const startEdit = (it) => {
    setEditingId(it._id);
    // اگر قبلاً با نام‌های اشتباه ذخیره شده باشد، هر دو را پوشش می‌دهیم
    const buy = it.buyPrice ?? it.costPrice ?? "";
    const sell = it.sellPrice ?? it.salePrice ?? "";
    setForm({
      name: it.name || "",
      brand: it.brand || "",
      buyPrice: buy,
      sellPrice: sell,
      stock: it.stock ?? "",
    });
  };

  return (
    <div className="p-4 border rounded-md shadow bg-white mt-4">
      <h2 className="text-lg font-semibold mb-3">🧴 محصولات مراقبتی</h2>

      <div className="grid md:grid-cols-5 gap-2 mb-3">
        <input
          name="name"
          placeholder="نام *"
          className="border p-2 rounded"
          value={form.name}
          onChange={onChange}
        />
        <input
          name="brand"
          placeholder="برند"
          className="border p-2 rounded"
          value={form.brand}
          onChange={onChange}
        />
        <input
          name="buyPrice"
          inputMode="numeric"
          placeholder="قیمت خرید"
          className="border p-2 rounded"
          value={form.buyPrice}
          onChange={onChange}
        />
        <input
          name="sellPrice"
          inputMode="numeric"
          placeholder="قیمت فروش"
          className="border p-2 rounded"
          value={form.sellPrice}
          onChange={onChange}
        />
        <input
          name="stock"
          inputMode="numeric"
          placeholder="موجودی"
          className="border p-2 rounded"
          value={form.stock}
          onChange={onChange}
        />
      </div>

      <div className="mb-4">
        <button onClick={save} className="bg-brand text-white px-4 py-2 rounded">
          {editingId ? "ذخیره ویرایش" : "افزودن"}
        </button>
        {editingId && (
          <button
            onClick={() => {
              setEditingId(null);
              setForm({ name: "", brand: "", buyPrice: "", sellPrice: "", stock: "" });
            }}
            className="ml-2 px-3 py-2 rounded border"
          >
            انصراف
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">در حال بارگذاری…</div>
      ) : (
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
                  <td className="p-2">
                    {(it.buyPrice ?? it.costPrice ?? 0).toLocaleString("fa-IR")}
                  </td>
                  <td className="p-2">
                    {(it.sellPrice ?? it.salePrice ?? 0).toLocaleString("fa-IR")}
                  </td>
                  <td className="p-2">{it.stock ?? 0}</td>
                  <td className="p-2 flex gap-3">
                    <button onClick={() => startEdit(it)} className="text-blue-600">
                      ویرایش
                    </button>
                    <button
                      onClick={async () => {
                        await deleteCareProduct(it._id);
                        load();
                      }}
                      className="text-red-600"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
              {arr(items).length === 0 && (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={6}>
                    موردی ثبت نشده
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