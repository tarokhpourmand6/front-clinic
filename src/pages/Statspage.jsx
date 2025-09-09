// src/pages/StatsPage.jsx
// نسخه پایدار: DatePicker با فرمت {year,month,day} + KPIها + محافظت کامل با safeText
import { useEffect, useMemo, useState } from "react";
import DatePicker from "../components/DatePicker/DatePicker";
import "../components/DatePicker/DatePicker.css";
import { getSalesStats } from "../api/stats";
import { toPersianNumber } from "../utils/number";
import { useNavigate } from "react-router-dom";

/* ---------- Helpers ---------- */
const toPicker = (d) => ({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
const pickerToISO = (v) => {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v.year === "number" && typeof v.month === "number" && typeof v.day === "number") {
    const d = new Date(v.year, v.month - 1, v.day, 0, 0, 0, 0);
    return d.toISOString();
  }
  return null;
};
const safeText = (v) => {
  if (v == null) return "—";
  const t = typeof v;
  if (t === "string" || t === "number" || t === "boolean") return String(v);
  try { return JSON.stringify(v); } catch { return "—"; }
};
const fmtNum = (n = 0) => Number(n || 0).toLocaleString("fa-IR");
const fmtTomans = (n = 0) => `${toPersianNumber(fmtNum(n))} تومان`;
const fmtPct = (n = 0) => `${toPersianNumber(Number(n || 0).toLocaleString("fa-IR"))}%`;

export default function StatsPage() {
  const navigate = useNavigate();

  // گیت ساده
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const handlePasswordSubmit = () => {
    if (password === "Sayari2025") setAuthenticated(true);
    else alert("رمز عبور نادرست است");
  };

  // تاریخ‌ها به فرمت مورد انتظار DatePicker
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [dateRange, setDateRange] = useState({ from: toPicker(startOfMonth), to: toPicker(now) });
  const [group, setGroup] = useState("day"); // "day" | "month"

  // دیتا
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const query = useMemo(() => ({
    start: pickerToISO(dateRange.from),
    end: pickerToISO(dateRange.to),
    group,
  }), [dateRange, group]);

  useEffect(() => {
    if (!authenticated) return;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await getSalesStats(query);
        setStats(data);
      } catch (e) {
        setErr(e?.message || "خطا در دریافت آمار");
        setStats(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [authenticated, query]);

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

  // استخراج امن
  const byService = Array.isArray(stats?.byService) ? stats.byService : [];
  const findRev = (name) =>
    byService.find((s) => String(s?.serviceType || "").toLowerCase() === name)?.revenue || 0;

  const injectionRevenue = Number(findRev("injection") || 0);
  const laserRevenue = Number(findRev("laser") || 0);

  const kpis = stats?.kpis || {};
  const totalRevenue = Number(kpis?.totalRevenue || 0);
  const ordersDone = Number(kpis?.ordersDone || 0);
  const aov = Number(kpis?.aov || 0);
  const profit = Number(kpis?.profit || 0);
  const marginPct = Number(kpis?.marginPct || 0);
  const retentionRate = Number(kpis?.retentionRate || 0);

  const growth = stats?.growth || {};
  const growthMoM = Number(growth?.MoM || 0);
  const growthYoY = Number(growth?.YoY || 0);

  const ltv = stats?.ltv || {};
  const ltvAvg = Number(ltv?.avg || 0);
  const ltvP50 = Number(ltv?.p50 || 0);
  const ltvP90 = Number(ltv?.p90 || 0);

  const salesCycle = stats?.salesCycle || {};
  const cycleAvg = Number(salesCycle?.avgDays || 0);
  const cycleP75 = Number(salesCycle?.p75 || 0);
  const cycleP90 = Number(salesCycle?.p90 || 0);

  const paymentSummary = useMemo(() => {
    const rows = Array.isArray(stats?.byPaymentMethod) ? stats.byPaymentMethod : [];
    const map = {};
    rows.forEach((r) => {
      const method = r?.method ?? "priceOnly";
      const amount = Number(r?.revenue || 0);
      map[method] = (map[method] || 0) + amount;
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
        <select className="border rounded px-3 py-2" value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="day">روزانه</option>
          <option value="month">ماهانه</option>
        </select>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDateRange({ from: toPicker(startOfMonth), to: toPicker(now) })}
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
          {safeText(err)}
        </div>
      )}
      {loading && <div className="animate-pulse text-gray-500 mb-4">در حال بارگذاری…</div>}

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card title="درآمد کل" color="border-blue-500" value={safeText(fmtTomans(totalRevenue))} />
        <Card title="سود خالص" color="border-green-600" value={safeText(fmtTomans(profit))} />
        <Card title="حاشیه سود" color="border-emerald-500" value={safeText(fmtPct(marginPct))} />
        <Card title="میانگین هر نوبت (AOV)" color="border-cyan-600" value={safeText(fmtTomans(aov))} />
        <Card title="نرخ حفظ مشتری" color="border-indigo-500" value={safeText(fmtPct(retentionRate))} />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card title="درآمد تزریقات" color="border-pink-500" value={safeText(fmtTomans(injectionRevenue))} />
        <Card title="درآمد لیزر" color="border-purple-500" value={safeText(fmtTomans(laserRevenue))} />
        <Card title="نوبت‌های انجام‌شده" color="border-gray-500" value={safeText(toPersianNumber(fmtNum(ordersDone)))} />
        <Card title="رشد ماهانه (MoM)" color="border-amber-500" value={safeText(fmtPct(growthMoM))} />
        <Card title="رشد سالانه (YoY)" color="border-orange-600" value={safeText(fmtPct(growthYoY))} />
      </div>

      {/* KPI Row 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card
          title="LTV میانگین"
          color="border-teal-600"
          value={safeText(fmtTomans(ltvAvg))}
          sub={safeText(`${fmtTomans(ltvP50)} (میانه) • ${fmtTomans(ltvP90)} (P90)`)}
        />
        <Card
          title="میانگین چرخه فروش (روز)"
          color="border-sky-600"
          value={safeText(toPersianNumber(Number(cycleAvg || 0).toLocaleString("fa-IR")))}
          sub={safeText(
            `${toPersianNumber(Number(cycleP75 || 0).toLocaleString("fa-IR"))} (P75) • ${toPersianNumber(
              Number(cycleP90 || 0).toLocaleString("fa-IR")
            )} (P90)`
          )}
        />
        <Card
          title="میانگین × تعداد"
          color="border-fuchsia-600"
          value={safeText(`${fmtTomans(aov)} × ${toPersianNumber(fmtNum(ordersDone))}`)}
          sub={safeText(`≈ ${fmtTomans(aov * ordersDone)}`)}
        />
      </div>

      {/* Payment Mix */}
      <section className="mb-10">
        <h2 className="font-semibold mb-3">مبالغ بر اساس روش پرداخت</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
          {Object.entries(paymentSummary).map(([method, amount]) => (
            <div key={safeText(method)} className="bg-white shadow p-4 rounded-xl text-center border-t-4 border-yellow-500">
              <p className="text-gray-600 mb-1">{safeText(method)}</p>
              <p className="text-lg font-bold">{safeText(fmtTomans(amount))}</p>
            </div>
          ))}
          <div className="bg-white shadow p-4 rounded-xl text-center border-t-4 border-gray-600">
            <p className="text-gray-600 mb-1">جمع کل</p>
            <p className="text-lg font-bold">{safeText(fmtTomans(totalRevenue))}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- Card ---------- */
function Card({ title, value, sub, color = "border-blue-500" }) {
  return (
    <div className={`bg-white shadow p-4 rounded-xl text-center border-t-4 ${color}`}>
      <p className="text-gray-600 mb-1">{safeText(title)}</p>
      <p className="text-lg font-bold">{safeText(value)}</p>
      {sub ? <p className="text-xs text-gray-500 mt-1">{safeText(sub)}</p> : null}
    </div>
  );
}