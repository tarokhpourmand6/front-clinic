import { useEffect, useState } from 'react';
import {
  getPaymentMethods,
  createPaymentMethod,
  deletePaymentMethod,
  updatePaymentMethod,
} from '../api/paymentMethodApi';

export default function PaymentMethodManager() {
  const [methods, setMethods] = useState([]);      // همیشه آرایه نگه داریم
  const [newMethod, setNewMethod] = useState('');
  const [editing, setEditing] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(true);    // برای UX بهتر
  const [error, setError] = useState(null);

  const fetchMethods = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPaymentMethods();
      // دفاعی: هرچه آمد را به آرایه امن تبدیل کن
      const safe =
        Array.isArray(data) ? data :
        Array.isArray(data?.data) ? data.data :
        Array.isArray(data?.data?.data) ? data.data.data :
        [];
      // لاگ موقّت برای تشخیص شکل پاسخ
      console.log('[payment-methods][raw]', data);
      setMethods(safe);
    } catch (e) {
      console.error('getPaymentMethods failed:', e);
      setError('مشکل در دریافت روش‌های پرداخت');
      setMethods([]); // امن
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
      await createPaymentMethod({ name }); // رشته هم بدهی در api نرمال می‌کنیم
      setNewMethod('');
      fetchMethods();
    } catch (e) {
      console.error('createPaymentMethod failed:', e);
      alert('خطا در افزودن روش پرداخت');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePaymentMethod(id);
      fetchMethods();
    } catch (e) {
      console.error('deletePaymentMethod failed:', e);
      alert('خطا در حذف روش پرداخت');
    }
  };

  const handleUpdate = async (id) => {
    const name = (editingName || '').trim();
    if (!name) return;
    try {
      await updatePaymentMethod(id, { name });
      setEditing(null);
      setEditingName('');
      fetchMethods();
    } catch (e) {
      console.error('updatePaymentMethod failed:', e);
      alert('خطا در ویرایش روش پرداخت');
    }
  };

  return (
    <div className="p-4 border rounded-md shadow bg-white mt-4">
      <h2 className="text-lg font-semibold mb-2">مدیریت روش‌های پرداخت</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="مثلاً کارت‌خوان ۲"
          value={newMethod}
          onChange={(e) => setNewMethod(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button onClick={handleAdd} className="bg-blue-600 text-white px-4 rounded">
          افزودن
        </button>
      </div>

      {loading && <div className="text-sm text-gray-500">در حال بارگذاری…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      <ul className="space-y-2 mt-2">
        {(methods ?? []).map((m) => (
          <li key={m._id || m.id || m.name} className="flex items-center justify-between border p-2 rounded">
            {editing === (m._id || m.id) ? (
              <div className="flex gap-2 w-full">
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="border p-1 rounded w-full"
                />
                <button onClick={() => handleUpdate(m._id || m.id)} className="text-green-600">✔</button>
                <button onClick={() => setEditing(null)} className="text-gray-600">✖</button>
              </div>
            ) : (
              <>
                <span>{m.name}</span>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setEditing(m._id || m.id); setEditingName(m.name || ''); }}
                    className="text-blue-600"
                  >
                    ویرایش
                  </button>
                  <button onClick={() => handleDelete(m._id || m.id)} className="text-red-600">حذف</button>
                </div>
              </>
            )}
          </li>
        ))}
        {!loading && !error && (methods ?? []).length === 0 && (
          <li className="text-sm text-gray-500">موردی ثبت نشده است.</li>
        )}
      </ul>
    </div>
  );
}