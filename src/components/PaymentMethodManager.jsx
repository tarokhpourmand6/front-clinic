import { useEffect, useState } from 'react';
import {
  getPaymentMethods,
  createPaymentMethod,
  deletePaymentMethod,
  updatePaymentMethod,
} from '../api/paymentMethodApi';

export default function PaymentMethodManager() {
  const [methods, setMethods] = useState([]);
  const [newMethod, setNewMethod] = useState('');
  const [editing, setEditing] = useState(null);
  const [editingName, setEditingName] = useState('');

  const fetchMethods = async () => {
    const data = await getPaymentMethods();
    setMethods(data);
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleAdd = async () => {
    if (!newMethod.trim()) return;
    await createPaymentMethod(newMethod);
    setNewMethod('');
    fetchMethods();
  };

  const handleDelete = async (id) => {
    await deletePaymentMethod(id);
    fetchMethods();
  };

  const handleUpdate = async (id) => {
    await updatePaymentMethod(id, editingName);
    setEditing(null);
    setEditingName('');
    fetchMethods();
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

      <ul className="space-y-2">
        {methods.map((m) => (
          <li key={m._id} className="flex items-center justify-between border p-2 rounded">
            {editing === m._id ? (
              <div className="flex gap-2 w-full">
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="border p-1 rounded w-full"
                />
                <button onClick={() => handleUpdate(m._id)} className="text-green-600">✔</button>
                <button onClick={() => setEditing(null)} className="text-gray-600">✖</button>
              </div>
            ) : (
              <>
                <span>{m.name}</span>
                <div className="flex gap-3">
                  <button onClick={() => { setEditing(m._id); setEditingName(m.name); }} className="text-blue-600">ویرایش</button>
                  <button onClick={() => handleDelete(m._id)} className="text-red-600">حذف</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}