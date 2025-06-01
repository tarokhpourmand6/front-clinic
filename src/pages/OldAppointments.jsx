import { useEffect, useState } from 'react';
import useAppointmentsStore from '../store/useAppointmentsStore';
import { getPatients } from '../api/patients';
import { toPersianNumber } from '../utils/number';
import { Plus } from 'lucide-react';
import ConsumablesModal from '../components/finance/ConsumablesModal';
import LaserAreasModal from '../components/finance/LaserAreasModal';
import DatePicker from '../components/DatePicker/DatePicker';
import { toast } from 'react-toastify';

export default function OldAppointments() {
  const {
    appointments,
    fetchAppointments,
    updateAppointmentItem,
    addAppointmentItem
  } = useAppointmentsStore();

  const [patients, setPatients] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [laserModalOpen, setLaserModalOpen] = useState(false);
  const [consumables, setConsumables] = useState([]);
  const [suggestedPrice, setSuggestedPrice] = useState(0);
  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
    date: null,
    type: '',
  });

  useEffect(() => {
    getPatients()
      .then((res) => {
        const data = Array.isArray(res) ? res : res?.data || [];
        setPatients(data);
      })
      .catch((err) => {
        console.error("⛔️ خطا در دریافت بیماران:", err);
        setPatients([]);
      });

    fetchAppointments();
  }, []);

  const handleModalSave = (items, totalPrice) => {
    setConsumables(items);
    setSuggestedPrice(totalPrice);
  };

  const handleRegisterOldAppointment = async () => {
    if (!newAppointment.patientId || !newAppointment.date || !newAppointment.type) {
      return toast.error("لطفاً همه فیلدها را کامل کنید");
    }

    const dateShamsi = `${newAppointment.date.year}-${String(newAppointment.date.month).padStart(2, "0")}-${String(newAppointment.date.day).padStart(2, "0")}`;

    const payload = {
      patientId: newAppointment.patientId,
      dateShamsi,
      type: newAppointment.type,
      status: "Completed",
      isHistorical: true,
    };

    if (newAppointment.type === 'Injection') {
      if (consumables.length === 0) return toast.error("آیتم‌های مصرفی را انتخاب کنید");
      payload.consumables = consumables;
      payload.price = suggestedPrice;
    }

    try {
      const result = await addAppointmentItem(payload);
      toast.success("✔️ نوبت قدیمی ثبت شد");
      await fetchAppointments();

      if (newAppointment.type === 'Laser') {
        setSelectedAppointmentId(result._id);
        setLaserModalOpen(true);
      }

      setNewAppointment({ patientId: '', date: null, type: '' });
      setConsumables([]);
      setSuggestedPrice(0);
    } catch (err) {
      console.error("⛔️ خطا در ثبت نوبت:", err);
      toast.error("⛔️ خطا در ثبت نوبت");
    }
  };

  const historicalAppointments = appointments.filter((a) => a.isHistorical);

  return (
    <div className="p-6 font-vazir">
      <h2 className="text-xl font-bold mb-4">📜 ثبت نوبت‌های قدیمی</h2>

      <table className="w-full text-sm text-right border border-gray-200 mb-6">
        <thead className="bg-brand text-white">
          <tr>
            <th className="px-2 py-1">نام</th>
            <th className="px-2 py-1">شماره تماس</th>
            <th className="px-2 py-1">مبلغ</th>
            <th className="px-2 py-1">آیتم‌های مصرفی</th>
            <th className="px-2 py-1">نواحی لیزر</th>
            <th className="px-2 py-1">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {historicalAppointments.map((a, i) => (
            <tr key={i} className="even:bg-gray-50">
              <td className="border px-2 py-1">{a.patientId?.fullName}</td>
              <td className="border px-2 py-1">{toPersianNumber(a.patientId?.phone || '')}</td>
              <td className="border px-2 py-1">{toPersianNumber((a.price || 0).toLocaleString())}</td>
              <td className="border px-2 py-1">
                {a.consumables?.map((c) => `${c.name} (${c.amount})`).join(' + ') || '-'}
              </td>
              <td className="border px-2 py-1">
                {a.laserAreas?.map((l) => l.area).join(' + ') || '-'}
              </td>
              <td className="border px-2 py-1">
                {a.type === 'Injection' ? (
                  <button
                    onClick={() => {
                      setSelectedAppointmentId(a._id);
                      setModalOpen(true);
                    }}
                    className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <Plus size={16} /> ویرایش آیتم‌ها
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedAppointmentId(a._id);
                      setLaserModalOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Plus size={16} /> ویرایش لیزر
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="font-bold text-md mb-2">➕ ثبت نوبت قدیمی جدید</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
        <select
          className="border p-2 rounded"
          value={newAppointment.patientId}
          onChange={(e) => setNewAppointment({ ...newAppointment, patientId: e.target.value })}
        >
          <option value="">انتخاب بیمار</option>
          {patients.map((p) => (
            <option key={p._id} value={p._id}>{p.fullName}</option>
          ))}
        </select>

        <DatePicker
          value={newAppointment.date}
          onChange={(val) => setNewAppointment({ ...newAppointment, date: val })}
          inputPlaceholder="تاریخ نوبت"
          locale="fa"
          inputClassName="border p-2 rounded w-full"
        />

        <select
          className="border p-2 rounded"
          value={newAppointment.type}
          onChange={(e) => setNewAppointment({ ...newAppointment, type: e.target.value })}
        >
          <option value="">نوع خدمت</option>
          <option value="Injection">تزریق</option>
          <option value="Laser">لیزر</option>
        </select>

        {newAppointment.type === 'Injection' && (
          <button
            onClick={() => setModalOpen(true)}
            className="text-sm px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700"
          >
            انتخاب آیتم‌های مصرفی
          </button>
        )}
      </div>

      {consumables.length > 0 && (
        <div className="bg-emerald-50 p-4 rounded text-sm mb-4">
          <p className="font-semibold text-emerald-700 mb-2">آیتم‌های انتخاب‌شده:</p>
          <ul className="list-disc pr-5">
            {consumables.map((c, i) => (
              <li key={i}>{c.name} - {toPersianNumber(c.amount)}</li>
            ))}
          </ul>
          <p className="mt-2">💰 مبلغ پیشنهادی: {toPersianNumber(suggestedPrice.toLocaleString())} تومان</p>
        </div>
      )}

      <button
        onClick={handleRegisterOldAppointment}
        className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700"
      >
        ثبت نهایی نوبت
      </button>

      <ConsumablesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        appointmentId={selectedAppointmentId}
        disableInventoryUpdate={true}
        onSave={handleModalSave}
      />

      <LaserAreasModal
        isOpen={laserModalOpen}
        onClose={() => setLaserModalOpen(false)}
        appointmentId={selectedAppointmentId}
      />
    </div>
  );
}