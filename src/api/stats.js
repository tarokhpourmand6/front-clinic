// src/api/stats.js
import api from "./axios";

/* ---------- helpers ---------- */
const toNum = (v, fb = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};
const asArray = (v) => (Array.isArray(v) ? v : []);

/* ---------- شکل پیش‌فرض ---------- */
const DEFAULT_STATS = {
  range: { start: null, end: null, group: "day" },
  kpis: {
    totalRevenue: 0,
    ordersDone: 0,
    aov: 0,
    profit: 0,
    marginPct: 0,
    retentionRate: 0,
  },
  growth: { MoM: 0, YoY: 0 },               // ✅ جدید
  ltv: { avg: 0, p50: 0, p90: 0 },          // ✅ جدید
  salesCycle: { avgDays: 0, p75: 0, p90: 0 },// ✅ جدید
  timeseries: [],
  byService: [],
  byPaymentMethod: [],
  topCustomers: [],
  inventoryUsageTop: [],
};

/* ---------- نرمال‌سازی پاسخ ---------- */
const unwrap = (res) => {
  const body = res?.data ?? res ?? {};
  const src = body?.data && typeof body.data === "object" ? body.data : body;

  return {
    range: {
      start: src?.range?.start ?? null,
      end: src?.range?.end ?? null,
      group: src?.range?.group ?? "day",
    },
    kpis: {
      totalRevenue: toNum(src?.kpis?.totalRevenue, 0),
      ordersDone: toNum(src?.kpis?.ordersDone, 0),
      aov: toNum(src?.kpis?.aov, 0),
      profit: toNum(src?.kpis?.profit, 0),
      marginPct: toNum(src?.kpis?.marginPct, 0),
      retentionRate: toNum(src?.kpis?.retentionRate, 0),
    },
    growth: {
      MoM: toNum(src?.growth?.MoM, 0),
      YoY: toNum(src?.growth?.YoY, 0),
    },
    ltv: {
      avg: toNum(src?.ltv?.avg, 0),
      p50: toNum(src?.ltv?.p50, 0),
      p90: toNum(src?.ltv?.p90, 0),
    },
    salesCycle: {
      avgDays: toNum(src?.salesCycle?.avgDays, 0),
      p75: toNum(src?.salesCycle?.p75, 0),
      p90: toNum(src?.salesCycle?.p90, 0),
    },
    timeseries: asArray(src?.timeseries),
    byService: asArray(src?.byService),
    byPaymentMethod: asArray(src?.byPaymentMethod),
    topCustomers: asArray(src?.topCustomers),
    inventoryUsageTop: asArray(src?.inventoryUsageTop),
  };
};

/* ---------- Main: GET /api/stats/sales ---------- */
export const getSalesStats = async (params = {}) => {
  const { start, end, group = "day" } = params;

  const res = await api.get("/stats/sales", {
    params: {
      start: start || undefined,
      end: end || undefined,
      group: group || "day",
    },
  });

  try {
    return unwrap(res);
  } catch {
    return DEFAULT_STATS;
  }
};

/* ---------- Presets اختیاری ---------- */
export const getSalesStatsPreset = async (preset = "thisMonth") => {
  const now = new Date();
  let start = null, end = now.toISOString();

  if (preset === "thisMonth") {
    start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  } else if (preset === "last30d") {
    start = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString();
  } else if (preset === "thisYear") {
    start = new Date(now.getFullYear(), 0, 1).toISOString();
  }

  return getSalesStats({ start, end, group: preset === "thisYear" ? "month" : "day" });
};