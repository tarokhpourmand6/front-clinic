// src/components/modals/AppointmentCreateModal.jsx
import { useEffect, useMemo, useState } from "react";
import moment from "moment-jalaali";
import DatePicker from "../DatePicker/DatePicker";
import LaserAreaSelector from "../LaserAreaSelector";
import LoadingSpinner from "../LoadingSpinner";
import { getPatientsFast } from "../../api/patients";
import { getAllProducts } from "../../api/inventory";
import { getLaserPrices } from "../../api/laserPrice";
import { createAppointment } from "../../api/appointments";
import { getCareProducts } from "../../api/careProductsApi";
import { getFacialPackages } from "../../api/facialPackagesApi";

moment.loadPersian({ dialect: "persian-modern" });

const PAGE_SIZE = 20;
const fa2en = (s = "") => String(s).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
const normPhone = (s = "") => fa2en(s).replace(/\D/g, "");
const normFa = (s = "") =>
  String(s)
    .trim()
    .replace(/\u200c/g, " ")
    .replace(/‌/g, " ")
    .replace(/\u0640/g, "")
    .replace(/ك/g, "ک")
    .replace(/ي/g, "ی")
    .replace(/\s+/g, " ")
    .toLowerCase();

const Chevron = ({ open }) => (
  <svg
    className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
  >
    <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Section = ({ title, hint, enabled, onToggle, open, onOpenToggle, extraRight, children }) => (
  <div className={`rounded-2xl border transition ${enabled ? "bg-white shadow" : "bg-gray-50"}`}>
    <button
      type="button"
      onClick={onOpenToggle}
      className="w-full flex items-center justify-between gap-3 p-3 md:p-4"
    >
      <div className="flex items-center gap-3">
        <Chevron open={open} />
        <div>
          <div className="font-semibold">{title}</div>
          {hint ? <div className="text-xs text-gray-500">{hint}</div> : null}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {extraRight}
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle?.(e.target.checked)}
            className="sr-only"
          />
          <span className={`w-11 h-6 rounded-full relative transition ${enabled ? "bg-brand/80" : "bg-gray-300"}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition ${enabled ? "translate-x-5" : ""}`} />
          </span>
          <span>{enabled ? "فعال" : "غیرفعال"}</span>
        </label>
      </div>
    </button>
    <div className={`${open ? "block" : "hidden"} ${enabled ? "opacity-100" : "opacity-50 pointer-events-none"} p-3 md:p-4 pt-0`}>
      {children}
    </div>
  </div>
);

