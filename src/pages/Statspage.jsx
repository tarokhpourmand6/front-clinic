// src/pages/StatsPage.jsx
// نسخه پایدار: لاگین بدون وابستگی + لود تنبل بخش گزارش
import { useState, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";

// فقط بعد از لاگین لود شود تا اگر وابستگی‌ای مشکل دارد، لاگین کرش نکند
const StatsContent = lazy(() => import("./StatsContent"));

export default function StatsPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const handlePasswordSubmit = () => {
    if (password === "Sayari2025") setAuthenticated(true);
    else alert("رمز عبور نادرست است");
  };

  if (!authenticated) {
    // ⬇️ این بخش هیچ وابستگی‌ای ندارد و نباید کرش کند
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

  // پس از لاگین: فقط این‌جا ماژول اصلی لود می‌شود
  return (
    <Suspense fallback={<div className="p-6">در حال بارگذاری گزارش…</div>}>
      <StatsContent />
    </Suspense>
  );
}