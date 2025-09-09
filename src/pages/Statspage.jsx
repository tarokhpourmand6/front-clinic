// src/pages/StatsPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function StatsPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const handlePasswordSubmit = () => {
    if (password === "Sayari2025") setAuthenticated(true);
    else alert("رمز عبور نادرست است");
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 font-vazir p-4">
        <div className="bg-white shadow p-6 rounded-xl w-full max-w-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">ورود به صفحه گزارش</h2>
            <button
              onClick={() => navigate("/dashboard")}
              className="border border-brand text-brand rounded px-3 py-1 text-sm"
            >
              ← داشبورد
            </button>
          </div>
          <input
            type="password"
            placeholder="رمز عبور را وارد کنید"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border w-full p-2 rounded mb-3"
          />
          <button onClick={handlePasswordSubmit} className="w-full bg-brand text-white py-2 rounded">
            ورود
          </button>
        </div>
      </div>
    );
  }

  // بعد از ورود: KPI استاتیک
  return (
    <div className="p-6 max-w-7xl mx-auto font-vazir">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-xl md:text-2xl font-bold">📊 گزارشات فروش</h1>
        <button
          onClick={() => navigate("/dashboard")}
          className="border border-brand text-brand rounded px-4 py-2"
        >
          ← بازگشت به داشبورد
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card title="درآمد کل" color="border-blue-500" value="۱۲۰,۰۰۰ تومان" />
        <Card title="سود خالص" color="border-green-600" value="۸۰,۰۰۰ تومان" />
        <Card title="حاشیه سود" color="border-emerald-500" value="۶۷٪" />
        <Card title="میانگین هر نوبت (AOV)" color="border-cyan-600" value="۴۰,۰۰۰ تومان" />
        <Card title="نرخ حفظ مشتری" color="border-indigo-500" value="۷۵٪" />
      </div>
    </div>
  );
}

function Card({ title, value, sub, color = "border-blue-500" }) {
  return (
    <div className={`bg-white shadow p-4 rounded-xl text-center border-t-4 ${color}`}>
      <p className="text-gray-600 mb-1">{title}</p>
      <p className="text-lg font-bold">{value}</p>
      {sub ? <p className="text-xs text-gray-500 mt-1">{sub}</p> : null}
    </div>
  );
}