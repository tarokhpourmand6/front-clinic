import { useEffect, useState, useMemo } from "react";
import {
  getPaymentMethods,
  createPaymentMethod,
  deletePaymentMethod,
  updatePaymentMethod,
} from "../api/paymentMethodApi";

export default function PaymentMethodManager() {
  const [methods, setMethods] = useState([]);      // می‌خواهیم همیشه آرایه باشد
  const [newMethod, setNewMethod] = useState("");
  const [editing, setEditing] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(false);

  const safeMethods = useMemo(
    () => (Array.isArray(methods) ? methods : []),
    [methods]
  );

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const list = await getPaymentMethods();
      setMethods(Array.isArray(list) ? list : []); // اجبار به آرایه
      // console.log("[payment-methods][safe]", list); // دیباگ در صورت نیاز
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMethods(); }, []);

  const handleAdd = async () => {
    const name = (newMethod || "").trim();
    if (!name) return;
    await createPaymentMethod({ name });          // حتماً آبجکت بفرست
    setNewMethod("");
    fetchMethods();
  };

  const handleDelete = async (id) => {
    await deletePaymentMethod(id);
    fetchMethods();
  };

  const handleUpdate = async (id) => {
    const name = (editingName || "").trim();
    if (!name) return;
    await updatePaymentMethod(id, { name });      // حتماً آبجکت بفرست
    setEditing(null);
    setEditingName("");
    fetchMethods();
  };

  return (
    <div className="p-4 border rounded-md shadow bg-white mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">مدیریت روش‌های پرداخت</h2>
        {loading && <span className="text-xs text-gray-500">در حال بارگذاری…</span>}
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="مثلاً کارت‌خوان ۲"
          value={newMethod}
          onChange={(e) => setNewMethod(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button onClick={handleAdd} className="bg-brand text-white px-4 rounded">
          افزودن
        </button>
      </div>

      {safeMethods.length === 0 ? (
        <div className="text-sm text-gray-500">موردی ثبت نشده است.</div>
      ) : (
        <ul className="space-y-2">
          {safeMethods.map((m) => (
            <li key={m._id || m.id} className="flex items-center justify-between border p-2 rounded">
              {editing === (m._id || m.id) ? (
                <div className="flex gap-2 w-full">
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="border p-1 rounded w-full"
                  />
                  <button onClick={() => handleUpdate(m._id || m.id)} className="text-green-600">✔</button>
                  <button onClick={() => { setEditing(null); setEditingName(""); }} className="text-gray-600">✖</button>
                </div>
              ) : (
                <>
                  <span>{m.name}</span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setEditing(m._id || m.id); setEditingName(m.name || ""); }}
                      className="text-blue-600"
                    >
                      ویرایش
                    </button>
                    <button onClick={() => handleDelete(m._id || m.id)} className="text-red-600">
                      حذف
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}