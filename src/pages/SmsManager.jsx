// src/pages/SmsManager.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// API: ارسال‌های سریع/ثابت
import { sendSms, sendWelcomeSms, sendBirthdaySms, sendReminderSms } from "../api/sms";

// API: CRUD قالب‌های دیتابیس + ارسال با نام قالب
import {
  listSmsTemplates,
  createSmsTemplate,
  updateSmsTemplate,
  removeSmsTemplate,
  sendByTemplate,
} from "../api/smsTemplates";

// گرفتن بیماران (نسخه‌ی تک‌صفحه‌ای)
import { getPatients } from "../api/patients";

export default function SmsManager() {
  const [tab, setTab] = useState("quick"); // quick | templates | bulk | dbtemplates
  const location = useLocation();
  const navigate = useNavigate();

  // همگام‌سازی تب با URL (hash یا ?tab=)
  useEffect(() => {
    const hash = (location.hash || "").replace("#", "");
    const q = new URLSearchParams(location.search).get("tab");
    const initial = (hash || q || "").toLowerCase();
    if (["quick", "templates", "bulk", "dbtemplates"].includes(initial)) {
      setTab(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!["quick", "templates", "bulk", "dbtemplates"].includes(tab)) return;
    navigate(`#${tab}`, { replace: true });
  }, [tab, navigate]);

  // داده‌های مشترک
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // {type:'success'|'error'|'info', msg:string}
  const [logs, setLogs] = useState([]); // لاگ همین سشن کلاینتی

  // ارسال سریع
  const [quickPhone, setQuickPhone] = useState("");
  const [quickText, setQuickText] = useState("");

  // قالب‌های ثابت
  const [tplType, setTplType] = useState("welcome"); // welcome | birthday | reminder
  const [tplTo, setTplTo] = useState("");
  const [tplName, setTplName] = useState("");
  const [tplClinic, setTplClinic] = useState("کلینیک میلاد");
  const [tplDate, setTplDate] = useState(""); // 1404/05/27
  const [tplTime, setTplTime] = useState(""); // 14:00

  // گروهی
  const [patients, setPatients] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkType, setBulkType] = useState("welcome"); // welcome|birthday|reminder|custom
  const [bulkMsg, setBulkMsg] = useState(""); // متن دلخواه
  const [bulkProgress, setBulkProgress] = useState({ sent: 0, total: 0 });
  const [bulkRunning, setBulkRunning] = useState(false);
  const abortRef = useRef(false);

  // قالب‌های دیتابیس (CRUD + ارسال)
  const [tpls, setTpls] = useState([]);
  const [tplQuery, setTplQuery] = useState("");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    text: "",
    tags: "appointment",
    isActive: true,
  });
  const [sendPreview, setSendPreview] = useState({
    to: "",
    name: "",
    date: "",
    time: "",
    clinic: "کلینیک میلاد",
  });

  // توست
  useEffect(() => {
    let t;
    if (toast) t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // بارگذاری بیماران برای تب گروهی (یک صفحه، مثلاً 300 رکورد)
  useEffect(() => {
    (async () => {
      try {
        const list = await getPatients({ page: 1, limit: 300 });
        const arr =
          Array.isArray(list) ? list :
          Array.isArray(list?.data) ? list.data :
          Array.isArray(list?.patients) ? list.patients : [];
        setPatients(arr);
      } catch {
        setPatients([]);
      }
    })();
  }, []);

  // بارگذاری لیست قالب‌های دیتابیس هنگام ورود به تب
  useEffect(() => {
    if (tab !== "dbtemplates") return;
    (async () => {
      try {
        const data = await listSmsTemplates({ q: tplQuery });
        setTpls(Array.isArray(data) ? data : []);
      } catch {
        showToast("error", "خواندن قالب‌ها ناموفق بود");
      }
    })();
  }, [tab, tplQuery]);

  // Helper
  const showToast = (type, msg) => setToast({ type, msg });

  const smsLengthInfo = useMemo(() => {
    const text = tab === "quick" ? quickText : bulkMsg;
    const len = (text || "").length;
    const parts = len === 0 ? 0 : Math.ceil(len / 70); // تخمین ساده یونیکد
    return { len, parts };
  }, [tab, quickText, bulkMsg]);

  const buildPreview = () => {
    switch (tplType) {
      case "welcome":
        return `👋 ${tplName ? tplName + " عزیز، " : ""}به ${tplClinic} خوش آمدید. امیدواریم تجربه‌ای دلپذیر و نتیجه‌بخش داشته باشید. 🤍`;
      case "birthday":
        return `🎂 ${tplName ? tplName + " عزیز، " : ""}تولدتون مبارک! از طرف ${tplClinic} آرزوی تندرستی و زیبایی داریم.`;
      case "reminder":
        return `⏰ یادآوری نوبت: ${tplName ? tplName + " عزیز، " : ""}${tplDate} ساعت ${tplTime} در ${tplClinic}. لطفاً ۱۰ دقیقه زودتر حضور داشته باشید.`;
      default:
        return "";
    }
  };

  // Actions — Quick
  const handleQuickSend = async () => {
    if (!quickPhone || !quickText) return showToast("error", "شماره و متن الزامی است.");
    try {
      setLoading(true);
      const res = await sendSms({ phone: quickPhone.trim(), text: quickText });
      setLogs((s) => [{ when: new Date().toISOString(), to: quickPhone, ok: !!res?.data?.success, type: "SEND" }, ...s]);
      showToast("success", "پیام ارسال شد.");
      setQuickText("");
    } catch (e) {
      showToast("error", e?.response?.data?.error || "ارسال ناموفق");
    } finally {
      setLoading(false);
    }
  };

  // Actions — ثابت
  const handleTemplateSend = async () => {
    if (!tplTo) return showToast("error", "شماره گیرنده الزامی است.");
    try {
      setLoading(true);
      let res;
      if (tplType === "welcome") res = await sendWelcomeSms({ to: tplTo.trim(), name: tplName, clinic: tplClinic });
      if (tplType === "birthday") res = await sendBirthdaySms({ to: tplTo.trim(), name: tplName, clinic: tplClinic });
      if (tplType === "reminder") {
        if (!tplDate || !tplTime) return showToast("error", "تاریخ و ساعت برای یادآوری الزامی است.");
        res = await sendReminderSms({ to: tplTo.trim(), name: tplName, date: tplDate, time: tplTime, clinic: tplClinic });
      }
      setLogs((s) => [{ when: new Date().toISOString(), to: tplTo, ok: !!res?.data?.success, type: tplType.toUpperCase() }, ...s]);
      showToast("success", "پیام ارسال شد.");
    } catch (e) {
      showToast("error", e?.response?.data?.error || "ارسال ناموفق");
    } finally {
      setLoading(false);
    }
  };

  // Actions — Bulk
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runBulk = async () => {
    const selected = (Array.isArray(patients) ? patients : []).filter((p) => selectedIds.has(p._id) && p.phone);
    if (!selected.length) return showToast("error", "هیچ بیماری انتخاب نشده یا شماره‌ای ثبت نشده است.");

    setBulkRunning(true);
    setBulkProgress({ sent: 0, total: selected.length });
    abortRef.current = false;

    for (let i = 0; i < selected.length; i++) {
      if (abortRef.current) break;
      const p = selected[i];
      try {
        let res;
        if (bulkType === "welcome") res = await sendWelcomeSms({ to: p.phone, name: p.fullName });
        else if (bulkType === "birthday") res = await sendBirthdaySms({ to: p.phone, name: p.fullName });
        else if (bulkType === "reminder")
          res = await sendReminderSms({
            to: p.phone,
            name: p.fullName,
            date: tplDate || "-",
            time: tplTime || "-",
          });
        else if (bulkType === "custom") res = await sendSms({ phone: p.phone, text: bulkMsg });

        setLogs((s) => [{ when: new Date().toISOString(), to: p.phone, ok: !!res?.data?.success, type: `BULK-${bulkType.toUpperCase()}` }, ...s]);
      } catch (e) {
        setLogs((s) => [
          {
            when: new Date().toISOString(),
            to: p.phone,
            ok: false,
            type: `BULK-${bulkType.toUpperCase()}`,
            err: e?.response?.data?.error || e.message,
          },
          ...s,
        ]);
      }
      setBulkProgress((bp) => ({ ...bp, sent: bp.sent + 1 }));
      await new Promise((r) => setTimeout(r, 600));
    }

    setBulkRunning(false);
  };

  // Actions — DB Templates CRUD
  const resetForm = () => {
    setEditId(null);
    setForm({ name: "", text: "", tags: "appointment", isActive: true });
  };

  const handleSaveTemplate = async () => {
    if (!form.name || !form.text) return showToast("error", "نام و متن قالب الزامی است.");
    try {
      setLoading(true);
      const payload = {
        name: form.name.trim(),
        text: form.text,
        tags: String(form.tags || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        isActive: !!form.isActive,
      };
      if (editId) {
        await updateSmsTemplate(editId, payload);
        showToast("success", "قالب به‌روزرسانی شد.");
      } else {
        await createSmsTemplate(payload);
        showToast("success", "قالب ساخته شد.");
      }
      resetForm();
      const data = await listSmsTemplates({ q: tplQuery });
      setTpls(Array.isArray(data) ? data : []);
    } catch (e) {
      showToast("error", e?.response?.data?.error || "ذخیره قالب ناموفق بود");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (t) => {
    setEditId(t._id);
    setForm({
      name: t.name,
      text: t.text,
      tags: (t.tags || []).join(","),
      isActive: !!t.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("حذف این قالب؟")) return;
    try {
      await removeSmsTemplate(id);
      setTpls((prev) => (Array.isArray(prev) ? prev : []).filter((x) => x._id !== id));
      if (editId === id) resetForm();
      showToast("success", "قالب حذف شد.");
    } catch {
      showToast("error", "حذف ناموفق بود");
    }
  };

  const handleSendByTemplate = async (t) => {
    if (!sendPreview.to) return showToast("error", "شماره گیرنده را وارد کنید.");
    try {
      setLoading(true);
      const params = {
        name: sendPreview.name,
        date: sendPreview.date,
        time: sendPreview.time,
        clinic: sendPreview.clinic,
      };
      const res = await sendByTemplate({
        templateName: t.name,
        params,
        to: sendPreview.to.trim(),
      });
      setLogs((s) => [{ when: new Date().toISOString(), to: sendPreview.to, ok: !!res?.success, type: `TPL:${t.name}` }, ...s]);
      showToast("success", "پیام با قالب ارسال شد.");
    } catch (e) {
      showToast("error", e?.response?.data?.error || "ارسال ناموفق");
    } finally {
      setLoading(false);
    }
  };

  // UI
  const Section = ({ title, children, right }) => (
    <div className="bg-white rounded-2xl shadow p-4 md:p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-bold">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );

  const Tabs = () => (
    <div className="flex gap-2 md:gap-3 mb-4">
      {[
        { k: "quick", t: "ارسال سریع" },
        { k: "templates", t: "قالب‌های ثابت" },
        { k: "bulk", t: "ارسال گروهی" },
        { k: "dbtemplates", t: "قالب‌های دیتابیس" },
      ].map(({ k, t }) => (
        <button
          key={k}
          onClick={() => setTab(k)}
          className={`px-3 md:px-4 py-2 rounded-xl text-sm md:text-base border ${
            tab === k ? "bg-black text-white" : "bg-white"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-3 md:px-6 py-4 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold">مدیریت پیام‌ها (SMS)</h1>
        <p className="text-gray-500 mt-1">ارسال سریع، قالب‌های ثابت، ارسال گروهی و مدیریت قالب‌های دیتابیس</p>
      </div>

      <Tabs />

      {/* تب ارسال سریع */}
      {tab === "quick" && (
        <Section title="ارسال سریع">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="text-sm">شماره گیرنده</label>
              <input value={quickPhone} onChange={(e) => setQuickPhone(e.target.value)} className="w-full mt-1 rounded-xl border p-2" placeholder="09xxxxxxxxx" />
              <div className="text-xs text-gray-400 mt-1">مثال: 0912xxxxxxx</div>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm">متن پیام</label>
              <textarea value={quickText} onChange={(e) => setQuickText(e.target.value)} className="w-full mt-1 rounded-xl border p-2 h-28" placeholder="متن پیام را بنویسید..." />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>تعداد کاراکتر: {smsLengthInfo.len} | بخش‌ها: {smsLengthInfo.parts}</span>
                <button disabled={loading || !quickPhone || !quickText} onClick={handleQuickSend} className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50">
                  ارسال
                </button>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* تب قالب‌های ثابت */}
      {tab === "templates" && (
        <Section title="قالب‌های ثابت" right={<span className="text-xs text-gray-400">برای یادآوری، تاریخ و ساعت را پر کنید</span>}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <label className="text-sm">نوع قالب</label>
              <select value={tplType} onChange={(e) => setTplType(e.target.value)} className="w-full rounded-xl border p-2">
                <option value="welcome">خوش‌آمد</option>
                <option value="birthday">تولد</option>
                <option value="reminder">یادآوری نوبت</option>
              </select>

              <label className="text-sm">شماره گیرنده</label>
              <input value={tplTo} onChange={(e) => setTplTo(e.target.value)} className="w-full rounded-xl border p-2" placeholder="09xxxxxxxxx" />

              <label className="text-sm">نام (اختیاری)</label>
              <input value={tplName} onChange={(e) => setTplName(e.target.value)} className="w-full rounded-xl border p-2" placeholder="مثال: علی" />

              <label className="text-sm">نام کلینیک</label>
              <input value={tplClinic} onChange={(e) => setTplClinic(e.target.value)} className="w-full rounded-xl border p-2" />

              {tplType === "reminder" && (
                <>
                  <label className="text-sm">تاریخ جلالی</label>
                  <input value={tplDate} onChange={(e) => setTplDate(e.target.value)} className="w-full rounded-xl border p-2" placeholder="مثال: 1404/05/27" />
                  <label className="text-sm">ساعت</label>
                  <input value={tplTime} onChange={(e) => setTplTime(e.target.value)} className="w-full rounded-xl border پ-2" placeholder="مثال: 14:00" />
                </>
              )}

              <button
                disabled={loading || !tplTo || (tplType === "reminder" && (!tplDate || !tplTime))}
                onClick={handleTemplateSend}
                className="w-full mt-2 px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
              >
                ارسال
              </button>
            </div>

            <div className="md:col-span-2">
              <div className="text-sm mb-2 text-gray-600">پیش‌نمایش</div>
              <div className="rounded-2xl border p-4 bg-gray-50 leading-8 whitespace-pre-wrap">{buildPreview()}</div>
              <div className="text-xs text-gray-500 mt-2">اگر متن‌ها را در سرور تغییر می‌دهید (utils/sms.js)، این پیش‌نمایش را هم به‌روزرسانی کنید.</div>
            </div>
          </div>
        </Section>
      )}

      {/* تب ارسال گروهی */}
      {tab === "bulk" && (
        <Section title="ارسال گروهی" right={<span className="text-xs text-gray-400">{patients.length ? `${patients.length} بیمار یافت شد` : ""}</span>}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <label className="text-sm">نوع پیام</label>
              <select value={bulkType} onChange={(e) => setBulkType(e.target.value)} className="w-full rounded-xl border p-2">
                <option value="welcome">خوش‌آمد</option>
                <option value="birthday">تولد</option>
                <option value="reminder">یادآوری نوبت</option>
                <option value="custom">متن دلخواه</option>
              </select>

              {bulkType === "custom" && (
                <>
                  <label className="text-sm">متن دلخواه</label>
                  <textarea value={bulkMsg} onChange={(e) => setBulkMsg(e.target.value)} className="w-full rounded-xl border p-2 h-28" placeholder="متن پیام..." />
                  <div className="text-xs text-gray-500">کاراکتر: {smsLengthInfo.len} | بخش‌ها: {smsLengthInfo.parts}</div>
                </>
              )}

              {bulkType === "reminder" && (
                <>
                  <label className="text-sm">تاریخ جلالی (برای همه)</label>
                  <input value={tplDate} onChange={(e) => setTplDate(e.target.value)} className="w-full rounded-xl border p-2" placeholder="1404/05/27" />
                  <label className="text-sm">ساعت</label>
                  <input value={tplTime} onChange={(e) => setTplTime(e.target.value)} className="w-full rounded-xl border p-2" placeholder="14:00" />
                </>
              )}

              <div className="flex gap-2 mt-2">
                {!bulkRunning ? (
                  <button
                    onClick={runBulk}
                    disabled={selectedIds.size === 0 || (bulkType === "custom" && !bulkMsg)}
                    className="flex-1 px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
                  >
                    شروع ارسال
                  </button>
                ) : (
                  <button onClick={() => (abortRef.current = true)} className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white">
                    توقف
                  </button>
                )}
              </div>
              {bulkRunning && <div className="text-xs text-gray-600 mt-2">پیشرفت: {bulkProgress.sent} / {bulkProgress.total}</div>}
            </div>

            <div className="md:col-span-2">
              <div className="rounded-2xl border p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-bold">لیست بیماران</div>
                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => setSelectedIds(new Set((patients || []).filter((p) => p.phone).map((p) => p._id)))}
                      className="px-3 py-1 rounded-lg border"
                    >
                      انتخاب همه
                    </button>
                    <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1 rounded-lg border">
                      هیچ‌کدام
                    </button>
                  </div>
                </div>
                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-2">انتخاب</th>
                        <th className="p-2 text-right">نام</th>
                        <th className="p-2 text-right">شماره</th>
                        <th className="p-2 text-right">توضیح</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(patients || []).map((p) => (
                        <tr key={p._id} className="border-b hover:bg-gray-50">
                          <td className="p-2 text-center">
                            <input type="checkbox" checked={selectedIds.has(p._id)} onChange={() => toggleSelect(p._id)} disabled={!p.phone} />
                          </td>
                          <td className="p-2">{p.fullName || "-"}</td>
                          <td className="p-2">{p.phone || <span className="text-gray-400">—</span>}</td>
                          <td className="p-2 text-gray-400">{!p.phone ? "شماره ثبت نشده" : ""}</td>
                        </tr>
                      ))}
                      {(Array.isArray(patients) && patients.length === 0) && (
                        <tr>
                          <td className="p-3 text-gray-500" colSpan={4}>بیماری یافت نشد.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* تب قالب‌های دیتابیس (CRUD + ارسال) */}
      {tab === "dbtemplates" && (
        <Section
          title="قالب‌های دیتابیس (CRUD + ارسال)"
          right={
            <div className="flex gap-2 items-center">
              <input
                value={tplQuery}
                onChange={(e) => setTplQuery(e.target.value)}
                placeholder="جستجو بر اساس نام/متن"
                className="rounded-xl border p-2 text-sm"
              />
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* فرم ساخت/ویرایش */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold">{editId ? "ویرایش قالب" : "ایجاد قالب جدید"}</div>
                {editId && (
                  <button onClick={resetForm} className="text-xs px-2 py-1 border rounded-lg">
                    انصراف و ایجاد جدید
                  </button>
                )}
              </div>

              <label className="text-sm">نام قالب (unique)</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border p-2"
                placeholder="مثلاً: appointment_booked"
              />

              <label className="text-sm">متن قالب</label>
              <textarea
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                className="w-full rounded-xl border p-2 ه-36"
                placeholder="از {name}، {date}، {time}، {clinic} استفاده کنید"
              />

              <label className="text-sm">برچسب‌ها (جدا با کاما)</label>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="w-full rounded-xl border p-2"
                placeholder="appointment,auto"
              />

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                فعال باشد
              </label>

              <button
                onClick={handleSaveTemplate}
                disabled={loading}
                className="w-full mt-2 px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
              >
                {editId ? "ذخیره تغییرات" : "ایجاد قالب"}
              </button>

              <div className="text-xs text-gray-500">متغیرهای قابل استفاده: {"{name} {date} {time} {clinic}"}</div>
            </div>

            {/* لیست + ارسال با قالب */}
            <div className="md:col-span-2">
              <div className="rounded-2xl border p-3 space-y-4">
                {/* پارامترهای ارسال با قالب */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 bg-gray-50 p-3 rounded-xl">
                  <input
                    value={sendPreview.to}
                    onChange={(e) => setSendPreview({ ...sendPreview, to: e.target.value })}
                    className="rounded-xl border p-2"
                    placeholder="گیرنده 09xxxxxxxxx"
                  />
                  <input
                    value={sendPreview.name}
                    onChange={(e) => setSendPreview({ ...sendPreview, name: e.target.value })}
                    className="rounded-xl border p-2"
                    placeholder="name"
                  />
                  <input
                    value={sendPreview.date}
                    onChange={(e) => setSendPreview({ ...sendPreview, date: e.target.value })}
                    className="rounded-xl border p-2"
                    placeholder="date (1404/05/29)"
                  />
                  <input
                    value={sendPreview.time}
                    onChange={(e) => setSendPreview({ ...sendPreview, time: e.target.value })}
                    className="rounded-xl border p-2"
                    placeholder="time (14:00)"
                  />
                  <input
                    value={sendPreview.clinic}
                    onChange={(e) => setSendPreview({ ...sendPreview, clinic: e.target.value })}
                    className="rounded-xl border p-2"
                    placeholder="clinic"
                  />
                </div>

                <div className="max-h-[520px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-2 text-right">نام</th>
                        <th className="p-2 text-right">وضعیت</th>
                        <th className="p-2 text-right">برچسب‌ها</th>
                        <th className="p-2 text-right">عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(tpls || []).map((t) => (
                        <tr key={t._id} className="border-b align-top">
                          <td className="p-2">
                            <div className="font-bold">{t.name}</div>
                            <div className="text-gray-500 whitespace-pre-wrap">{t.text}</div>
                          </td>
                          <td className="p-2">{t.isActive ? <span className="text-green-600">فعال</span> : <span className="text-gray-400">غیرفعال</span>}</td>
                          <td className="p-2">{(t.tags || []).join(", ")}</td>
                          <td className="p-2 space-x-2 space-x-reverse">
                            <button onClick={() => handleEdit(t)} className="px-3 py-1 rounded-lg border">
                              ویرایش
                            </button>
                            <button onClick={() => handleDelete(t._id)} className="px-3 py-1 rounded-lg border text-red-600">
                              حذف
                            </button>
                            <button onClick={() => handleSendByTemplate(t)} className="px-3 py-1 rounded-lg bg-black text-white">
                              ارسال با این قالب
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(Array.isArray(tpls) && tpls.length === 0) && (
                        <tr>
                          <td className="p-3 text-gray-500" colSpan={4}>
                            قالبی یافت نشد.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* گزارش همین سشن */}
      <Section title="گزارش همین سشن (Client-side)">
        {logs.length === 0 ? (
          <div className="text-sm text-gray-500">فعلاً موردی ثبت نشده…</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-right">زمان</th>
                  <th className="p-2 text-right">گیرنده</th>
                  <th className="p-2 text-right">نوع</th>
                  <th className="p-2 text-right">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2">{new Date(l.when).toLocaleString()}</td>
                    <td className="p-2">{l.to}</td>
                    <td className="p-2">{l.type}</td>
                    <td className="p-2">{l.ok ? <span className="text-green-600">موفق</span> : <span className="text-red-600">ناموفق</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-white ${
            toast.type === "success" ? "bg-green-600" : toast.type === "error" ? "bg-red-600" : "bg-gray-800"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}