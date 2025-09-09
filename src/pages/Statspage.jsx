// src/pages/StatsPage.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getSalesStats } from "../api/stats";
import { getInjectionBreakdown, getInjectionById } from "../api/statsInjections";

import DatePicker from "../components/DatePicker/DatePicker";
import "../components/DatePicker/DatePicker.css";

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

// تبدیل خروجی DatePicker {year,month,day} به 'YYYY-MM-DD'
const pickerToISO = (p) => {
  if (!p || !Number(p.year) || !Number(p.month) || !Number(p.day)) return undefined;
  const y = Number(p.year), m = Number(p.month), d = Number(p.day);
  // فرض ساده: تاریخ دریافتی گرگوری است (اگر جلالی است، DatePicker شما معمولاً خودش تبدیل می‌کند.
  // در غیر این صورت، اینجا می‌توانیم مبدل جلالی↔گرگوری اضافه کنیم.)
  const dt = new Date(y, m - 1, d);
  if (isNaN(dt.getTime())) return undefined;
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default function StatsPage() {
  const navigate = useNavigate();

  /* ---------- درگاه ساده ورود ---------- */
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const onSubmit = () => {
    if (password === "Sayari2025") setAuthenticated(true);
    else alert("رمز عبور نادرست است");
  };

  /* ---------- فیلترهای گزارش ---------- */
  const [group, setGroup] = useState("day"); // day | month
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  // ISO برای API
  const startISO = useMemo(() => pickerToISO(dateRange.from), [dateRange.from]);
  const endISO = useMemo(() => pickerToISO(dateRange.to), [dateRange.to]);

  /* ---------- وضعیت لود ---------- */
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [stats, setStats] = useState(null);

  const loadStats = useCallback(async () => {
    if (!authenticated) return;
    setLoading(true);
    setErr("");
    try {
      const data = await getSalesStats({
        group,
        start: startISO,
        end: endISO,
      });
      setStats(data);
    } catch (e) {
      setErr(e?.message || "خطا در دریافت آمار");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [authenticated, group, startISO, endISO]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

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

  /* ---------- استخراج امن ---------- */
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

  /* ---------- مودال ریز تزریقات ---------- */
  const [injOpen, setInjOpen] = useState(false);
  const [injRows, setInjRows] = useState([]);
  const [injLoading, setInjLoading] = useState(false);
  const [injDetail, setInjDetail] = useState(null);

  const loadInjections = useCallback(async () => {
    setInjLoading(true);
    try {
      const data = await getInjectionBreakdown({
        start: startISO || undefined,
        end: endISO || undefined,
      });
      setInjRows(data);
    } finally {
      setInjLoading(false);
    }
  }, [startISO, endISO]);

  const openInjectionModal = async () => {
    setInjOpen(true);
    await loadInjections();
  };

  const openInjectionDetail = async (id) => {
    const d = await getInjectionById(id);
    setInjDetail(d);
  };

  const clearDates = () => setDateRange({ from: null, to: null });

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
            onClick={openInjectionModal}
            className="border border-brand text-brand rounded px-3 py-2 text-sm"
          >
            ریز تزریقات
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="border border-brand text-brand rounded px-4 py-2"
          >
            ← بازگشت به داشبورد
          </button>
        </div>
      </div>

      {/* Date filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
        <div className="flex gap-2">
          <button
            onClick={loadStats}
            className="bg-brand text-white rounded px-4 py-2 w-full md:w-auto"
          >
            اعمال فیلتر
          </button>
          <button
            onClick={() => {
              clearDates();
              // بعد از پاک کردن، دوباره لود می‌کنیم
              setTimeout(loadStats, 0);
            }}
            className="bg-gray-200 rounded px-4 py-2 w-full md:w-auto text-sm"
          >
            پاک‌کردن
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

      {/* Modal: Injection Breakdown */}
      {injOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl w-full max-w-5xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-lg">ریز تزریقات (مصرفی + دریافتی)</h3>
              <button onClick={() => { setInjOpen(false); setInjDetail(null); }} className="text-gray-500">✕</button>
            </div>

            {/* از همان بازه‌ی صفحه استفاده می‌کنیم */}
            <div className="flex flex-wrap gap-2 items-center text-xs text-gray-500 mb-2">
              <span>بازه فعال گزارش:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">
                {startISO || "—"} ⟶ {endISO || "—"}
              </code>
              <button onClick={loadInjections} className="ml-auto border border-brand text-brand rounded px-3 py-1">
                به‌روزرسانی
              </button>
            </div>

            {/* جدول لیست نوبت‌ها */}
            <div className="overflow-auto border rounded">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-right">تاریخ</th>
                    <th className="p-2 text-right">بیمار</th>
                    <th className="p-2 text-right">#اقلام</th>
                    <th className="p-2 text-right">هزینه مصرفی</th>
                    <th className="p-2 text-right">دریافتی</th>
                    <th className="p-2 text-right">سود</th>
                    <th className="p-2 text-right">جزئیات</th>
                  </tr>
                </thead>
                <tbody>
                  {injLoading && (
                    <tr><td colSpan={7} className="p-4 text-center">در حال بارگذاری…</td></tr>
                  )}
                  {!injLoading && injRows.length === 0 && (
                    <tr><td colSpan={7} className="p-4 text-center">رکوردی یافت نشد</td></tr>
                  )}
                  {!injLoading && injRows.map(r => (
                    <tr key={r.appointmentId} className="border-t">
                      <td className="p-2">{r.dateShamsi || "-"}</td>
                      <td className="p-2">{r.patientName || r.patientId}</td>
                      <td className="p-2">{(r.items?.length || 0)}</td>
                      <td className="p-2">{(r.costTotal || 0).toLocaleString()} تومان</td>
                      <td className="p-2">{(r.revenue || 0).toLocaleString()} تومان</td>
                      <td className="p-2 font-bold">{((r.profit||0)).toLocaleString()} تومان</td>
                      <td className="p-2">
                        <button className="text-brand underline" onClick={()=>openInjectionDetail(r.appointmentId)}>
                          مشاهده
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* زیرمودال: جزئیات یک نوبت */}
            {injDetail && (
              <div className="mt-4 border rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-bold">جزئیات نوبت | تاریخ: {injDetail.dateShamsi || "-"}</div>
                  <button className="text-gray-500" onClick={()=>setInjDetail(null)}>بستن جزئیات</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                  <div className="bg-gray-50 rounded p-2">دریافتی: {(injDetail.revenue||0).toLocaleString()} تومان</div>
                  <div className="bg-gray-50 rounded p-2">هزینه مصرفی: {(injDetail.costTotal||0).toLocaleString()} تومان</div>
                  <div className="bg-gray-50 rounded p-2 font-bold">سود: {(((injDetail.revenue||0)-(injDetail.costTotal||0))).toLocaleString()} تومان</div>
                </div>
                <div className="overflow-auto border rounded">
                  <table className="min-w-[650px] w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-right">محصول</th>
                        <th className="p-2 text-right">واحد</th>
                        <th className="p-2 text-right">مصرف</th>
                        <th className="p-2 text-right">قیمت واحد (میانگین خرید)</th>
                        <th className="p-2 text-right">هزینه قلم</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(injDetail.items||[]).map((it, idx)=>(
                        <tr key={idx} className="border-t">
                          <td className="p-2">{it.name || "-"}</td>
                          <td className="p-2">{it.unit || "-"}</td>
                          <td className="p-2">{it.amountUsed ?? 0}</td>
                          <td className="p-2">{(it.avgUnitCost||0).toLocaleString()} تومان</td>
                          <td className="p-2">{(it.lineCost||0).toLocaleString()} تومان</td>
                        </tr>
                      ))}
                      {(!injDetail.items || injDetail.items.length===0) && (
                        <tr><td colSpan={5} className="p-3 text-center">مصرفی ثبت نشده.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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