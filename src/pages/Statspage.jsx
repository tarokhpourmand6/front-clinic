// src/pages/StatsPage.jsx
// مرحله ۳: اتصال امن به API (بدون DatePicker)
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSalesStats } from "../api/stats";

/* ---------- helpers ---------- */
const safeText = (v) => {
  if (v == null) return "—";
  const t = typeof v;
  if (t === "string" || t === "number" || t === "boolean") return String(v);
  try { return JSON.stringify(v); } catch { return "—"; }
};
const toFa = (n = 0) => Number(n || 0).toLocaleString("fa-IR");
const tomans = (n = 0) => `${toFa(n)} تومان`;
const pct = (n = 0) => `${toFa(Number(n || 0))}%`;

export default function StatsPage() {
  const navigate = useNavigate();

  // درگاه ساده ورود
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const onSubmit = () => {
    if (password === "Sayari2025") setAuthenticated(true);
    else alert("رمز عبور نادرست است");
  };

  // حالت‌ها
  const [group, setGroup] = useState("day"); // day | month
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [stats, setStats] = useState(null);

  const query = useMemo(() => ({ group }), [group]);

  useEffect(() => {
    if (!authenticated) return;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await getSalesStats(query); // بدون start/end → بک‌اند خودش بازه پیش‌فرض می‌گیرد
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
          <button onClick={onSubmit} className="w-full bg-brand text-white py-2 rounded">
            ورود
          </button>
        </div>
      </div>
    );
  }

  // استخراج امن
  const kpis = stats?.kpis || {};
  const totalRevenue = Number(kpis?.totalRevenue || 0);
  const profit = Number(kpis?.profit || 0);
  const marginPct = Number(kpis?.marginPct || 0);
  const aov = Number(kpis?.aov || 0);
  const retentionRate = Number(kpis?.retentionRate || 0);
  const ordersDone = Number(kpis?.ordersDone || 0);

  const byService = Array.isArray(stats?.byService) ? stats.byService : [];
  const revOf = (name) =>
    byService.find((s) => String(s?.serviceType || "").toLowerCase() === name)?.revenue || 0;
  const injectionRevenue = Number(revOf("injection") || 0);
  const laserRevenue = Number(revOf("laser") || 0);

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

  const paymentRows = Array.isArray(stats?.byPaymentMethod) ? stats.byPaymentMethod : [];

  return (
    <div className="p-6 max-w-7xl mx-auto font-vazir">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-xl md:text-2xl font-bold">📊 گزارشات فروش</h1>
        <div className="flex items-center gap-2">
          <select
            className="border rounded px-3 py-2"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          >
            <option value="day">روزانه</option>
            <option value="month">ماهانه</option>
          </select>
          <button
            onClick={() => navigate("/dashboard")}
            className="border border-brand text-brand rounded px-4 py-2"
          >
            ← بازگشت به داشبورد
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
        <Card title="درآمد کل" color="border-blue-500" value={safeText(tomans(totalRevenue))} />
        <Card title="سود خالص" color="border-green-600" value={safeText(tomans(profit))} />
        <Card title="حاشیه سود" color="border-emerald-500" value={safeText(pct(marginPct))} />
        <Card title="میانگین هر نوبت (AOV)" color="border-cyan-600" value={safeText(tomans(aov))} />
        <Card title="نرخ حفظ مشتری" color="border-indigo-500" value={safeText(pct(retentionRate))} />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card title="درآمد تزریقات" color="border-pink-500" value={safeText(tomans(injectionRevenue))} />
        <Card title="درآمد لیزر" color="border-purple-500" value={safeText(tomans(laserRevenue))} />
        <Card title="نوبت‌های انجام‌شده" color="border-gray-500" value={safeText(toFa(ordersDone))} />
        <Card title="رشد ماهانه (MoM)" color="border-amber-500" value={safeText(pct(growthMoM))} />
        <Card title="رشد سالانه (YoY)" color="border-orange-600" value={safeText(pct(growthYoY))} />
      </div>

      {/* KPI Row 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card
          title="LTV میانگین"
          color="border-teal-600"
          value={safeText(tomans(ltvAvg))}
          sub={safeText(`${tomans(ltvP50)} (میانه) • ${tomans(ltvP90)} (P90)`)}
        />
        <Card
          title="میانگین چرخه فروش (روز)"
          color="border-sky-600"
          value={safeText(toFa(cycleAvg))}
          sub={safeText(`${toFa(cycleP75)} (P75) • ${toFa(cycleP90)} (P90)`)}
        />
        <Card
          title="میانگین × تعداد"
          color="border-fuchsia-600"
          value={safeText(`${tomans(aov)} × ${toFa(ordersDone)}`)}
          sub={safeText(`≈ ${tomans(aov * ordersDone)}`)}
        />
      </div>

      {/* Payment Mix */}
      <section className="mb-10">
        <h2 className="font-semibold mb-3">مبالغ بر اساس روش پرداخت</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
          {paymentRows.map((r, i) => (
            <div key={`${r?.method ?? "priceOnly"}-${i}`} className="bg-white shadow p-4 rounded-xl text-center border-t-4 border-yellow-500">
              <p className="text-gray-600 mb-1">{safeText(r?.method ?? "priceOnly")}</p>
              <p className="text-lg font-bold">{safeText(tomans(Number(r?.revenue || 0)))}</p>
            </div>
          ))}
          <div className="bg-white shadow p-4 rounded-xl text-center border-t-4 border-gray-600">
            <p className="text-gray-600 mb-1">جمع کل</p>
            <p className="text-lg font-bold">{safeText(tomans(totalRevenue))}</p>
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