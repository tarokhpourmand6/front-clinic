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

  // پس از ورود: فقط یک متن ساده (هیچ آبجکت/کامپوننت پیچیده‌ای رندر نمی‌شود)
  return (
    <div className="min-h-screen flex items-center justify-center p-8 font-vazir">
      <div className="bg-white shadow rounded-2xl p-8 text-center">
        <h1 className="text-xl font-bold mb-2">ورود موفق ✅</h1>
        <p className="text-gray-600">این نسخه‌ی پایه است. اگر این را می‌بینی یعنی مشکل از خود صفحه‌ی گزارش نبود.</p>
      </div>
    </div>
  );
}