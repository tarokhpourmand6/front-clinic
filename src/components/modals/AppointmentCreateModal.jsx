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

function Accordion({ title, count = 0, open, onToggle, children }) {
  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold">{title}</span>
          {!!count && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>}
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
        </svg>
      </button>
      <div className={`transition-all ${open ? "max-h-[1200px] p-3" : "max-h-0 p-0"} overflow-hidden`}>
        {open ? children : null}
      </div>
    </div>
  );
}

export default function AppointmentCreateModal({
  open,
  onClose,
  preselectedPatient,
  onSuccess,
  onCreated,            // برای باز کردن PaymentModal بعد از فروش محصول
  onOpenPatientCreate,
}) {
  const [allPatients, setAllPatients] = useState([]);
  const [visiblePatients, setVisiblePatients] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(preselectedPatient || null);

  // لیست‌ها
  const [injectionItems, setInjectionItems] = useState([]); // از inventory
  const [laserPrices, setLaserPrices] = useState({});
  const [careProducts, setCareProducts] = useState([]);     // از careProductsApi
  const [facialPackages, setFacialPackages] = useState([]); // از facialPackagesApi

  const [loading, setLoading] = useState(false);

  const [appointment, setAppointment] = useState({
    serviceType: "تزریقات",
    serviceOption: [],
    appointmentDate: null,
    appointmentHour: "08",
    appointmentMinute: "00",
    status: "Scheduled",
    price: 0,
    gender: "female",
  });

  // آکاردئون‌ها
  const [openInj, setOpenInj] = useState(true);
  const [openLaser, setOpenLaser] = useState(false);
  const [openProducts, setOpenProducts] = useState(false);
  const [openFacial, setOpenFacial] = useState(false);

  const hours = useMemo(
    () => Array.from({ length: 15 }, (_, i) => (8 + i).toString().padStart(2, "0")),
    []
  );
  const minutes = ["00", "10", "20", "30", "40", "50"];

  // helper قیمت واحد با پشتیبانی از sellPrice/sellprice/price
  const getUnit = (obj) => Number(obj?.sellPrice ?? obj?.sellprice ?? obj?.price ?? 0) || 0;

  // initial load
  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const [inv, laser, pts, cp, fp] = await Promise.all([
          getAllProducts(),
          getLaserPrices(),
          getPatientsFast(),
          getCareProducts(),
          getFacialPackages(),
        ]);

        setInjectionItems(Array.isArray(inv) ? inv : []);

        const priceMap = {};
        (laser || []).forEach(({ gender, area, price }) => {
          priceMap[`${gender}-${area}`] = price;
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

  // client search
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

  // price calc
  useEffect(() => {
    let total = 0;

    if (appointment.serviceType === "تزریقات") {
      (appointment.serviceOption || []).forEach(({ name, amount }) => {
        const found = (injectionItems || []).find((i) => i.name === name);
        const unit = getUnit(found); // ← sellPrice یا sellprice
        total += unit * (Number(amount) || 1);
      });
    } else if (appointment.serviceType === "لیزر") {
      (appointment.serviceOption || []).forEach((area) => {
        const price = Number(laserPrices[`${appointment.gender}-${area}`]) || 0;
        total += price;
      });
    } else if (appointment.serviceType === "محصولات") {
      (appointment.serviceOption || []).forEach(({ id, qty, unitPrice }) => {
        let unit = Number(unitPrice);
        if (!Number.isFinite(unit)) {
          const p = (careProducts || []).find((x) => x._id === id);
          unit = getUnit(p);
        }
        total += unit * (Number(qty) || 1);
      });
    } else if (appointment.serviceType === "فیشیال") {
      (appointment.serviceOption || []).forEach(({ id, qty }) => {
        const pkg = (facialPackages || []).find((x) => x._id === id);
        const unit = Number(pkg?.price) || 0;
        total += unit * (Number(qty) || 1);
      });
    }

    setAppointment((s) => ({ ...s, price: total }));
  }, [
    appointment.serviceOption,
    appointment.gender,
    appointment.serviceType,
    injectionItems,
    laserPrices,
    careProducts,
    facialPackages,
  ]);

  if (!open) return null;

  // submit
  const handleSubmit = async () => {
    if (!selectedPatient?._id) {
      alert("بیمار انتخاب نشده است.");
      return;
    }
    if (!(appointment.serviceOption || []).length) {
      alert("هیچ موردی انتخاب نشده است.");
      return;
    }

    const chosenDate = appointment.appointmentDate;
    if (!chosenDate) {
      alert(appointment.serviceType === "محصولات" ? "تاریخ فروش را انتخاب کنید." : "تاریخ نوبت را انتخاب کنید.");
      return;
    }

    const jDate = moment(
      `${chosenDate.year}/${chosenDate.month}/${chosenDate.day}`,
      "jYYYY/jM/jD"
    ).format("jYYYY-jMM-jDD");

    const timeStr =
      appointment.serviceType === "محصولات"
        ? ""
        : `${appointment.appointmentHour}:${appointment.appointmentMinute}`;

    let payload = {
      patientId: selectedPatient._id,
      dateShamsi: jDate,
      time: timeStr,
      status: appointment.status,
      price: appointment.price,
    };

    if (appointment.serviceType === "تزریقات") {
      payload = {
        ...payload,
        type: "Injection",
        consumables: appointment.serviceOption, // [{name, amount}]
        laserAreas: [],
      };
    } else if (appointment.serviceType === "لیزر") {
      payload = {
        ...payload,
        type: "Laser",
        laserAreas: appointment.serviceOption.map((a) => ({ area: a, gender: appointment.gender })),
        consumables: [],
      };
    } else if (appointment.serviceType === "محصولات") {
      payload = {
        ...payload,
        type: "CareProductSale",
        products: (appointment.serviceOption || []).map(({ id, qty, unitPrice }) => {
          let unit = Number(unitPrice);
          if (!Number.isFinite(unit)) {
            const p = (careProducts || []).find((x) => x._id === id);
            unit = getUnit(p);
          }
          return {
            productId: id,
            qty: Number(qty) || 1,
            unitPrice: unit,
          };
        }),
      };
    } else if (appointment.serviceType === "فیشیال") {
      payload = {
        ...payload,
        type: "Facial",
        facials: (appointment.serviceOption || []).map(({ id, qty }) => {
          const pkg = (facialPackages || []).find((x) => x._id === id);
          return {
            packageId: id,
            qty: Number(qty) || 1,
            unitPrice: Number(pkg?.price) || 0,
          };
        }),
      };
    }

    try {
      const res = await createAppointment(payload);
      const appt = res?.data ?? res;

      if (appointment.serviceType === "محصولات" && appt?._id) {
        onCreated?.({
          id: appt._id,
          price: Number(appt.price) || 0,
          paymentDetails: Array.isArray(appt.paymentDetails) ? appt.paymentDetails : [],
        });
        onSuccess?.();
        onClose?.();
        return;
      }

      onSuccess?.();
      onClose?.();
    } catch {
      alert("⛔️ خطا در ثبت");
    }
  };

  // pickers
  const InjectionPicker = () => (
    <Accordion
      title="💉 تزریقات"
      count={(appointment.serviceType === "تزریقات" ? appointment.serviceOption?.length : 0) || 0}
      open={openInj}
      onToggle={() => {
        setOpenInj(!openInj);
        setOpenLaser(false); setOpenProducts(false); setOpenFacial(false);
        setAppointment((s) => ({ ...s, serviceType: "تزریقات", serviceOption: [] }));
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(injectionItems || []).map((item) => {
          const selected = (appointment.serviceOption || []).find((x) => x.name === item.name);
          const unit = getUnit(item);
          return (
            <div key={item._id || item.name} className="flex items-center gap-2 border p-2 rounded hover:bg-gray-50">
              <input
                type="checkbox"
                checked={!!selected}
                onChange={(e) => {
                  let updated = [...(appointment.serviceOption || [])];
                  if (e.target.checked) updated.push({ name: item.name, amount: 1 });
                  else updated = updated.filter((x) => x.name !== item.name);
                  setAppointment((s) => ({ ...s, serviceOption: updated, serviceType: "تزریقات" }));
                }}
              />
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-gray-500">قیمت: {unit.toLocaleString("fa-IR")}</div>
              </div>
              {!!selected && (
                <input
                  type="number"
                  min="1"
                  value={selected.amount || 1}
                  onChange={(e) => {
                    const updated = (appointment.serviceOption || []).map((opt) =>
                      opt.name === item.name ? { ...opt, amount: e.target.value } : opt
                    );
                    setAppointment((s) => ({ ...s, serviceOption: updated }));
                  }}
                  className="w-16 border p-1 text-sm rounded text-center"
                />
              )}
            </div>
          );
        })}
      </div>
    </Accordion>
  );

  const LaserPicker = () => (
    <Accordion
      title="⚡️ لیزر"
      count={(appointment.serviceType === "لیزر" ? appointment.serviceOption?.length : 0) || 0}
      open={openLaser}
      onToggle={() => {
        setOpenLaser(!openLaser);
        setOpenInj(false); setOpenProducts(false); setOpenFacial(false);
        setAppointment((s) => ({ ...s, serviceType: "لیزر", serviceOption: [] }));
      }}
    >
      <div className="mb-3">
        <label className="text-sm">جنسیت:</label>
        <select
          value={appointment.gender}
          onChange={(e) => setAppointment((s) => ({ ...s, gender: e.target.value, serviceOption: [] }))}
          className="border p-2 rounded w-full text-sm mt-1"
        >
          <option value="female">خانم</option>
          <option value="male">آقا</option>
        </select>
      </div>
      <LaserAreaSelector
        gender={appointment.gender}
        selectedAreas={appointment.serviceOption}
        onChange={(areas) => setAppointment((s) => ({ ...s, serviceOption: areas }))}
      />
    </Accordion>
  );

  const ProductPicker = () => (
    <Accordion
      title="📦 محصولات مراقبتی"
      count={(appointment.serviceType === "محصولات" ? appointment.serviceOption?.length : 0) || 0}
      open={openProducts}
      onToggle={() => {
        setOpenProducts(!openProducts);
        setOpenInj(false); setOpenLaser(false); setOpenFacial(false);
        setAppointment((s) => ({ ...s, serviceType: "محصولات", serviceOption: [] }));
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        {(careProducts || []).map((p) => {
          const chosen = (appointment.serviceOption || []).find((x) => x.id === p._id);
          const unit = getUnit(p);
          return (
            <div key={p._id} className="flex items-center gap-2 border p-2 rounded hover:bg-gray-50">
              <input
                type="checkbox"
                checked={!!chosen}
                onChange={(e) => {
                  let next = [...(appointment.serviceOption || [])];
                  if (e.target.checked) {
                    next.push({ id: p._id, qty: 1, unitPrice: unit });
                  } else {
                    next = next.filter((x) => x.id !== p._id);
                  }
                  setAppointment((s) => ({ ...s, serviceOption: next, serviceType: "محصولات" }));
                }}
              />
              <div className="flex-1">
                <div className="font-medium">{p.name}{p.brand ? ` — ${p.brand}` : ""}</div>
                <div className="text-xs text-gray-500">فروش: {unit.toLocaleString("fa-IR")}</div>
              </div>
              {!!chosen && (
                <input
                  type="number"
                  min="1"
                  value={chosen.qty}
                  onChange={(e) => {
                    const qty = Number(e.target.value) || 1;
                    const next = (appointment.serviceOption || []).map((x) =>
                      x.id === p._id ? { ...x, qty } : x
                    );
                    setAppointment((s) => ({ ...s, serviceOption: next }));
                  }}
                  className="w-16 border p-1 text-sm rounded text-center"
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-2">تاریخ فروش الزامی است؛ ساعت لازم نیست.</p>
    </Accordion>
  );

  const FacialPicker = () => (
    <Accordion
      title="🧖‍♀️ فیشیال"
      count={(appointment.serviceType === "فیشیال" ? appointment.serviceOption?.length : 0) || 0}
      open={openFacial}
      onToggle={() => {
        setOpenFacial(!openFacial);
        setOpenInj(false); setOpenLaser(false); setOpenProducts(false);
        setAppointment((s) => ({ ...s, serviceType: "فیشیال", serviceOption: [] }));
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        {(facialPackages || []).map((pkg) => {
          const chosen = (appointment.serviceOption || []).find((x) => x.id === pkg._id);
          const unit = Number(pkg?.price) || 0;
          return (
            <div key={pkg._id} className="flex items-center gap-2 border p-2 rounded hover:bg-gray-50">
              <input
                type="checkbox"
                checked={!!chosen}
                onChange={(e) => {
                  let next = [...(appointment.serviceOption || [])];
                  if (e.target.checked) next.push({ id: pkg._id, qty: 1 });
                  else next = next.filter((x) => x.id !== pkg._id);
                  setAppointment((s) => ({ ...s, serviceOption: next, serviceType: "فیشیال" }));
                }}
              />
              <div className="flex-1">
                <div className="font-medium">{pkg.name}</div>
                <div className="text-xs text-gray-500">قیمت: {unit.toLocaleString("fa-IR")}</div>
              </div>
              {!!chosen && (
                <input
                  type="number"
                  min="1"
                  value={chosen.qty}
                  onChange={(e) => {
                    const qty = Number(e.target.value) || 1;
                    const next = (appointment.serviceOption || []).map((x) =>
                      x.id === pkg._id ? { ...x, qty } : x
                    );
                    setAppointment((s) => ({ ...s, serviceOption: next }));
                  }}
                  className="w-16 border p-1 text-sm rounded text-center"
                />
              )}
            </div>
          );
        })}
      </div>
    </Accordion>
  );

  const showHourMinute = appointment.serviceType !== "محصولات";

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl font-vazir">
        {/* هدر ثابت */}
        <div className="px-4 md:px-6 pt-4 pb-3 border-b sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">ثبت نوبت</h3>
            <button onClick={onClose} className="px-2 py-1 rounded-lg border">بستن</button>
          </div>
        </div>

        {/* بدنه اسکرول‌دار */}
        <div className="px-4 md:px-6 py-4 max-h-[85vh] overflow-y-auto">
          {loading ? (
            <div className="py-12"><LoadingSpinner /></div>
          ) : (
            <>
              {!selectedPatient && (
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      className="border p-2 rounded w-full"
                      placeholder="جستجوی نام یا شماره"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <button onClick={onOpenPatientCreate} className="px-3 py-2 rounded-lg border">
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
              )}

              {selectedPatient && (
                <>
                  <div className="bg-gray-50 border rounded p-2 mb-4 text-sm flex items-center justify-between">
                    <span>{selectedPatient.fullName} — {selectedPatient.phone}</span>
                    <button className="text-xs underline" onClick={() => setSelectedPatient(null)}>تغییر بیمار</button>
                  </div>

                  {/* آکاردئون‌ها */}
                  <div className="space-y-3 mb-4">
                    <InjectionPicker />
                    <LaserPicker />
                    <ProductPicker />
                    <FacialPicker />
                  </div>

                  {/* تاریخ/ساعت */}
                  <div className="mb-3">
                    <label className="text-sm">
                      {appointment.serviceType === "محصولات" ? "تاریخ فروش:" : "تاریخ نوبت:"}
                    </label>
                    <DatePicker
                      value={appointment.appointmentDate}
                      onChange={(date) => setAppointment((s) => ({ ...s, appointmentDate: date }))}
                      inputPlaceholder="تاریخ"
                      locale="fa"
                      inputClassName="border p-2 rounded w-full"
                    />
                  </div>

                  {showHourMinute && (
                    <div className="mb-4 grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm">ساعت:</label>
                        <select
                          value={appointment.appointmentHour}
                          onChange={(e) => setAppointment((s) => ({ ...s, appointmentHour: e.target.value }))}
                          className="border p-2 rounded w-full"
                        >
                          {hours.map((h) => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm">دقیقه:</label>
                        <select
                          value={appointment.appointmentMinute}
                          onChange={(e) => setAppointment((s) => ({ ...s, appointmentMinute: e.target.value }))}
                          className="border p-2 rounded w-full"
                        >
                          {minutes.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      مبلغ کل: {Number(appointment.price || 0).toLocaleString("fa-IR")}
                    </div>
                    <button onClick={handleSubmit} className="bg-brand text-white px-4 py-2 rounded">
                      {appointment.serviceType === "محصولات" ? "ثبت فروش" : "ثبت نوبت"}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}