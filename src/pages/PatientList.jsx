import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from "../components/DatePicker/DatePicker.jsx";
import '../components/DatePicker/DatePicker.css';
import { getPatients, createPatient, updatePatient, deletePatient } from '../api/patients';
import { getAppointments } from '../api/appointments';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [editIndex, setEditIndex] = useState(null);
  const [filterAddress, setFilterAddress] = useState('');
  const [filterBirthYear, setFilterBirthYear] = useState('');
  const [filterLastService, setFilterLastService] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchPatientsWithLastService = async () => {
    try {
      const res = await getPatients({ limit: 2000 });
      const data = Array.isArray(res) ? res : res.data;
      const appointments = await getAppointments();
      const lastServices = {};

      appointments.forEach((a) => {
        const phone = a.patientId?.phone;
        if (!phone) return;

        const prev = lastServices[phone];
        const currentDate = new Date(a.date || a.createdAt);

        if (!prev || new Date(prev.date || prev.createdAt) < currentDate) {
          lastServices[phone] = a;
        }
      });

      const updatedPatients = data.map((p) => ({
        ...p,
        lastService:
          lastServices[p.phone]?.type === "Injection"
            ? lastServices[p.phone].consumables?.map((c) => c.name).join(" + ")
            : lastServices[p.phone]?.laserAreas?.map((l) => l.area).join(" + ") || "-",
      }));

      setPatients(updatedPatients);
    } catch (err) {
      console.error("⛔️ خطا در دریافت بیماران یا نوبت‌ها:", err);
    }
  };

  useEffect(() => {
    fetchPatientsWithLastService();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const filteredPatients = patients.filter((p) => {
    const fullName = p.fullName || `${p.firstName} ${p.lastName}`;
    const matchesQuery = fullName.includes(searchQuery) || p.phone.includes(searchQuery);
    const matchesAddress = p.address?.includes(filterAddress);
    const matchesBirthYear = filterBirthYear
      ? new Date(p.birthDate).getFullYear().toString().includes(filterBirthYear)
      : true;
    const matchesService = p.lastService?.includes(filterLastService);

    return matchesQuery && matchesAddress && matchesBirthYear && matchesService;
  });

  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(filteredPatients.length / pageSize);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

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

      <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-xl p-6 border-t-4 border-brand w-full max-w-md mx-auto">
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
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
          {paginatedPatients.map((patient, index) => (
            <tr key={index} className="hover:bg-emerald-50/30 transition">
              <td className="px-4 py-2 text-blue-600 hover:underline cursor-pointer whitespace-nowrap" onClick={() => navigate(`/patients/${patient.phone}`)}>{patient.fullName}</td>
              <td className="px-4 py-2 whitespace-nowrap">{patient.phone}</td>
              <td className="px-4 py-2 whitespace-nowrap">
                {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('fa-IR') : '-'}
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

      <div className="flex justify-between mt-4">
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="text-sm px-3 py-1 border rounded">
          قبلی
        </button>
        <span className="text-sm">صفحه {currentPage} از {totalPages}</span>
        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="text-sm px-3 py-1 border rounded">
          بعدی
        </button>
      </div>
    </div>
  );
}