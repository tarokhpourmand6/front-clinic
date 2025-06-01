// AppointmentList.jsx – ساختار ماژولار شده با جدول‌های جداگانه و منظم
import { useEffect, useState } from 'react';
import useAppointmentsStore from '../store/useAppointmentsStore';
import ConsumablesModal from '../components/finance/ConsumablesModal';
import LaserAreasModal from '../components/finance/LaserAreasModal';
import Filters from '../components/appointments/Filters';
import SummaryBox from '../components/appointments/SummaryBox';
import InjectionTable from '../components/appointments/InjectionTable';
import LaserTable from '../components/appointments/LaserTable';

const AppointmentList = () => {
  const {
    appointments,
    fetchAppointments,
    updateAppointmentItem,
    deleteAppointmentItem
  } = useAppointmentsStore();

  const [filters, setFilters] = useState({ name: '', phone: '', date: null });
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [laserModalOpen, setLaserModalOpen] = useState(false);

  useEffect(() => {
    fetchAppointments();
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
};

const handlePriceChange = async (appointmentId, val) => {
  const cleaned = val.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[^0-9]/g, '');
  await updateAppointmentItem(appointmentId, { price: Number(cleaned) });
};

const handleTimeChange = async (appointmentId, time) => {
  await updateAppointmentItem(appointmentId, { time });
};

const handleDateChange = async (appointmentId, dateObj) => {
  const dateShamsi = `${dateObj.year}-${String(dateObj.month).padStart(2, "0")}-${String(dateObj.day).padStart(2, "0")}`;
  await updateAppointmentItem(appointmentId, { dateShamsi });
};

  const handleDelete = async (id) => {
    await deleteAppointmentItem(id);
  };

  const handleOpenConsumables = (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    setModalOpen(true);
  };

  const handleOpenLaser = (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    setLaserModalOpen(true);
  };

  return (
    <div className="p-4 font-vazir">
      <Filters filters={filters} setFilters={setFilters} />
      <SummaryBox summary={summary} />

      <InjectionTable
        data={injectionAppointments}
        onStatusChange={handleStatusChange}
        onDateChange={handleDateChange}
        onTimeChange={handleTimeChange}
        onPriceChange={handlePriceChange}
        onDelete={handleDelete}
        onOpenConsumables={handleOpenConsumables}
      />

      <LaserTable
        data={laserAppointments}
        onStatusChange={handleStatusChange}
        onDateChange={handleDateChange}
        onTimeChange={handleTimeChange}
        onPriceChange={handlePriceChange}
        onDelete={handleDelete}
        onOpenLaser={handleOpenLaser}
      />

      <ConsumablesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        appointmentId={selectedAppointmentId}
        onSave={fetchAppointments}
      />

      <LaserAreasModal
        isOpen={laserModalOpen}
        onClose={() => setLaserModalOpen(false)}
        appointmentId={selectedAppointmentId}
      />
    </div>
  );
};

export default AppointmentList;
