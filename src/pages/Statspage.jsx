// StatsPage.jsx (نسخه کامل با احراز هویت ساده)
import { useState, useEffect } from "react";
import DatePicker from "../components/DatePicker/DatePicker";
import "../components/DatePicker/DatePicker.css";
import { getAppointments } from "../api/appointments";
import { getAllProducts } from "../api/inventory";
import { getPatients } from "../api/patients";
import { toPersianNumber } from "../utils/number";
import { useNavigate } from "react-router-dom";

export default function StatsPage() {
  const [appointments, setAppointments] = useState([]);
  const [products, setProducts] = useState([]);
  const [patients, setPatients] = useState([]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (authenticated) {
      const fetchData = async () => {
        const appts = await getAppointments();
        const prods = await getAllProducts();
        const pats = await getPatients();
        setAppointments(appts);
        setProducts(prods);
        setPatients(Array.isArray(pats) ? pats : pats.data);
      };
      fetchData();
    }
  }, [authenticated]);

  const handlePasswordSubmit = () => {
    if (password === "Sayari2025") {
      setAuthenticated(true);
    } else {
      alert("رمز عبور نادرست است");
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 font-vazir p-4">
        <div className="bg-white shadow p-6 rounded-xl w-full max-w-sm">
          <h2 className="text-lg font-bold mb-4 text-center">ورود به صفحه گزارش</h2>
          <input
            type="password"
            placeholder="رمز عبور را وارد کنید"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border w-full p-2 rounded mb-4"
          />
          <button
            onClick={handlePasswordSubmit}
            className="w-full bg-brand text-white py-2 rounded"
          >
            ورود
          </button>
        </div>
      </div>
    );
  }

  const formatDateObj = (obj) =>
    `${obj.year}-${String(obj.month).padStart(2, "0")}-${String(obj.day).padStart(2, "0")}`;

  const isInRange = (dateShamsi) => {
    if (!dateRange.from || !dateRange.to) return true;
    const from = new Date(dateRange.from.year, dateRange.from.month - 1, dateRange.from.day);
    const to = new Date(dateRange.to.year, dateRange.to.month - 1, dateRange.to.day);
    const [y, m, d] = dateShamsi.split("-").map(Number);
    const current = new Date(y, m - 1, d);
    return current >= from && current <= to;
  };

  const filtered = appointments.filter((a) => a.status === "Completed" && isInRange(a.dateShamsi));
  const injectionAppointments = filtered.filter((a) => a.type === "Injection");
  const laserAppointments = filtered.filter((a) => a.type === "Laser");

  const injectionRevenue = injectionAppointments.reduce((sum, a) => sum + Number(a.price || 0), 0);
  const laserRevenue = laserAppointments.reduce((sum, a) => sum + Number(a.price || 0), 0);

  let injectionCost = 0;
  injectionAppointments.forEach((appt) => {
    appt.consumables?.forEach(({ name, amount }) => {
      const product = products.find((p) => p.name === name);
      if (!product || !product.purchases?.length) return;

      const queue = [...product.purchases]
        .map((p) => ({ ...p }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      let remaining = amount;
      for (let i = 0; i < queue.length && remaining > 0; i++) {
        const used = Math.min(queue[i].amount, remaining);
        injectionCost += used * queue[i].price;
        remaining -= used;
      }
    });
  });

  const allPayments = {};
  filtered.forEach((a) => {
    a.paymentDetails?.forEach(({ method, amount }) => {
      allPayments[method] = (allPayments[method] || 0) + Number(amount || 0);
    });
  });

  return (
    <div className="p-6 max-w-6xl mx-auto font-vazir">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">📊 گزارش مالی و آماری</h1>
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-4 border border-brand text-brand rounded px-4 py-2"
        >
          ← بازگشت به داشبورد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <DatePicker
          value={dateRange.from}
          onChange={(val) => setDateRange({ ...dateRange, from: val })}
          inputPlaceholder="از تاریخ"
          inputClassName="border p-2 rounded w-full"
          locale="fa"
        />
        <DatePicker
          value={dateRange.to}
          onChange={(val) => setDateRange({ ...dateRange, to: val })}
          inputPlaceholder="تا تاریخ"
          inputClassName="border p-2 rounded w-full"
          locale="fa"
        />
        <button
          onClick={() => setDateRange({ from: null, to: null })}
          className="bg-gray-200 rounded px-4 py-2 text-sm"
        >
          پاک‌کردن فیلتر
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
        <div className="bg-white shadow p-4 rounded-xl text-center border-t-4 border-blue-500">
          <p className="text-gray-600 mb-1">درآمد تزریقات</p>
          <p className="text-lg font-bold">{toPersianNumber(injectionRevenue.toLocaleString())} تومان</p>
        </div>
        <div className="bg-white shadow p-4 rounded-xl text-center border-t-4 border-pink-500">
          <p className="text-gray-600 mb-1">هزینه مواد مصرفی</p>
          <p className="text-lg font-bold">{toPersianNumber(injectionCost.toLocaleString())} تومان</p>
        </div>
        <div className="bg-white shadow p-4 rounded-xl text-center border-t-4 border-green-600">
          <p className="text-gray-600 mb-1">سود خالص تزریقات</p>
          <p className="text-lg font-bold">
            {toPersianNumber((injectionRevenue - injectionCost).toLocaleString())} تومان
          </p>
        </div>
        <div className="bg-white shadow p-4 rounded-xl text-center border-t-4 border-indigo-500">
          <p className="text-gray-600 mb-1">درآمد لیزر</p>
          <p className="text-lg font-bold">{toPersianNumber(laserRevenue.toLocaleString())} تومان</p>
        </div>
      </div>

      {Object.keys(allPayments).length > 0 && (
        <div className="bg-white shadow p-4 rounded-xl text-sm mb-6">
          <h3 className="font-bold mb-2">ورودی بر اساس روش پرداخت</h3>
          <ul className="space-y-1">
            {Object.entries(allPayments).map(([method, amount]) => (
              <li key={method} className="flex justify-between border-b pb-1">
                <span>{method}</span>
                <span>{toPersianNumber(amount.toLocaleString())} تومان</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
