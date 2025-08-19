import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from "../components/DatePicker/DatePicker.jsx";
import '../components/DatePicker/DatePicker.css';
import { getPatients, createPatient, updatePatient, deletePatient, getPatientsCount } from '../api/patients';
import { getAppointments } from '../api/appointments';
import LoadingSpinner from '../components/LoadingSpinner';

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
  const [loading, setLoading] = useState(true);

  // --- جستجو (debounce) + صفحه‌بندی ---
  const [typedQuery, setTypedQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage]   = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);

  const [editIndex, setEditIndex] = useState(null);
  const [filterAddress, setFilterAddress] = useState('');
  const [filterBirthYear, setFilterBirthYear] = useState('');
  const [filterLastService, setFilterLastService] = useState('');

  // debounce سرچ
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(typedQuery.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [typedQuery]);

  const toPersianDigits = (str) => String(str || '').replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const toEnglishDigits = (str) => String(str || '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  const normalize = (s='') => toEnglishDigits(String(s).toLowerCase().trim());

  const fetchPatientsWithLastService = async () => {
    try {
      setLoading(true);

      // دریافت لیست بیماران با صفحه/لیمیت/سرچ سروری
      const res = await getPatients({ page, limit, q: searchQuery || undefined });
      const data = Array.isArray(res) ? res : res?.data ?? [];

      // تعداد کل رکوردها (در صورت امکان بهتر است count فیلترشده‌ی q را از سرور بگیری)
      const cnt = await getPatientsCount();
      setTotal(Number(cnt || 0));

      // دریافت نوبت‌ها برای آخرین خدمت
      const appointments = await getAppointments();
      const lastServices = {};
      (appointments || []).forEach((a) => {
        const phone = a?.patientId?.phone;
        if (!phone) return;
        const prev = lastServices[phone];
        const currentDate = new Date(a.date || a.createdAt);
        if (!prev || new Date(prev.date || prev.createdAt) < currentDate) {
          lastServices[phone] = a;
        }
      });

      const updatedPatients = (data || []).map((p) => {
        const last = lastServices[p.phone];
        let lastService = '-';
        if (last?.type === "Injection") {
          lastService = (last.consumables || []).map((c) => c?.name).filter(Boolean).join(" + ") || "-";
        } else if (last) {
          lastService = (last.laserAreas || []).map((l) => l?.area).filter(Boolean).join(" + ") || "-";
        }
        return { ...p, lastService };
      });

      setPatients(updatedPatients);
    } catch (err) {
      console.error("⛔️ خطا در دریافت بیماران یا نوبت‌ها:", err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientsWithLastService();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, searchQuery]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanedPhone = toEnglishDigits(formData.phone).replace(/[^0-9]/g, '');

    const payload = {
      fullName: `${formData.firstName} ${formData.lastName}`.trim(),
      phone: cleanedPhone,
      birthDate: formData.birthDate
        ? new Date(
            formData.birthDate.year,
            formData.birthDate.month - 1,
            formData.birthDate.day
          ).toISOString()
        : undefined,
      address: formData.address || '',
      notes: formData.notes || '',
    };

    try {
      if (editIndex !== null && formData._id) {
        await updatePatient(formData._id, payload);
      } else {
        await createPatient(payload);
      }

      await fetchPatientsWithLastService();
      setSuccess(true);
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        birthDate: null,
        address: '',
        notes: '',
      });
      setEditIndex(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("⛔️ خطا در ذخیره اطلاعات بیمار:", err);
      if (err?.response?.data?.errors) {
        alert(err.response.data.errors.map((e) => e.msg).join('\n'));
      } else {
        alert("⛔️ خطا در ذخیره اطلاعات بیمار");
      }
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

    let firstName = '';
    let lastName = '';
    if (selected.fullName) {
      const parts = selected.fullName.trim().split(' ');
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }

    let birthDateObj = null;
    if (selected.birthDate) {
      const date = new Date(selected.birthDate);
      birthDateObj = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      };
    }

    setFormData({
      _id: selected._id,
      firstName,
      lastName,
      phone: toPersianDigits(selected.phone || ''),
      birthDate: birthDateObj,
      address: selected.address || '',
      notes: selected.notes || '',
    });
    setEditIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredPatients = patients.filter((p) => {
    const fullName = (p.fullName || `${p.firstName || ''} ${p.lastName || ''}`).trim();
    const matchesQuery =
      !searchQuery ||
      normalize(fullName).includes(normalize(searchQuery)) ||
      normalize(p.phone || '').includes(normalize(searchQuery));

    const matchesAddress = !filterAddress || normalize(p.address || '').includes(normalize(filterAddress));
    const matchesBirthYear = filterBirthYear
      ? (p.birthDate ? String(new Date(p.birthDate).getFullYear()).includes(normalize(filterBirthYear)) : false)
      : true;
    const matchesService = !filterLastService || normalize(p.lastService || '').includes(normalize(filterLastService));

    return matchesQuery && matchesAddress && matchesBirthYear && matchesService;
  });

  const formatDate = (date) => {
    if (!date) return '';
    const pad = (n) => n.toString().padStart(2, '0');
    const toPersian = (str) => str.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
    const { year, month, day } = date;
    return toPersian(`${year}/${pad(month)}/${pad(day)}`);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto font-vazir">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto font-vazir">
      <button
        onClick={() => navigate("/dashboard")}
        className="bg-white border border-brand text-brand px-4 py-2 rounded-lg shadow hover:bg-emerald-50 transition text-sm mb-6"
      >
        ← بازگشت به داشبورد
      </button>

      <div className="bg-white border-t-4 border-brand shadow-md rounded-xl p-3 text-right mb-4 w-full max-w-md mx-auto">
        <h1 className="text-lg font-bold text-gray-800">
          {editIndex !== null ? '✏️ ویرایش بیمار' : '➕ ثبت بیمار جدید'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-xl p-6 بorder-t-4 border-brand w-full max-w-md mx-auto">
        <div className="space-y-4 text-right">
          <div className="flex items-center gap-4">
            <label className="w-32 text-sm font-medium">نام:</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="flex-1 border px-3 py-2 rounded-md text-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="w-32 text-sm font-medium">نام خانوادگی:</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="flex-1 border px-3 py-2 rounded-md text-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="w-32 text-sm font-medium">شماره تماس:</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="flex-1 border px-3 py-2 rounded-md text-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="w-32 text-sm font-medium">تاریخ تولد (شمسی):</label>
            <DatePicker
              value={formData.birthDate}
              onChange={(value) => setFormData({ ...formData, birthDate: value })}
              locale="fa"
              shouldHighlightWeekends
              colorPrimary="#10b981"
              inputPlaceholder="انتخاب تاریخ"
              inputClassName="flex-1 border px-3 py-2 rounded-md text-sm"
              calendarClassName="rounded-md shadow"
              wrapperClassName="flex-1"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="w-32 text-sm font-medium">آدرس:</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="flex-1 border px-3 py-2 rounded-md text-sm"
            />
          </div>
          <div className="flex items-start gap-4">
            <label className="w-32 text-sm font-medium mt-2">توضیحات:</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="flex-1 border px-3 py-2 rounded-md text-sm"
            />
          </div>
          <div className="text-left mt-4">
            <button
              type="submit"
              className="bg-brand text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition text-sm"
            >
              {editIndex !== null ? 'ذخیره ویرایش' : 'ثبت بیمار'}
            </button>
          </div>
          {success && (
            <p className="text-green-600 text-sm mt-2 text-center">
              ✅ اطلاعات با موفقیت ذخیره شد!
            </p>
          )}
        </div>
      </form>

      <div className="mt-10">
        <h2 className="text-lg font-bold mb-4 text-emerald-800">📋 لیست بیماران</h2>
        <input
          type="text"
          placeholder="جستجو بر اساس نام، نام خانوادگی یا شماره"
          value={typedQuery}
          onChange={(e) => setTypedQuery(e.target.value)}
          className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-md text-sm shadow-sm"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
          <input type="text" placeholder="فیلتر بر اساس آدرس" value={filterAddress} onChange={(e) => setFilterAddress(e.target.value)} className="px-3 py-2 border rounded text-sm" />
          <input type="text" placeholder="فیلتر بر اساس سال تولد" value={filterBirthYear} onChange={(e) => setFilterBirthYear(e.target.value)} className="px-3 py-2 border rounded text-sm" />
          <input type="text" placeholder="فیلتر بر اساس آخرین خدمت" value={filterLastService} onChange={(e) => setFilterLastService(e.target.value)} className="px-3 py-2 border rounded text-sm" />
        </div>
        <div className="overflow-x-auto rounded-xl shadow-md bg-white border border-gray-100">
          <table className="min-w-full text-sm text-right font-vazir">
            <thead className="bg-brand text-white">
              <tr>
                <th className="px-4 py-3 border-b text-sm">نام و نام خانوادگی</th>
                <th className="px-4 py-3 border-b text-sm">شماره تماس</th>
                <th className="px-4 py-3 border-b text-sm">تاریخ تولد</th>
                <th className="px-4 py-3 border-b text-sm">آدرس</th>
                <th className="px-4 py-3 border-b text-sm">توضیحات</th>
                <th className="px-4 py-3 border-b text-sm">آخرین خدمت</th>
                <th className="px-4 py-3 border-b text-sm text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredPatients.map((patient, index) => (
                <tr key={index} className="hover:bg-emerald-50/30 transition">
                  <td className="px-4 py-2 text-blue-600 hover:underline cursor-pointer whitespace-nowrap" onClick={() => navigate(`/patients/${patient.phone}`)}>{patient.fullName}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{toPersianDigits(patient.phone)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {patient.birthDate ? formatDate({
                      year: new Date(patient.birthDate).getFullYear(),
                      month: new Date(patient.birthDate).getMonth() + 1,
                      day: new Date(patient.birthDate).getDate()
                    }) : '-'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">{patient.address || '-'}</td>
                  <td className="px-4 py-2">{patient.notes || '-'}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{patient.lastService || '-'}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">
                    <button onClick={() => handleEdit(index)} className="text-blue-600 text-xs underline ml-2">ویرایش</button>
                    <button onClick={() => handleDelete(index)} className="text-red-600 text-xs underline">حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* صفحه‌بندی */}
        <div className="flex items-center justify-between mt-3">
          <div className="text-xs text-gray-500">
            صفحه {page} از {Math.max(1, Math.ceil((total || 0) / limit))} — {toPersianDigits(total || 0)} رکورد
          </div>
          <div className="flex items-center gap-2">
            <select
              className="border rounded px-2 py-1 text-sm"
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            >
              {[25, 50, 100].map(n => <option key={n} value={n}>{n} در صفحه</option>)}
            </select>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            >
              قبلی
            </button>
            <button
              onClick={() => setPage(p => (p < Math.ceil((total || 0) / limit) ? p + 1 : p))}
              disabled={page >= Math.ceil((total || 0) / limit)}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            >
              بعدی
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}