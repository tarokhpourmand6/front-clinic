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
import PaymentModal from '../components/appointments/PaymentModal';
import { getPaymentMethods } from '../api/paymentMethodApi';

// 🔹 مودال‌های جدید (جداگانه)
import AppointmentCreateModal from '../components/modals/AppointmentCreateModal';
import PatientCreateModal from '../components/modals/PatientCreateModal';

moment.loadPersian({ dialect: 'persian-modern' });

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
    return {
      year: Number(m.format('jYYYY')),
      month: Number(m.format('jM')),
      day: Number(m.format('jD')),
    };
  }, []);

  const [filters, setFilters] = useState({ name: '', phone: '', date: today });
  const [loading, setLoading] = useState(true);

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

  const [consumablesOpen, setConsumablesOpen] = useState(false);
  const [laserAreasOpen, setLaserAreasOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState([]);
  const [selectedInitialPrice, setSelectedInitialPrice] = useState(0);

  // 🔹 مودال ثبت نوبت
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalPatient, setCreateModalPatient] = useState(null);

  // 🔹 مودال ثبت بیمار
  const [patientModalOpen, setPatientModalOpen] = useState(false);

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
      ? a.dateShamsi ===
        `${filters.date.year}-${String(filters.date.month).padStart(2, '0')}-${String(filters.date.day).padStart(2, '0')}`
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
    const mapped =
      newStatus === 'done' ? 'Completed' : newStatus === 'pending' ? 'Scheduled' : 'Canceled';
    await updateAppointmentItem(appointmentId, { status: mapped });

    if (newStatus === 'done') {
      const ap = appointments.find((x) => x._id === appointmentId);
      if (!ap) return;
      setSelectedAppointmentId(appointmentId);
      if (ap.type === 'Injection') setConsumablesOpen(true);
      else if (ap.type === 'Laser') setLaserAreasOpen(true);
    }
  };

  const handlePriceChange = async (appointmentId, val) => {
    const cleaned = val
      .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/[^0-9]/g, '');
    await updateAppointmentItem(appointmentId, { price: Number(cleaned) });
  };

  const handleTimeChange = async (appointmentId, time) => {
    await updateAppointmentItem(appointmentId, { time });
  };

  const handleDateChange = async (appointmentId, dateObj) => {
    const dateShamsi = `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(
      dateObj.day
    ).padStart(2, '0')}`;
    await updateAppointmentItem(appointmentId, { dateShamsi });
  };

  const handleDelete = async (id) => {
    await deleteAppointmentItem(id);
  };

  // ✅ کلیک روی نام بیمار در جدول‌ها → باز شدن مودال ثبت نوبت با بیمار از قبل انتخاب‌شده
  const handlePatientClick = (patient) => {
    setCreateModalPatient(patient);
    setCreateModalOpen(true);
  };

  // ✅ دکمه «ثبت نوبت جدید»
  const openCreateBlank = () => {
    setCreateModalPatient(null);
    setCreateModalOpen(true);
  };

  const handleOpenConsumables = (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    setConsumablesOpen(true);
  };

  const handleOpenLaser = (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    setLaserAreasOpen(true);
  };

  const handleOpenPaymentModal = (appointmentId, paymentDetails, price) => {
    setSelectedAppointmentId(appointmentId);
    setSelectedPaymentDetails(paymentDetails);
    setSelectedInitialPrice(price);
    setPaymentOpen(true);
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
        onPatientClick={handlePatientClick}
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
        onPatientClick={handlePatientClick}
      />

      {/* ── مودال‌های اقلام/لیزر/پرداخت (بدون تغییر) ── */}
      <ConsumablesModal
        isOpen={consumablesOpen}
        onClose={() => setConsumablesOpen(false)}
        appointmentId={selectedAppointmentId}
        onSave={(items, price) => {
          setSelectedInitialPrice(price);
          setSelectedPaymentDetails([]);
          setPaymentOpen(true);
          fetchAppointments();
        }}
      />

      <LaserAreasModal
        isOpen={laserAreasOpen}
        onClose={() => setLaserAreasOpen(false)}
        appointmentId={selectedAppointmentId}
        onOpenPaymentModal={(price) => {
          const found = appointments.find((a) => a._id === selectedAppointmentId);
          setSelectedInitialPrice(price);
          setSelectedPaymentDetails(found?.paymentDetails || []);
          setPaymentOpen(true);
          fetchAppointments();
        }}
      />

      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        appointmentId={selectedAppointmentId}
        paymentDetails={selectedPaymentDetails}
        initialPrice={selectedInitialPrice}
        paymentMethods={paymentMethods}
        onSave={handlePaymentChange}
      />

      {/* ── مودال ثبت نوبت ── */}
      <AppointmentCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        preselectedPatient={createModalPatient}
        onSuccess={fetchAppointments}
        onOpenPatientCreate={() => setPatientModalOpen(true)} // 👈 دکمه «+ ثبت بیمار»
      />

      {/* ── مودال ثبت بیمار ── */}
      <PatientCreateModal
        open={patientModalOpen}
        onClose={() => setPatientModalOpen(false)}
        onCreated={(p) => {
          // بعد از ساخت بیمار، او را به‌صورت پیش‌فرض داخل مودال نوبت انتخاب کن
          setCreateModalPatient(p);
          setPatientModalOpen(false);
          setCreateModalOpen(true);
        }}
      />
    </div>
  );
}