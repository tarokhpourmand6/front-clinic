// FinancePage.jsx
import { useState } from "react";
import InventoryManager from "../components/finance/InventoryManager";
import LaserPriceManager from "../components/finance/LaserPriceManager";
import PaymentMethodManager from "../components/PaymentMethodManager";
import CareProductsManager from "../components/finance/CareProductsManager";   // 👈 جدید
import FacialPackagesManager from "../components/finance/FacialPackagesManager"; // 👈 جدید
import ErrorBoundary from "../components/common/ErrorBoundary";

export default function FinancePage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === "Sayari2025") setAuthenticated(true);
    else alert("رمز عبور نادرست است");
  };

  if (!authenticated) {
    return (
      <div className="h-screen flex flex-col justify-center items-center font-vazir bg-gray-50 px-4">
        <form onSubmit={handleLogin} className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full text-right">
          <h2 className="text-lg font-bold mb-4">🔐 دسترسی به مدیریت مالی</h2>
          <input
            type="password"
            placeholder="رمز عبور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm mb-4"
          />
          <button type="submit" className="bg-brand text-white px-4 py-2 rounded-md w-full text-sm">
            ورود
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 font-vazir max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-6">مدیریت مالی کلینیک</h1>

      <ErrorBoundary>
        <InventoryManager />
      </ErrorBoundary>

      <ErrorBoundary>
        <LaserPriceManager />
      </ErrorBoundary>

      <ErrorBoundary>
        <PaymentMethodManager />
      </ErrorBoundary>

      {/* 👇 دو بخش جدید */}
      <ErrorBoundary><CareProductsManager /></ErrorBoundary>
      <ErrorBoundary><FacialPackagesManager /></ErrorBoundary>
    </div>
  );
}