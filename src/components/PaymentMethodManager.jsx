// src/components/PaymentMethodManager.jsx
import { useEffect, useState } from "react";
import {
  getPaymentMethods,
  createPaymentMethod,
  deletePaymentMethod,
  updatePaymentMethod,
} from "../api/paymentMethodApi";

export default function PaymentMethodManager() {
  const [methods, setMethods] = useState([]);      // همیشه آرایه
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newMethod, setNewMethod] = useState("");
  const [editing, setEditing] = useState(null);
  const [editingName, setEditingName] = useState("");

  const fetchMethods = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPaymentMethods();
      setMethods(Array.isArray(data) ? data : []); // ایمن در برابر ساختارهای مختلف پاسخ
    } catch (e) {
      setError("خطا در دریافت روش‌های پرداخت");
      setMethods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleAdd = async () => {
    const name = newMethod.trim();
    if (!name) return;
    try {
      await createPaymentMethod({ name }); // ⬅️ آبجکت بفرست
      setNewMethod("");
      fetchMethods();
    } catch {
      setError("ثبت روش پرداخت ناموفق بود");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePaymentMethod(id);
      fetchMethods();
    } catch {
      setError("حذف روش پرداخت ناموفق بود");
    }
  };

  const handleUpdate = async (id) => {
    const name = editingName.trim();
    if (!name) return;
    try {
      await updatePaymentMethod(id, { name }); // ⬅️ آبجکت بفرست
      setEditing(null);
      setEditingName("");
      fetchMethods();
    } catch {
      setError("ویرایش روش پرداخت ناموفق بود");
    }
  };

  return (
    <div className="p-4 border rounded-md shadow bg-white mt-8">
      <h2 className="text-lg font-semibold mb-3">مدیریت روش‌های پرداخت</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="مثلاً کارت‌خوان ۲"
          value={newMethod}
          onChange={(e) => setNewMethod(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button
          onClick={handleAdd}
          disabled={!newMethod.trim()}
          className="bg-brand text-white px-4 rounded disabled:opacity-50"
        >
          افزودن
        </button>
      </div>

      {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
      {loading ? (
        <div className="text-sm text-gray-500">در حال بارگذاری…</div>
      ) : (methods || []).length === 0 ? (
        <div className="text-sm text-gray-500">موردی ثبت نشده است</div>
      ) : (
        <ul className="space-y-2">
          {(methods || []).map((m) => (
            <li key={m._id} className="flex items-center justify-between border p-2 rounded">
              {editing === m._id ? (
                <div className="flex gap-2 w-full">
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="border p-1 rounded w-full"
                  />
                  <button onClick={() => handleUpdate(m._id)} className="text-green-600">✔</button>
                  <button onClick={() => { setEditing(null); setEditingName(""); }} className="text-gray-600">✖</button>
                </div>
              ) : (
                <>
                  <span>{m.name}</span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setEditing(m._id); setEditingName(m.name || ""); }}
                      className="text-blue-600"
                    >
                      ویرایش
                    </button>
                    <button onClick={() => handleDelete(m._id)} className="text-red-600">
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