export default function AppointmentCreateModal({
  open,
  onClose,
  preselectedPatient,
  onSuccess,
  onCreated,             // برای بازکردن پرداخت بعد از فروش محصول
  onOpenPatientCreate,
}) {
  const [allPatients, setAllPatients] = useState([]);
  const [visiblePatients, setVisiblePatients] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(preselectedPatient || null);

  const [inventory, setInventory] = useState([]);            // تزریقات (sellPrice)
  const [laserPrices, setLaserPrices] = useState({});
  const [careProducts, setCareProducts] = useState([]);      // محصولات (sellPrice)
  const [facialPackages, setFacialPackages] = useState([]);  // پکیج‌ها (price)

  const [loading, setLoading] = useState(false);

  // فرم چندبخشی + آکاردئون
  const [form, setForm] = useState({
    commonDate: null,
    status: "Scheduled",
    injection: { enabled: false, useCommonDate: true, date: null, hour: "08", minute: "00", items: [], price: 0 },
    laser:     { enabled: false, useCommonDate: true, date: null, hour: "08", minute: "00", gender: "female", areas: [], price: 0 },
    products:  { enabled: false, useCommonDate: true, date: null, lines: [], price: 0 }, // time خالی
    facial:    { enabled: false, useCommonDate: true, date: null, hour: "08", minute: "00", lines: [], price: 0 },
  });
  const [openSec, setOpenSec] = useState({ inj: true, laz: false, pro: false, fac: false });

  const hours = useMemo(
    () => Array.from({ length: 15 }, (_, i) => (8 + i).toString().padStart(2, "0")),
    []
  );
  const minutes = ["00", "10", "20", "30", "40", "50"];

  // initial load
  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const [prod, laser, pts, cp, fp] = await Promise.all([
          getAllProducts(),
          getLaserPrices(),
          getPatientsFast(),
          getCareProducts(),
          getFacialPackages(),
        ]);

        setInventory(Array.isArray(prod) ? prod : []);

        const priceMap = {};
        (laser || []).forEach(({ gender, area, price }) => {
          priceMap[`${gender}-${area}`] = Number(price) || 0;
        });
        setLaserPrices(priceMap);

        setCareProducts(Array.isArray(cp) ? cp : []);
        setFacialPackages(Array.isArray(fp) ? fp : []);

        const rawList = Array.isArray(pts) ? pts : [];
        const list = rawList.map((p) => ({
          ...p,
          _name: normFa(p?.fullName || ""),
          _phone: normPhone(p?.phone || ""),
        }));
        setAllPatients(list);

        setSearch("");
        setPage(1);
        const first = list.slice(0, PAGE_SIZE);
        setVisiblePatients(first);
        setHasMore(first.length < list.length);

        setSelectedPatient(preselectedPatient || null);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, preselectedPatient]);

  // search
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const qRaw = (search || "").trim();
      const qName = normFa(qRaw);
      const qPhone = normPhone(qRaw);

      const filtered = qRaw
        ? allPatients.filter((p) =>
            (qName && p._name.includes(qName)) || (qPhone && p._phone.includes(qPhone))
          )
        : allPatients;

      const first = filtered.slice(0, PAGE_SIZE);
      setVisiblePatients(first);
      setPage(1);
      setHasMore(first.length < filtered.length);
    }, 200);
    return () => clearTimeout(t);
  }, [search, allPatients, open]);

  const loadMore = () => {
    const qRaw = (search || "").trim();
    const qName = normFa(qRaw);
    const qPhone = normPhone(qRaw);

    const filtered = qRaw
      ? allPatients.filter((p) =>
          (qName && p._name.includes(qName)) || (qPhone && p._phone.includes(qPhone))
        )
      : allPatients;

    const nextPage = page + 1;
    const nextSlice = filtered.slice(0, nextPage * PAGE_SIZE);
    setVisiblePatients(nextSlice);
    setPage(nextPage);
    setHasMore(nextSlice.length < filtered.length);
  };

  // price calc — توجه: برای محصولات و تزریقات از sellPrice استفاده می‌کنیم
  useEffect(() => {
    // تزریقات
    let injTotal = 0;
    (form.injection.items || []).forEach(({ name, amount }) => {
      const found = (inventory || []).find((i) => i.name === name);
      const unit = Number(found?.sellPrice) || 0;
      injTotal += unit * (Number(amount) || 1);
    });

    // لیزر
    let laserTotal = 0;
    (form.laser.areas || []).forEach((area) => {
      const price = laserPrices[`${form.laser.gender}-${area}`];
      if (price) laserTotal += Number(price);
    });

    // محصولات
    let prodTotal = 0;
    (form.products.lines || []).forEach(({ id, qty, unitPrice }) => {
      const fallback = (careProducts || []).find((x) => x._id === id)?.sellPrice; // 👈 sellPrice
      const unit = Number.isFinite(Number(unitPrice)) ? Number(unitPrice) : Number(fallback) || 0;
      prodTotal += unit * (Number(qty) || 1);
    });

    // فیشیال
    let facialTotal = 0;
    (form.facial.lines || []).forEach(({ id, qty }) => {
      const pkgPrice = (facialPackages || []).find((x) => x._id === id)?.price;
      facialTotal += (Number(pkgPrice) || 0) * (Number(qty) || 1);
    });

    setForm((s) => ({
      ...s,
      injection: { ...s.injection, price: injTotal },
      laser:     { ...s.laser,     price: laserTotal },
      products:  { ...s.products,  price: prodTotal },
      facial:    { ...s.facial,    price: facialTotal },
    }));
  }, [form.injection.items, form.laser.areas, form.laser.gender, form.products.lines, form.facial.lines, inventory, laserPrices, careProducts, facialPackages]);

  const grandTotal = (form.injection.price || 0) + (form.laser.price || 0) + (form.products.price || 0) + (form.facial.price || 0);

  // helpers
  const jdate = (d) => moment(`${d.year}/${d.month}/${d.day}`, "jYYYY/jM/jD").format("jYYYY-jMM-jDD");
  const resolveDate = (part) => {
    const d = part.useCommonDate ? form.commonDate : part.date;
    return d ? jdate(d) : null;
  };

  // submit (چند payload جدا)
  const handleSubmit = async () => {
    if (!selectedPatient?._id) return alert("بیمار انتخاب نشده است.");

    const payloads = [];

    if (form.injection.enabled && (form.injection.items || []).length) {
      const dateStr = resolveDate(form.injection);
      if (!dateStr) return alert("تاریخ تزریقات را تعیین کنید.");
      payloads.push({
        type: "Injection",
        patientId: selectedPatient._id,
        dateShamsi: dateStr,
        time: `${form.injection.hour}:${form.injection.minute}`,
        status: form.status,
        price: form.injection.price,
        consumables: form.injection.items,
        laserAreas: [],
      });
    }

    if (form.laser.enabled && (form.laser.areas || []).length) {
      const dateStr = resolveDate(form.laser);
      if (!dateStr) return alert("تاریخ لیزر را تعیین کنید.");
      payloads.push({
        type: "Laser",
        patientId: selectedPatient._id,
        dateShamsi: dateStr,
        time: `${form.laser.hour}:${form.laser.minute}`,
        status: form.status,
        price: form.laser.price,
        laserAreas: form.laser.areas.map((a) => ({ area: a, gender: form.laser.gender })),
        consumables: [],
      });
    }

    if (form.products.enabled && (form.products.lines || []).length) {
      const dateStr = resolveDate(form.products);
      if (!dateStr) return alert("تاریخ فروش محصولات را تعیین کنید.");
      payloads.push({
        type: "CareProductSale",
        patientId: selectedPatient._id,
        dateShamsi: dateStr,
        time: "", // ساعت ندارد
        status: form.status,
        price: form.products.price,
        products: (form.products.lines || []).map(({ id, qty, unitPrice }) => {
          const fallback = (careProducts || []).find((x) => x._id === id)?.sellPrice; // 👈 sellPrice
          const unit = Number.isFinite(Number(unitPrice)) ? Number(unitPrice) : Number(fallback) || 0;
          return { productId: id, qty: Number(qty) || 1, unitPrice: unit };
        }),
      });
    }

    if (form.facial.enabled && (form.facial.lines || []).length) {
      const dateStr = resolveDate(form.facial);
      if (!dateStr) return alert("تاریخ فیشیال را تعیین کنید.");
      payloads.push({
        type: "Facial",
        patientId: selectedPatient._id,
        dateShamsi: dateStr,
        time: `${form.facial.hour}:${form.facial.minute}`,
        status: form.status,
        price: form.facial.price,
        facials: (form.facial.lines || []).map(({ id, qty }) => {
          const pkg = (facialPackages || []).find((x) => x._id === id);
          return { packageId: id, qty: Number(qty) || 1, unitPrice: Number(pkg?.price) || 0 };
        }),
      });
    }

    if (payloads.length === 0) return alert("هیچ بخشی فعال/پر نشده است.");

    try {
      const created = [];
      for (const p of payloads) {
        const res = await createAppointment(p);
        created.push(res?.data ?? res);
      }
      const lastSale = [...created].reverse().find(x => x?.type === "CareProductSale");
      if (lastSale?._id) {
        onCreated?.({
          id: lastSale._id,
          price: Number(lastSale.price) || 0,
          paymentDetails: Array.isArray(lastSale.paymentDetails) ? lastSale.paymentDetails : [],
        });
      }
      onSuccess?.();
      onClose?.();
    } catch (e) {
      console.error(e);
      alert("⛔️ خطا در ثبت خدمات/فروش");
    }
  };

  // pickers
  const InjectionPicker = () => (
    <div className="grid md:grid-cols-2 gap-2">
      {(inventory || []).map((item) => {
        const selected = (form.injection.items || []).find(x => x.name === item.name);
        return (
          <div key={item._id || item.name} className="flex items-center gap-2 border rounded p-2">
            <input
              type="checkbox"
              checked={!!selected}
              onChange={(e) => {
                let next = [...(form.injection.items || [])];
                if (e.target.checked) next.push({ name: item.name, amount: 1 });
                else next = next.filter((x) => x.name !== item.name);
                setForm(s => ({ ...s, injection: { ...s.injection, items: next }}));
              }}
            />
            <div className="flex-1">
              <div className="font-medium">{item.name}</div>
              <div className="text-xs text-gray-500">
                فروش: {(Number(item?.sellPrice)||0).toLocaleString("fa-IR")}
              </div>
            </div>
            {!!selected && (
              <input
                type="number"
                min="1"
                value={selected.amount || 1}
                onChange={(e) => {
                  const next = (form.injection.items || []).map((opt) =>
                    opt.name === item.name ? { ...opt, amount: Number(e.target.value)||1 } : opt
                  );
                  setForm(s => ({ ...s, injection: { ...s.injection, items: next }}));
                }}
                className="w-16 border p-1 text-sm rounded text-center"
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const LaserPicker = () => (
    <>
      <div className="grid md:grid-cols-3 gap-3 mb-3">
        <div className="md:col-span-1">
          <label className="text-sm">جنسیت</label>
          <select
            className="mt-1 border p-2 rounded w-full"
            value={form.laser.gender}
            onChange={(e)=> setForm(s => ({ ...s, laser: { ...s.laser, gender: e.target.value, areas: [] }}))}
          >
            <option value="female">خانم</option>
            <option value="male">آقا</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm">نواحی</label>
          <div className="mt-1">
            <LaserAreaSelector
              gender={form.laser.gender}
              selectedAreas={form.laser.areas}
              onChange={(areas)=> setForm(s => ({ ...s, laser: { ...s.laser, areas }}))}
            />
          </div>
        </div>
      </div>
    </>
  );

  const ProductPicker = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {(careProducts || []).map((p) => {
        const chosen = (form.products.lines || []).find((x) => x.id === p._id);
        const unitDefault = Number(p?.sellPrice) || 0; // 👈 sellPrice
        return (
          <div key={p._id} className="flex items-center gap-2 border p-2 rounded">
            <input
              type="checkbox"
              checked={!!chosen}
              onChange={(e) => {
                let next = [...(form.products.lines || [])];
                if (e.target.checked) {
                  next.push({ id: p._id, qty: 1, unitPrice: unitDefault });
                } else {
                  next = next.filter((x) => x.id !== p._id);
                }
                setForm(s => ({ ...s, products: { ...s.products, lines: next }}));
              }}
            />
            <div className="flex-1">
              <div className="font-medium">{p.name}{p.brand ? ` — ${p.brand}` : ""}</div>
              <div className="text-xs text-gray-500">
                فروش: {unitDefault.toLocaleString("fa-IR")}
              </div>
            </div>
            {!!chosen && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={chosen.qty}
                  onChange={(e) => {
                    const qty = Number(e.target.value) || 1;
                    const next = (form.products.lines || []).map((x) =>
                      x.id === p._id ? { ...x, qty } : x
                    );
                    setForm(s => ({ ...s, products: { ...s.products, lines: next }}));
                  }}
                  className="w-16 border p-1 text-sm rounded text-center"
                />
                <input
                  type="number"
                  min="0"
                  value={chosen.unitPrice}
                  onChange={(e) => {
                    const price = Number(e.target.value);
                    const next = (form.products.lines || []).map((x) =>
                      x.id === p._id ? { ...x, unitPrice: Number.isFinite(price) ? price : unitDefault } : x
                    );
                    setForm(s => ({ ...s, products: { ...s.products, lines: next }}));
                  }}
                  className="w-24 border p-1 text-sm rounded text-center"
                  placeholder="قیمت واحد"
                  title="می‌تونی قیمت فروش را دستی Override کنی"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const FacialPicker = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {(facialPackages || []).map((pkg) => {
        const chosen = (form.facial.lines || []).find((x) => x.id === pkg._id);
        return (
          <div key={pkg._id} className="flex items-center gap-2 border p-2 rounded">
            <input
              type="checkbox"
              checked={!!chosen}
              onChange={(e) => {
                let next = [...(form.facial.lines || [])];
                if (e.target.checked) next.push({ id: pkg._id, qty: 1 });
                else next = next.filter((x) => x.id !== pkg._id);
                setForm(s => ({ ...s, facial: { ...s.facial, lines: next }}));
              }}
            />
            <div className="flex-1">
              <div className="font-medium">{pkg.name}</div>
              <div className="text-xs text-gray-500">
                قیمت: {(Number(pkg?.price)||0).toLocaleString("fa-IR")}
              </div>
            </div>
            {!!chosen && (
              <input
                type="number"
                min="1"
                value={chosen.qty}
                onChange={(e) => {
                  const qty = Number(e.target.value) || 1;
                  const next = (form.facial.lines || []).map((x) =>
                    x.id === pkg._id ? { ...x, qty } : x
                  );
                  setForm(s => ({ ...s, facial: { ...s.facial, lines: next }}));
                }}
                className="w-16 border p-1 text-sm rounded text-center"
              />
            )}
          </div>
        );
      })}
    </div>
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-4 md:p-6 font-vazir">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg md:text-xl font-bold">ثبت خدمات/فروش برای بیمار</h3>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg border hover:bg-gray-50">بستن</button>
        </div>

        {loading ? (
          <div className="py-12"><LoadingSpinner /></div>
        ) : (
          <>
            {!selectedPatient ? (
              <div className="mb-5">
                <div className="flex gap-2">
                  <input
                    className="border p-2 rounded w-full"
                    placeholder="جستجوی نام یا شماره"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button onClick={onOpenPatientCreate} className="px-3 py-2 rounded-lg border hover:bg-gray-50">
                    + ثبت بیمار
                  </button>
                </div>

                <div className="mt-2 max-h-64 overflow-auto border rounded">
                  {(visiblePatients || []).map((p) => (
                    <button
                      key={p._id}
                      onClick={() => setSelectedPatient(p)}
                      className="block w-full text-right text-sm px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      {p.fullName} — {p.phone}
                    </button>
                  ))}
                  {hasMore && (
                    <button onClick={loadMore} className="w-full py-2 text-sm text-blue-600">
                      نمایش موارد بیشتر...
                    </button>
                  )}
                  {!hasMore && (visiblePatients || []).length === 0 && (
                    <div className="p-3 text-xs text-gray-500 text-center">موردی پیدا نشد</div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* patient bar + common date */}
                <div className="bg-gray-50 border rounded-xl p-3 mb-4 text-sm flex items-center justify-between gap-3">
                  <span className="truncate">{selectedPatient.fullName} — {selectedPatient.phone}</span>
                  <button className="text-xs underline shrink-0" onClick={() => setSelectedPatient(null)}>تغییر بیمار</button>
                </div>

                <div className="grid md:grid-cols-3 gap-3 mb-5">
                  <div className="md:col-span-2">
                    <label className="text-sm">تاریخ مشترک (اختیاری)</label>
                    <DatePicker
                      value={form.commonDate}
                      onChange={(date)=> setForm(s => ({ ...s, commonDate: date }))}
                      inputPlaceholder="تاریخ"
                      locale="fa"
                      inputClassName="border p-2 rounded w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm">وضعیت</label>
                    <select
                      className="mt-1 border p-2 rounded w-full"
                      value={form.status}
                      onChange={(e)=> setForm(s => ({ ...s, status: e.target.value }))}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Canceled">Canceled</option>
                    </select>
                  </div>
                </div>

                {/* Injection */}
                <Section
                  title="تزریقات"
                  hint="انتخاب اقلام تزریقی از انبار"
                  enabled={form.injection.enabled}
                  onToggle={(v)=> setForm(s => ({ ...s, injection: { ...s.injection, enabled: v }}))}
                  open={openSec.inj}
                  onOpenToggle={()=> setOpenSec(s => ({ ...s, inj: !s.inj }))}
                  extraRight={
                    <label className="text-xs md:text-sm inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.injection.useCommonDate}
                        onChange={(e)=> setForm(s => ({ ...s, injection: { ...s.injection, useCommonDate: e.target.checked }}))}
                      />
                      تاریخ مشترک
                    </label>
                  }
                >
                  {!form.injection.useCommonDate && (
                    <div className="grid md:grid-cols-3 gap-3 mb-3">
                      <div className="md:col-span-1">
                        <label className="text-sm">تاریخ</label>
                        <DatePicker
                          value={form.injection.date}
                          onChange={(date)=> setForm(s => ({ ...s, injection: { ...s.injection, date }}))}
                          inputPlaceholder="تاریخ"
                          locale="fa"
                          inputClassName="border p-2 rounded w-full"
                        />
                      </div>
                      <div>
                        <label className="text-sm">ساعت</label>
                        <select className="mt-1 border p-2 rounded w-full"
                          value={form.injection.hour}
                          onChange={(e)=> setForm(s => ({ ...s, injection: { ...s.injection, hour: e.target.value }}))}
                        >
                          {hours.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm">دقیقه</label>
                        <select className="mt-1 border p-2 rounded w-full"
                          value={form.injection.minute}
                          onChange={(e)=> setForm(s => ({ ...s, injection: { ...s.injection, minute: e.target.value }}))}
                        >
                          {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                  <InjectionPicker />
                  <div className="text-sm text-gray-700 mt-3">مبلغ بخش: {form.injection.price.toLocaleString("fa-IR")}</div>
                </Section>

                {/* Laser */}
                <Section
                  title="لیزر"
                  hint="انتخاب نواحی بر اساس جنسیت"
                  enabled={form.laser.enabled}
                  onToggle={(v)=> setForm(s => ({ ...s, laser: { ...s.laser, enabled: v }}))}
                  open={openSec.laz}
                  onOpenToggle={()=> setOpenSec(s => ({ ...s, laz: !s.laz }))}
                  extraRight={
                    <label className="text-xs md:text-sm inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.laser.useCommonDate}
                        onChange={(e)=> setForm(s => ({ ...s, laser: { ...s.laser, useCommonDate: e.target.checked }}))}
                      />
                      تاریخ مشترک
                    </label>
                  }
                >
                  {!form.laser.useCommonDate && (
                    <div className="grid md:grid-cols-3 gap-3 mb-3">
                      <div className="md:col-span-1">
                        <label className="text-sm">تاریخ</label>
                        <DatePicker
                          value={form.laser.date}
                          onChange={(date)=> setForm(s => ({ ...s, laser: { ...s.laser, date }}))}
                          inputPlaceholder="تاریخ"
                          locale="fa"
                          inputClassName="border p-2 rounded w-full"
                        />
                      </div>
                      <div>
                        <label className="text-sm">ساعت</label>
                        <select className="mt-1 border p-2 rounded w-full"
                          value={form.laser.hour}
                          onChange={(e)=> setForm(s => ({ ...s, laser: { ...s.laser, hour: e.target.value }}))}
                        >
                          {hours.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm">دقیقه</label>
                        <select className="mt-1 border p-2 rounded w-full"
                          value={form.laser.minute}
                          onChange={(e)=> setForm(s => ({ ...s, laser: { ...s.laser, minute: e.target.value }}))}
                        >
                          {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                  <LaserPicker />
                  <div className="text-sm text-gray-700 mt-3">مبلغ بخش: {form.laser.price.toLocaleString("fa-IR")}</div>
                </Section>

                {/* Products */}
                <Section
                  title="فروش محصولات"
                  hint="انتخاب محصولات مراقبتی؛ ساعت لازم نیست"
                  enabled={form.products.enabled}
                  onToggle={(v)=> setForm(s => ({ ...s, products: { ...s.products, enabled: v }}))}
                  open={openSec.pro}
                  onOpenToggle={()=> setOpenSec(s => ({ ...s, pro: !s.pro }))}
                  extraRight={
                    <label className="text-xs md:text-sm inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.products.useCommonDate}
                        onChange={(e)=> setForm(s => ({ ...s, products: { ...s.products, useCommonDate: e.target.checked }}))}
                      />
                      تاریخ مشترک
                    </label>
                  }
                >
                  {!form.products.useCommonDate && (
                    <div className="mb-3">
                      <label className="text-sm">تاریخ فروش</label>
                      <DatePicker
                        value={form.products.date}
                        onChange={(date)=> setForm(s => ({ ...s, products: { ...s.products, date }}))}
                        inputPlaceholder="تاریخ"
                        locale="fa"
                        inputClassName="border p-2 rounded w-full"
                      />
                    </div>
                  )}
                  <ProductPicker />
                  <div className="text-sm text-gray-700 mt-3">مبلغ بخش: {form.products.price.toLocaleString("fa-IR")}</div>
                </Section>

                {/* Facial */}
                <Section
                  title="فیشیال"
                  hint="انتخاب پکیج‌های فیشیال"
                  enabled={form.facial.enabled}
                  onToggle={(v)=> setForm(s => ({ ...s, facial: { ...s.facial, enabled: v }}))}
                  open={openSec.fac}
                  onOpenToggle={()=> setOpenSec(s => ({ ...s, fac: !s.fac }))}
                  extraRight={
                    <label className="text-xs md:text-sm inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.facial.useCommonDate}
                        onChange={(e)=> setForm(s => ({ ...s, facial: { ...s.facial, useCommonDate: e.target.checked }}))}
                      />
                      تاریخ مشترک
                    </label>
                  }
                >
                  {!form.facial.useCommonDate && (
                    <div className="grid md:grid-cols-3 gap-3 mb-3">
                      <div className="md:col-span-1">
                        <label className="text-sm">تاریخ</label>
                        <DatePicker
                          value={form.facial.date}
                          onChange={(date)=> setForm(s => ({ ...s, facial: { ...s.facial, date }}))}
                          inputPlaceholder="تاریخ"
                          locale="fa"
                          inputClassName="border p-2 rounded w-full"
                        />
                      </div>
                      <div>
                        <label className="text-sm">ساعت</label>
                        <select className="mt-1 border p-2 rounded w-full"
                          value={form.facial.hour}
                          onChange={(e)=> setForm(s => ({ ...s, facial: { ...s.facial, hour: e.target.value }}))}
                        >
                          {hours.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm">دقیقه</label>
                        <select className="mt-1 border p-2 rounded w-full"
                          value={form.facial.minute}
                          onChange={(e)=> setForm(s => ({ ...s, facial: { ...s.facial, minute: e.target.value }}))}
                        >
                          {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                  <FacialPicker />
                  <div className="text-sm text-gray-700 mt-3">مبلغ بخش: {form.facial.price.toLocaleString("fa-IR")}</div>
                </Section>

                {/* footer */}
                <div className="mt-5 flex items-center justify-between">
                  <div className="text-sm md:text-base text-gray-700">
                    جمع کل: <span className="font-bold">{grandTotal.toLocaleString("fa-IR")}</span>
                  </div>
                  <button onClick={handleSubmit} className="bg-brand text-white px-4 py-2 rounded-xl hover:opacity-95">
                    ثبت
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}