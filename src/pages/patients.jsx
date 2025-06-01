// Patients.jsx (بازنویسی‌شده با آدرس، فیلتر بر اساس آدرس و سال تولد)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from "../components/DatePicker/DatePicker";
import '../components/DatePicker/DatePicker.css';
import { getPatients, createPatient, updatePatient, deletePatient } from '../api/patients';
import moment from 'moment-jalaali';
moment.loadPersian({ usePersianDigits: false });

export default function Patients() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: null,
    address: '',
    notes: '',
  });

  const [success, setSuccess] = useState(false);
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState({ text: '', address: '', year: '' });
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await getPatients();
      const data = Array.isArray(res) ? res : res.data;
      setPatients(data);
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toPersianDigits = (str) => str?.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const persianToEnglishDigits = (str) => str.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
      const cleanedPhone = persianToEnglishDigits(formData.phone).replace(/[^0-9]/g, '');

      const payload = { 
        fullName: `${formData.firstName} ${formData.lastName}`,
        phone: cleanedPhone,
        birthDate: formData.birthDate
          ? new Date(formData.birthDate.year, formData.birthDate.month - 1, formData.birthDate.day).toISOString()
          : undefined,
        address: formData.address || '',
        notes: formData.notes || '',
      };
console.log("📤 payload:", payload);
      if (formData._id) payload._id = formData._id;

      let updatedList = [];
      if (editIndex !== null && formData._id) {
        const updated = await updatePatient(formData._id, payload);
        updatedList = [...patients];
        updatedList[editIndex] = updated;
      } else {
        const created = await createPatient(payload);
        updatedList = [...patients, created];
      }

      setPatients(updatedList);
      setSuccess(true);
      setFormData({ firstName: '', lastName: '', phone: '', birthDate: null, address: '', notes: '' });
      setEditIndex(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("⛔️ خطا در ذخیره اطلاعات بیمار:", err);
      alert("⛔️ خطا در ذخیره اطلاعات بیمار");
    }
  };

  const handleDelete = async (index) => {
    try {
      await deletePatient(patients[index]._id);
      const updated = [...patients];
      updated.splice(index, 1);
      setPatients(updated);
    } catch (err) {
      console.error("⛔️ خطا در حذف بیمار:", err);
    }
  };

  const handleEdit = (index) => {
    const selected = patients[index];
    const parts = selected.fullName.trim().split(' ');
    const birthDateObj = selected.birthDate ? {
      year: new Date(selected.birthDate).getFullYear(),
      month: new Date(selected.birthDate).getMonth() + 1,
      day: new Date(selected.birthDate).getDate(),
    } : null;
 console.log(selected)
    setFormData({
      _id: selected._id,
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      phone: toPersianDigits(selected.phone || ''),
      birthDate: birthDateObj,
      address: selected.address || '',
      notes: selected.notes || '',
    });
    setEditIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredPatients = patients.filter((p) => {
    const matchesText = p.fullName.includes(searchQuery.text) || p.phone.includes(searchQuery.text);
    const matchesAddress = p.address?.includes(searchQuery.address || '');
    const matchesYear = searchQuery.year
      ? new Date(p.birthDate).getFullYear().toString().includes(searchQuery.year)
      : true;
    return matchesText && matchesAddress && matchesYear;
  });

  return (
    <div className="p-6 max-w-2xl mx-auto font-vazir">
      <button onClick={() => navigate('/dashboard')} className="text-blue-600 text-sm underline mb-4">
        ← بازگشت به داشبورد
      </button>

      <h1 className="text-2xl font-bold mb-6">
        {editIndex !== null ? '✏️ ویرایش بیمار' : '➕ ثبت بیمار جدید'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm">نام</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full border px-3 py-2 rounded-md text-sm" />
          </div>
          <div>
            <label className="block mb-1 text-sm">نام خانوادگی</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full border px-3 py-2 rounded-md text-sm" />
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm">شماره تماس</label>
          <input type="tel" name="phone" value={toPersianDigits(formData.phone)} onChange={handleChange} className="w-full border px-3 py-2 rounded-md text-sm" />
        </div>

        <div>
          <label className="block mb-1 text-sm">تاریخ تولد (شمسی)</label>
          <DatePicker
            value={formData.birthDate}
            onChange={(value) => setFormData({ ...formData, birthDate: value })}
            locale="fa"
            shouldHighlightWeekends
            inputPlaceholder="انتخاب تاریخ"
            inputClassName="w-full border px-3 py-2 rounded-md text-sm"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm">آدرس</label>
          <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full border px-3 py-2 rounded-md text-sm" />
        </div>

        <div>
          <label className="block mb-1 text-sm">توضیحات</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} className="w-full border px-3 py-2 rounded-md text-sm" />
        </div>

        <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition">
          {editIndex !== null ? 'ذخیره ویرایش' : 'ثبت بیمار'}
        </button>

        {success && <p className="text-green-600 text-sm mt-3">✅ اطلاعات با موفقیت ذخیره شد!</p>}
      </form>

      <div className="mt-10">
        <h2 className="text-lg font-bold mb-4">📋 لیست بیماران</h2>

        <input type="text" placeholder="نام یا شماره" value={searchQuery.text} onChange={(e) => setSearchQuery((prev) => ({ ...prev, text: e.target.value }))} className="w-full mb-2 px-3 py-2 border rounded-md text-sm" />

        <input type="text" placeholder="آدرس" value={searchQuery.address} onChange={(e) => setSearchQuery((prev) => ({ ...prev, address: e.target.value }))} className="w-full mb-2 px-3 py-2 border rounded-md text-sm" />

        <input type="number" placeholder="سال تولد" value={searchQuery.year} onChange={(e) => setSearchQuery((prev) => ({ ...prev, year: e.target.value }))} className="w-full mb-4 px-3 py-2 border rounded-md text-sm" />

        <ul className="space-y-3">
          {filteredPatients.map((patient, index) => (
            <li key={index} className="bg-white shadow p-4 rounded-xl flex justify-between items-center text-sm">
              <div>
                <strong>{patient.fullName}</strong>
                <p className="text-gray-500 text-xs">{patient.phone}</p>
                <p className="text-gray-500 text-xs">{patient.address}</p>
              </div>
              <div className="flex space-x-2 rtl:space-x-reverse">
                <button onClick={() => handleEdit(index)} className="text-blue-600 text-xs underline">ویرایش</button>
                <button onClick={() => handleDelete(index)} className="text-red-600 text-xs underline">حذف</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}