// src/pages/StatsPage.jsx
// نسخه کامل و به‌روز بر اساس /api/stats/sales با KPIهای جدید: MoM/YoY، LTV، Sales Cycle
import { useEffect, useMemo, useState } from "react";
import DatePicker from "../components/DatePicker/DatePicker";
import "../components/DatePicker/DatePicker.css";
import { getSalesStats } from "../api/stats";
import { toPersianNumber } from "../utils/number";
import { useNavigate } from "react-router-dom";

const toISO = (v) => {
  if (!v) return null;
  if (typeof v === "string") return v; // فرض: ISO
  if (v.year && v.month && v.day) {
    const d = new Date(v.year, v.month - 1, v.day, 0, 0, 0, 0);
    return d.toISOString();
  }
  return null;
};
const fmt = (n = 0) => Number(n || 0).toLocaleString("fa-IR");
const pct = (n = 0) => `${Number(n || 0).toLocaleString("fa-IR")}%`;

export default function StatsPage() {
  const navigate = useNavigate();

  // ✳️ ورود با پسورد ساده
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const handlePasswordSubmit = () => {
    if (password === "Sayari2025") setAuthenticated(true);
    else alert("رمز عبور نادرست است");
  };

  // بازه پیش‌فرض: اول ماه جاری تا امروز
  const now = new Date();
  const startDefault = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endDefault = now.toISOString();

  const [dateRange, setDateRange] = useState({ from: startDefault, to: endDefault });
  const [group, setGroup] = useState("day"); // "day" | "month"

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const query = useMemo(
    () => ({
      start: toISO(dateRange.from),
      end: toISO(dateRange.to),
      group,
    }),
    [dateRange, group]
  );

  useEffect(() => {
    if (!authenticated) return;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await getSalesStats(query);
        setStats(data);
      } catch (e) {
        setErr(e.message || "خطا در دریافت آمار");
      } finally {
        setLoading(false);
      }
    })();
  }, [authenticated, query]);

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
          <button onClick={handlePasswordSubmit} className="w-full bg-brand text-white py-2 rounded">
            ورود
          </button>
        </div>
      </div>
    );
  }

  // ── استخراج داده‌ها
  const byService = stats?.byService || [];
  const findRev = (serviceType) =>
    byService.find((s) => (s.serviceType || "").toLowerCase() === serviceType)?.revenue || 0;

  const injectionRevenue = findRev("injection");
  const laserRevenue = findRev("laser");

  const totalRevenue = stats?.kpis?.totalRevenue || 0;
  const ordersDone = stats?.kpis?.ordersDone || 0;
  const aov = stats?.kpis?.aov || 0;
  const profit = stats?.kpis?.profit || 0;
  const marginPct = stats?.kpis?.marginPct || 0;
  const retentionRate = stats?.kpis?.retentionRate || 0;

  const growthMoM = stats?.growth?.MoM || 0;
  const growthYoY = stats?.growth?.YoY || 0;

  const ltvAvg = stats?.ltv?.avg || 0;
  const ltvP50 = stats?.ltv?.p50 || 0;
  const ltvP90 = stats?.ltv?.p90 || 0;

  const cycleAvg = stats?.salesCycle?.avgDays || 0;
  const cycleP75 = stats?.salesCycle?.p75 || 0;
  const cycleP90 = stats?.salesCycle?.p90 || 0;

  const paymentSummary = useMemo(() => {
    const src = stats?.byPaymentMethod || [];
    const map = {};
    src.forEach((row) => {
      const key = row.method || "priceOnly";
      map[key] = (map[key] || 0) + (row.revenue || 0);
    });
    return map;
  }, [stats]);

  return (
    <div className="p-6 max-w-7xl mx-auto font-vazir">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-xl md:text-2xl font-bold">📊 گزارشات فروش</h1>
        <button
          onClick={() => navigate("/dashboard")}
          className="border border-brand text-brand rounded px-4 py-2"
        >
          ← بازگشت به داشبورد
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 rounded-2xl border p-3 bg-white">
        <DatePicker
          value={dateRange.from}
          onChange={(val) => setDateRange((p) => ({ ...p, from: val }))}
          inputPlaceholder="از تاریخ"
          inputClassName="border p-2 rounded w-full"
          locale="fa"
        />
        <DatePicker
          value={dateRange.to}
          onChange={(val) => setDateRange((p) => ({ ...p, to: val }))}
          inputPlaceholder="تا تاریخ"
          inputClassName="border p-2 rounded w-full"
          locale="fa"
        />
        <select
          className="border rounded px-3 py-2"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
        >
          <option value="day">روزانه</option>
          <option value="month">ماهانه</option>
        </select>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDateRange({ from: startDefault, to: endDefault })}
            className="bg-gray-100 hover:bg-gray-200 rounded px-4 py-2 text-sm"
          >
            بازه: این ماه
          </button>
          <button
            onClick={() => setDateRange({ from: null, to: null })}
            className="bg-gray-100 hover:bg-gray-200 rounded px-4 py-2 text-sm"
          >
            پاک‌کردن فیلتر
          </button>
        </div>
      </div>

      {/* Errors / Loading */}
      {err && (
        <div className="text-red-600 text-sm border border-red-200 bg-red-50 p-2 rounded mb-4">
          {err}
        </div>
      )}
      {loading && <div className="animate-pulse text-gray-500 mb-4">در حال بارگذاری…</div>}

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card title="درآمد کل" color="border-blue-500" value={`${toPersianNumber(fmt(totalRevenue))} تومان`} />
        <Card title="سود خالص" color="border-green-600" value={`${toPersianNumber(fmt(profit))} تومان`} />
        <Card title="حاشیه سود" color="border-emerald-500" value={toPersianNumber(pct(marginPct))} />
        <Card title="میانگین هر نوبت (AOV)" color="border-cyan-600" value={`${toPersianNumber(fmt(aov))} تومان`} />
        <Card title="نرخ حفظ مشتری" color="border-indigo-500" value={toPersianNumber(pct(retentionRate))} />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card title="درآمد تزریقات" color="border-pink-500" value={`${toPersianNumber(fmt(injectionRevenue))} تومان`} />
        <Card title="درآمد لیزر" color="border-purple-500" value={`${toPersianNumber(fmt(laserRevenue))} تومان`} />
        <Card title="نوبت‌های انجام‌شده" color="border-gray-500" value={toPersianNumber(fmt(ordersDone))} />
        <Card title="رشد ماهانه (MoM)" color="border-amber-500" value={toPersianNumber(pct(growthMoM))} />
        <Card title="رشد سالانه (YoY)" color="border-orange-600" value={toPersianNumber(pct(growthYoY))} />
      </div>

      {/* KPI Row 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card
          title="LTV میانگین"
          color="border-teal-600"
          value={`${toPersianNumber(fmt(ltvAvg))} تومان`}
          sub={`${toPersianNumber(fmt(ltvP50))} (میانه) • ${toPersianNumber(fmt(ltvP90))} (P90)`}
        />
        <Card
          title="میانگین چرخه فروش (روز)"
          color="border-sky-600"
          value={toPersianNumber(Number(cycleAvg || 0).toLocaleString("fa-IR"))}
          sub={`${toPersianNumber(Number(cycleP75 || 0).toLocaleString("fa-IR"))} (P75) • ${toPersianNumber(
            Number(cycleP90 || 0).toLocaleString("fa-IR")
          )} (P90)`}
        />
        <Card
          title="میانگین × تعداد"
          color="border-fuchsia-600"
          value={`${toPersianNumber(fmt(aov))} × ${toPersianNumber(fmt(ordersDone))}`}
          sub={`≈ ${toPersianNumber(fmt(aov * ordersDone))} تومان`}
        />
      </div>

      {/* Payment Mix */}
      <section className="mb-10">
        <h2 className="font-semibold mb-3">مبالغ بر اساس روش پرداخت</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
          {Object.entries(paymentSummary).map(([method, amount]) => (
            <div key={method} className="bg-white shadow p-4 rounded-xl text-center border-t-4 border-yellow-500">
              <p className="text-gray-600 mb-1">{method}</p>
              <p className="text-lg font-bold">{toPersianNumber(fmt(amount))} تومان</p>
            </div>
          ))}
          <div className="bg-white shadow p-4 rounded-xl text-center border-t-4 border-gray-600">
            <p className="text-gray-600 mb-1">جمع کل</p>
            <p className="text-lg font-bold">{toPersianNumber(fmt(totalRevenue))} تومان</p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- کامپوننت کارت KPI ---------- */
function Card({ title, value, sub, color = "border-blue-500" }) {
  return (
    <div className={`bg-white shadow p-4 rounded-xl text-center border-t-4 ${color}`}>
      <p className="text-gray-600 mb-1">{title}</p>
      <p className="text-lg font-bold">{value}</p>
      {sub ? <p className="text-xs text-gray-500 mt-1">{sub}</p> : null}
    </div>
  );
}