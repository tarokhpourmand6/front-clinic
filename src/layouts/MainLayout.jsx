import { Link } from "react-router-dom";
import logo from "../assets/logo-green.png"; // مسیر لوگو رو تنظیم کن

export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen font-vazir bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#00b9ad] text-white hidden md:flex flex-col">
        <div className="p-4 border-b border-white/20 flex items-center justify-center">
          <img src={logo} alt="Milad Beauty Center" className="h-30" />
        </div>
        <nav className="flex-1 p-4 space-y-2 text-sm">
          <Link to="/dashboard" className="block px-4 py-2 rounded hover:bg-white/10">
            داشبورد
          </Link>
          <Link to="/patients/list" className="block px-4 py-2 rounded hover:bg-white/10">
            بیماران
          </Link>
          <Link to="/appointments/new" className="block px-4 py-2 rounded hover:bg-white/10">
            ثبت نوبت جدید
          </Link>
          <Link to="/appointments" className="block px-4 py-2 rounded hover:bg-white/10">
            نوبت‌ها
          </Link>
          <Link to="/finance" className="block px-4 py-2 rounded hover:bg-white/10">
            بخش مالی
          </Link>
          <Link to="/stats" className="block px-4 py-2 rounded hover:bg-white/10">
            آمار و گزارش‌ها
          </Link>

          {/* ✅ لینک جدید نوبت‌های قدیمی */}
          <Link to="/old-appointments" className="block px-4 py-2 rounded hover:bg-white/10">
            نوبت‌های قدیمی
          </Link>
        </nav>
        <div className="text-center text-xs text-white/60 py-4 border-t border-white/20">
          © 2025 MILAD BEAUTY
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-[#00b9ad] border-b px-6 py-4 shadow-sm flex justify-between items-center">
          <h1 className="text-xl font-semibold text-white">پنل مدیریت</h1>
        </header>

        <main className="flex-1 p-6">{children}</main>

        <footer className="text-xs text-gray-400 text-center py-4 border-t">
          © 2025 Powered by Dr. Tarokh Pourmand Version 1.0.0
        </footer>
      </div>
    </div>
  );
}