import { useEffect, useState } from 'react';
import { getToday } from '../components/DatePicker/utils/getToday';
import { motion } from 'framer-motion';
import { getAllProducts } from '../api/inventory';
import { getPatients } from '../api/patients';
import { getAppointments } from '../api/appointments';

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [patientsCount, setPatientsCount] = useState(0);
  const [todayAppointmentsCount, setTodayAppointmentsCount] = useState(0);
  const [todayTotalPayment, setTodayTotalPayment] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const fetchedPatients = await getPatients();
      const fetchedAppointments = await getAppointments();
      const fetchedInventory = await getAllProducts();

      const patientsArray = Array.isArray(fetchedPatients) ? fetchedPatients : fetchedPatients.data;
      const appointmentsArray = Array.isArray(fetchedAppointments) ? fetchedAppointments : fetchedAppointments.data;

      setPatients(patientsArray);
      setAppointments(appointmentsArray);
      setInventory(fetchedInventory);
      setPatientsCount(patientsArray.length);

      const today = getToday();

      const todayAppointments = appointmentsArray.filter(
        (a) =>
          a.dateShamsi === `${today.year}-${String(today.month).padStart(2, '0')}-${String(today.day).padStart(2, '0')}`
      );

      setTodayAppointmentsCount(todayAppointments.length);

      const totalPayment = todayAppointments.reduce((acc, a) => {
        return a.status === 'Completed' && a.price ? acc + Number(a.price) : acc;
      }, 0);

      setTodayTotalPayment(totalPayment);
    };

    fetchData();
  }, []);

  const toPersianNumber = (str) => {
    return String(str).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
  };

  return (
    <div className="min-h-screen bg-[#e8f9f9] p-6 font-vazir">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-emerald-800 mb-10 text-center">
          داشبورد مدیریتی کلینیک
        </h1>

        {/* آمار کلی */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <motion.div
            className="bg-white shadow-xl rounded-xl p-6 text-center border-t-4 border-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-sm text-brand mb-2">تعداد بیماران</p>
            <h2 className="text-3xl font-bold text-gray">
              {toPersianNumber(patientsCount)}
            </h2>
          </motion.div>

          <motion.div
            className="bg-white shadow-xl rounded-xl p-6 text-center border-t-4 border-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-sm text-brand mb-2">نوبت‌های امروز</p>
            <h2 className="text-3xl font-bold text-gray">
              {toPersianNumber(todayAppointmentsCount)}
            </h2>
          </motion.div>

          <motion.div
            className="bg-white shadow-xl rounded-xl p-6 text-center border-t-4 border-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-sm text-brand mb-2">پرداختی‌های امروز</p>
            <h2 className="text-3xl font-bold text-gray">
              {toPersianNumber(todayTotalPayment.toLocaleString())} تومان
            </h2>
          </motion.div>
        </div>

        {/* نزدیک‌ترین نوبت‌ها */}
        <div className="bg-white rounded-xl shadow-xl p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">نزدیک‌ترین نوبت‌ها</h3>
          <ul className="space-y-3 text-sm">
            {appointments
              .filter((a) => a.status !== 'Canceled')
              .sort((a, b) => new Date(`${a.dateShamsi} ${a.time}`) - new Date(`${b.dateShamsi} ${b.time}`))
              .slice(0, 5)
              .map((appt, index) => (
                <li
                  key={index}
                  className="border rounded-md p-4 bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="font-semibold text-emerald-700">
  {typeof appt.patientId === 'object'
    ? appt.patientId.fullName
    : patients.find((p) => p._id === appt.patientId)?.fullName || 'بیمار ناشناس'}
</div>
                  <div className="text-sm text-gray-600">
                    {appt.type === 'Injection'
                      ? appt.consumables?.map((c) => `${c.name} (${c.amount})`).join(', ')
                      : appt.laserAreas?.map((a) => a.area).join(', ')}
                  </div>
                  <div className="text-sm text-gray-600">
                    📅 {toPersianNumber(appt.dateShamsi)} - 🕒 {toPersianNumber(appt.time)}
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}