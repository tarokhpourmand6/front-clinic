// src/pages/AppointmentList.jsx
import { useEffect, useMemo, useState } from 'react';
import moment from 'moment-jalaali';
import useAppointmentsStore from '../store/useAppointmentsStore';
import ConsumablesModal from '../components/finance/ConsumablesModal';
import LaserAreasModal from '../components/finance/LaserAreasModal';
import Filters from '../components/appointments/Filters';
import SummaryBox from '../components/appointments/SummaryBox';
import InjectionTable from '../components/appointments/InjectionTable';
import LaserTable from '../components/appointments/LaserTable';
import LoadingSpinner from '../components/LoadingSpinner';
import { getPaymentMethods } from '../api/paymentMethodApi';
import PaymentModal from '../components/appointments/PaymentModal';

// برای مودال ثبت نوبت (بر اساس AppointmentNew)
import DatePicker from '../components/DatePicker/DatePicker';
import LaserAreaSelector from '../components/LaserAreaSelector';
import { createPatient } from '../api/patients';
import { createAppointment } from '../api/appointments';
import { getAllProducts } from '../api/inventory';
import { getLaserPrices } from '../api/laserPrice';
import api from '../api/axios';

moment.loadPersian({ dialect: 'persian-modern' });

/* ---------------- Modal: Create Appointment ---------------- */
function AppointmentCreateModal({
  open,
  onClose,
  preselectedPatient, // بیمار از جدول
  onSuccess,          // بعد از ثبت موفق، رفرش لیست
}) {
  const [patients, setPatients] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [laserPrices, setLaserPrices] = useState({});
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(preselectedPatient || null);

  const [showNewPatient, setShowNewPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({ fullName: '', phone: '' });

  const [appointment, setAppointment] = useState({
    serviceType: 'تزریقات',
    serviceOption: [],
    appointmentDate: null,
    appointmentHour: '08',
    appointmentMinute: '00',
    status: 'Scheduled',
    price: 0,
    gender: 'female',
  });

  const hours = useMemo(
    () => Array.from({ length: 15 }, (_, i) => (8 + i).toString().padStart(2, '0')),
    []
  );
  const minutes = ['00', '10', '20', '30', '40', '50'];

  // وقتی مودال باز می‌شود، پیش‌فرض‌ها را ست و دیتاهای ثابت را بارگذاری کن
  useEffect(() => {
    if (!open) return;
    setSelectedPatient(preselectedPatient || null);
    setShowNewPatient(false);
    setNewPatient({ fullName: '', phone: '' });
    setAppointment({
      serviceType: 'تزریقات',
      serviceOption: [],
      appointmentDate: null,
      appointmentHour: '08',
      appointmentMinute: '00',
      status: 'Scheduled',
      price: 0,
      gender: 'female',
    });

    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        // بارگذاری موازی اقلام و قیمت‌های لیزر
        const [prod, laser] = await Promise.all([getAllProducts(), getLaserPrices()]);
        if (ignore) return;

        setInventory(prod || []);

        const priceMap = {};
        (laser || []).forEach(({ gender, area, price }) => {
          priceMap[`${gender}-${area}`] = price;
        });
        setLaserPrices(priceMap);
      } catch {
        if (!ignore) {
          setInventory([]);
          setLaserPrices({});
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [open, preselectedPatient]);

  // سرچ سروری با debounce (بدون لود انبوه)
  useEffect(() => {
    if (!open) return;

    let ignore = false;

    const run = async () => {
      try {
        const params = { page: 1, limit: 20 };
        if ((search || '').trim()) params.fullName = search.trim(); // کنترلر شما fullName را می‌فهمد

        const res = await api.get('/patients', { params });
        let list = Array.isArray(res?.data?.data) ? res.data.data : [];

        // اگر preselectedPatient داریم و در نتیجه نیست، آن را به ابتدای لیست اضافه کن
        if (preselectedPatient && !list.some((p) => p._id === preselectedPatient._id)) {
          list = [preselectedPatient, ...list];
        }

        if (!ignore) setPatients(list);
      } catch {
        if (!ignore) setPatients(preselectedPatient ? [preselectedPatient] : []);
      }
    };

    const t = setTimeout(run, 300); // debounce
    return () => {
      ignore = true;
      clearTimeout(t);
    };
  }, [open, search, preselectedPatient]);

  // محاسبه قیمت
  useEffect(() => {
    let total = 0;
    if (appointment.serviceType === 'تزریقات') {
      (appointment.serviceOption || []).forEach(({ name, amount }) => {
        const found = inventory.find((i) => i.name === name);
        if (found?.sellPrice) {
          total += Number(found.sellPrice) * (Number(amount) || 1);
        }
      });
    } else {
      (appointment.serviceOption || []).forEach((area) => {
        const price = laserPrices[`${appointment.gender}-${area}`];
        if (price) total += price;
      });
    }
    setAppointment((prev) => ({ ...prev, price: total }));
  }, [appointment.serviceOption, appointment.gender, appointment.serviceType, inventory, laserPrices]);

  const filteredPatients = Array.isArray(patients)
    ? patients // نتایج همین الان سروری فیلتر شده‌اند؛ اینجا فقط نمایش می‌دهیم
    : [];

  const handleCreatePatient = async () => {
    if (!newPatient.fullName || !newPatient.phone) {
      alert('نام و شماره الزامی است');
      return;
    }
    try {
      const created = await createPatient({
        fullName: newPatient.fullName.trim(),
        phone: newPatient.phone.replace(/[^0-9]/g, ''),
      });
      setSelectedPatient(created);
      setShowNewPatient(false);
      setPatients((prev) => [created, ...(prev || [])]);
    } catch {
      alert('ثبت بیمار ناموفق بود');
    }
  };

  const handleSubmit = async () => {
    if (!selectedPatient?._id || !appointment.appointmentDate) {
      alert('اطلاعات ناقص است.');
      return;
    }
    const dateStr = moment(
      `${appointment.appointmentDate.year}/${appointment.appointmentDate.month}/${appointment.appointmentDate.day}`,
      'jYYYY/jM/jD'
    ).format('jYYYY-jMM-jDD');

    const payload = {
      patientId: selectedPatient._id,
      dateShamsi: dateStr,
      time: `${appointment.appointmentHour}:${appointment.appointmentMinute}`,
      type: appointment.serviceType === 'تزریقات' ? 'Injection' : 'Laser',
      status: appointment.status,
      price: appointment.price,
      consumables: appointment.serviceType === 'تزریقات' ? appointment.serviceOption : [],
      laserAreas:
        appointment.serviceType === 'لیزر'
          ? appointment.serviceOption.map((a) => ({ area: a, gender: appointment.gender }))
          : [],
    };

    try {
      await createAppointment(payload);
      onSuccess?.();
      onClose?.();
    } catch {
      alert('⛔️ خطا در ثبت نوبت');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-4 md:p-6 font-vazir">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">ثبت نوبت</h3>
          <button onClick={onClose} className="px-2 py-1 rounded-lg border">بستن</button>
        </div>

        {loading ? (
          <div className="py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* انتخاب/جستجوی بیمار + ثبت سریع بیمار */}
            {!selectedPatient && (
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    className="border p-2 rounded w-full"
                    placeholder="جستجوی نام یا شماره"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button
                    onClick={() => setShowNewPatient((s) => !s)}
                    className="px-3 py-2 rounded-lg border"
                  >
                    {showNewPatient ? 'انصراف' : '+ ثبت بیمار'}
                  </button>
                </div>

                {showNewPatient && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      className="border p-2 rounded"
                      placeholder="نام و نام خانوادگی"
                      value={newPatient.fullName}
                      onChange={(e) => setNewPatient((s) => ({ ...s, fullName: e.target.value }))}
                    />
                    <input
                      className="border p-2 rounded"
                      placeholder="شماره تماس"
                      value={newPatient.phone}
                      onChange={(e) => setNewPatient((s) => ({ ...s, phone: e.target.value }))}
                    />
                    <button onClick={handleCreatePatient} className="bg-brand text-white rounded px-3 py-2">
                      ثبت بیمار
                    </button>
                  </div>
                )}

                {!showNewPatient &&
                  filteredPatients.slice(0, 8).map((p) => (
                    <button
                      key={p._id}
                      onClick={() => setSelectedPatient(p)}
                      className="block w-full text-right text-sm p-2 border rounded mt-2 hover:bg-gray-50"
                    >
                      {p.fullName} — {p.phone}
                    </button>
                  ))}
              </div>
            )}

            {selectedPatient && (
              <>
                <div className="bg-gray-50 border rounded p-2 mb-4 text-sm flex items-center justify-between">
                  <span>{selectedPatient.fullName} — {selectedPatient.phone}</span>
                  <button className="text-xs underline" onClick={() => setSelectedPatient(null)}>تغییر بیمار</button>
                </div>

                <div className="mb-3">
                  <label className="text-sm">نوع خدمت:</label>
                  <select
                    value={appointment.serviceType}
                    onChange={(e) =>
                      setAppointment((s) => ({ ...s, serviceType: e.target.value, serviceOption: [] }))
                    }
                    className="border p-2 rounded w-full text-sm mt-1"
                  >
                    <option value="تزریقات">تزریقات</option>
                    <option value="لیزر">لیزر</option>
                  </select>
                </div>

                {appointment.serviceType === 'تزریقات' ? (
                  <div className="mb-4">
                    <label className="text-sm block mb-1">انتخاب تزریقات:</label>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {(inventory || []).map((item) => {
                        const selected = (appointment.serviceOption || []).find(
                          (x) => typeof x === 'object' && x.name === item.name
                        );
                        return (
                          <div key={item._id || item.name} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!selected}
                              onChange={(e) => {
                                let updated = [...(appointment.serviceOption || [])];
                                if (e.target.checked) updated.push({ name: item.name, amount: 1 });
                                else updated = updated.filter((x) => x.name !== item.name);
                                setAppointment((s) => ({ ...s, serviceOption: updated }));
                              }}
                            />
                            {item.name}
                            {!!selected && (
                              <input
                                type="number"
                                min="1"
                                value={selected.amount || 1}
                                onChange={(e) => {
                                  const updated = (appointment.serviceOption || []).map((opt) =>
                                    opt.name === item.name ? { ...opt, amount: e.target.value } : opt
                                  );
                                  setAppointment((s) => ({ ...s, serviceOption: updated }));
                                }}
                                className="w-16 border p-1 text-sm rounded text-center"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <label className="text-sm">جنسیت:</label>
                      <select
                        value={appointment.gender}
                        onChange={(e) =>
                          setAppointment((s) => ({ ...s, gender: e.target.value, serviceOption: [] }))
                        }
                        className="border p-2 rounded w-full text-sm mt-1"
                      >
                        <option value="female">خانم</option>
                        <option value="male">آقا</option>
                      </select>
                    </div>
                    <LaserAreaSelector
                      gender={appointment.gender}
                      selectedAreas={appointment.serviceOption}
                      onChange={(areas) => setAppointment((s) => ({ ...s, serviceOption: areas }))}
                    />
                  </>
                )}

                <div className="mb-3">
                  <label className="text-sm">تاریخ نوبت:</label>
                  <DatePicker
                    value={appointment.appointmentDate}
                    onChange={(date) => setAppointment((s) => ({ ...s, appointmentDate: date }))}
                    inputPlaceholder="تاریخ"
                    locale="fa"
                    inputClassName="border p-2 rounded w-full"
                  />
                </div>

                <div className="mb-4 flex gap-2">
                  <div className="w-1/2">
                    <label className="text-sm">دقیقه:</label>
                    <select
                      value={appointment.appointmentMinute}
                      onChange={(e) => setAppointment((s) => ({ ...s, appointmentMinute: e.target.value }))}
                      className="border p-2 rounded w-full"
                    >
                      {minutes.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-1/2">
                    <label className="text-sm">ساعت:</label>
                    <select
                      value={appointment.appointmentHour}
                      onChange={(e) => setAppointment((s) => ({ ...s, appointmentHour: e.target.value }))}
                      className="border p-2 rounded w-full"
                    >
                      {hours.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">مبلغ کل: {appointment.price?.toLocaleString('fa-IR')}</div>
                  <button onClick={handleSubmit} className="bg-brand text-white px-4 py-2 rounded">
                    ثبت نوبت
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- Page: Appointment List ---------------- */
export default function AppointmentList() {
  const {
    appointments,
    fetchAppointments,
    updateAppointmentItem,
    deleteAppointmentItem,
  } = useAppointmentsStore();

  // تاریخ پیش‌فرض = امروز (جلالی)
  const today = useMemo(() => {
    const m = moment();
    return { year: Number(m.format('jYYYY')), month: Number(m.format('jM')), day: Number(m.format('jD')) };
  }, []);

  const [filters, setFilters] = useState({ name: '', phone: '', date: today });
  const [loading, setLoading] = useState(true);

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [laserModalOpen, setLaserModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState([]);
  const [selectedInitialPrice, setSelectedInitialPrice] = useState(0);

  // مودال ثبت نوبت
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalPatient, setCreateModalPatient] = useState(null);

  useEffect(() => {
    const fetchWithLoading = async () => {
      setLoading(true);
      await fetchAppointments();
      try {
        const methods = await getPaymentMethods();
        setPaymentMethods(methods);
      } catch (err) {
        console.error('Failed to load payment methods:', err.message);
      }
      setLoading(false);
    };
    fetchWithLoading();
  }, []);

  const filtered = appointments.filter((a) => {
    const nameMatch = a.patientId?.fullName?.includes(filters.name);
    const phoneMatch = a.patientId?.phone?.includes(filters.phone);
    const dateMatch = filters.date
      ? a.dateShamsi === `${filters.date.year}-${String(filters.date.month).padStart(2, '0')}-${String(filters.date.day).padStart(2, '0')}`
      : true;
    return nameMatch && phoneMatch && dateMatch;
  });

  const summary = {
    total: filtered.length,
    done: filtered.filter((a) => a.status === 'done' || a.status === 'Completed').length,
    pending: filtered.filter((a) => a.status === 'pending' || a.status === 'Scheduled').length,
    canceled: filtered.filter((a) => a.status === 'canceled' || a.status === 'Canceled').length,
  };

  const injectionAppointments = filtered.filter((a) => a.type === 'Injection');
  const laserAppointments = filtered.filter((a) => a.type === 'Laser');

  const handleStatusChange = async (appointmentId, newStatus) => {
    const mapped = newStatus === 'done' ? 'Completed' : newStatus === 'pending' ? 'Scheduled' : 'Canceled';
    await updateAppointmentItem(appointmentId, { status: mapped });

    if (newStatus === 'done') {
      const appointment = appointments.find((a) => a._id === appointmentId);
      if (!appointment) return;

      setSelectedAppointmentId(appointmentId);

      if (appointment.type === 'Injection') setModalOpen(true);
      else if (appointment.type === 'Laser') setLaserModalOpen(true);
    }
  };

  const handlePriceChange = async (appointmentId, val) => {
    const cleaned = val.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[^0-9]/g, '');
    await updateAppointmentItem(appointmentId, { price: Number(cleaned) });
  };

  const handleTimeChange = async (appointmentId, time) => {
    await updateAppointmentItem(appointmentId, { time });
  };

  const handleDateChange = async (appointmentId, dateObj) => {
    const dateShamsi = `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
    await updateAppointmentItem(appointmentId, { dateShamsi });
  };

  const handleDelete = async (id) => {
    await deleteAppointmentItem(id);
  };

  // باز کردن مودال ثبت نوبت از روی نام بیمار (در جدول‌ها)
  const handlePatientClick = (patient) => {
    setCreateModalPatient(patient);
    setCreateModalOpen(true);
  };

  // باز کردن مودال ثبت نوبت با دکمه
  const openCreateBlank = () => {
    setCreateModalPatient(null);
    setCreateModalOpen(true);
  };

  const handleOpenConsumables = (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    setModalOpen(true);
  };

  const handleOpenLaser = (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    setLaserModalOpen(true);
  };

  const handleOpenPaymentModal = (appointmentId, paymentDetails, price) => {
    setSelectedAppointmentId(appointmentId);
    setSelectedPaymentDetails(paymentDetails);
    setSelectedInitialPrice(price);
    setPaymentModalOpen(true);
  };

  const handlePaymentChange = async (appointmentId, newPaymentDetails) => {
    await updateAppointmentItem(appointmentId, { paymentDetails: newPaymentDetails });
  };

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-4 font-vazir">
      <div className="flex items-center justify-between mb-3">
        {/* فیلترها */}
        <Filters filters={filters} setFilters={setFilters} defaultDate={today} />
        <button onClick={openCreateBlank} className="px-3 py-2 rounded-xl bg-brand text-white">
          + ثبت نوبت جدید
        </button>
      </div>

      <SummaryBox summary={summary} />

      <InjectionTable
        data={injectionAppointments}
        onStatusChange={handleStatusChange}
        onDateChange={handleDateChange}
        onTimeChange={handleTimeChange}
        onPriceChange={handlePriceChange}
        onDelete={handleDelete}
        onOpenConsumables={handleOpenConsumables}
        onOpenPaymentModal={handleOpenPaymentModal}
        onPatientClick={handlePatientClick} // NEW
      />

      <LaserTable
        data={laserAppointments}
        onStatusChange={handleStatusChange}
        onDateChange={handleDateChange}
        onTimeChange={handleTimeChange}
        onPriceChange={handlePriceChange}
        onDelete={handleDelete}
        onOpenLaser={handleOpenLaser}
        paymentMethods={paymentMethods}
        onOpenPaymentModal={handleOpenPaymentModal}
        onPatientClick={handlePatientClick} // NEW
      />

      {/* مودال‌های اقلام/لیزر/پرداخت (بدون تغییر) */}
      <ConsumablesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        appointmentId={selectedAppointmentId}
        onSave={(items, price) => {
          setSelectedInitialPrice(price);
          setSelectedPaymentDetails([]);
          setSelectedAppointmentId(selectedAppointmentId);
          setPaymentModalOpen(true);
          fetchAppointments();
        }}
      />

      <LaserAreasModal
        isOpen={laserModalOpen}
        onClose={() => setLaserModalOpen(false)}
        appointmentId={selectedAppointmentId}
        onOpenPaymentModal={(price) => {
          const found = appointments.find((a) => a._id === selectedAppointmentId);
          setSelectedInitialPrice(price);
          setSelectedPaymentDetails(found?.paymentDetails || []);
          setSelectedAppointmentId(selectedAppointmentId);
          setPaymentModalOpen(true);
          fetchAppointments();
        }}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        appointmentId={selectedAppointmentId}
        paymentDetails={selectedPaymentDetails}
        initialPrice={selectedInitialPrice}
        paymentMethods={paymentMethods}
        onSave={handlePaymentChange}
      />

      {/* مودال ثبت نوبت */}
      <AppointmentCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        preselectedPatient={createModalPatient}
        onSuccess={fetchAppointments}
      />
    </div>
  );
}