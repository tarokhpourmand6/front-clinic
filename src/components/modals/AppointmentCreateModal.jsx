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

moment.loadPersian({ dialect: "persian-modern" });

const PAGE_SIZE = 20;

/* ---------- helpers (normalize) ---------- */
const fa2en = (s = "") => String(s).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
const normPhone = (s = "") => fa2en(s).replace(/\D/g, "");
const normFa = (s = "") =>
  String(s)
    .trim()
    .replace(/\u200c/g, " ") // ZWNJ → space
    .replace(/‌/g, " ")       // نیم‌فاصله فارسی
    .replace(/\u0640/g, "")   // tatweel
    .replace(/ك/g, "ک")
    .replace(/ي/g, "ی")
    .replace(/\s+/g, " ")
    .toLowerCase();

export default function AppointmentCreateModal({
  open,
  onClose,
  preselectedPatient,
  onSuccess,
  onOpenPatientCreate,
}) {
  const [allPatients, setAllPatients] = useState([]);
  const [visiblePatients, setVisiblePatients] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(preselectedPatient || null);

  const [inventory, setInventory] = useState([]);
  const [laserPrices, setLaserPrices] = useState({});
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

  const hours = useMemo(
    () => Array.from({ length: 15 }, (_, i) => (8 + i).toString().padStart(2, "0")),
    []
  );
  const minutes = ["00", "10", "20", "30", "40", "50"];

  /* ---------- initial load ---------- */
  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const [prod, laser, pts] = await Promise.all([
          getAllProducts(),
          getLaserPrices(),
          getPatientsFast(), // یک درخواست با limit=5000
        ]);

        setInventory(prod || []);

        const priceMap = {};
        (laser || []).forEach(({ gender, area, price }) => {
          priceMap[`${gender}-${area}`] = price;
        });
        setLaserPrices(priceMap);

        // نرمال کردن لیست برای جست‌وجوی سریع
        const rawList = Array.isArray(pts) ? pts : [];
        const list = rawList.map((p) => ({
          ...p,
          _name: normFa(p?.fullName || ""),
          _phone: normPhone(p?.phone || ""),
        }));
        setAllPatients(list);

        // خروجی اولیه
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

  /* ---------- client-side search (debounced) ---------- */
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

  /* ---------- price calc ---------- */
  useEffect(() => {
    let total = 0;
    if (appointment.serviceType === "تزریقات") {
      (appointment.serviceOption || []).forEach(({ name, amount }) => {
        const found = (inventory || []).find((i) => i.name === name);
        if (found?.sellPrice) total += Number(found.sellPrice) * (Number(amount) || 1);
      });
    } else {
      (appointment.serviceOption || []).forEach((area) => {
        const price = laserPrices[`${appointment.gender}-${area}`];
        if (price) total += price;
      });
    }
    setAppointment((s) => ({ ...s, price: total }));
  }, [appointment.serviceOption, appointment.gender, appointment.serviceType, inventory, laserPrices]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!selectedPatient?._id || !appointment.appointmentDate) {
      alert("اطلاعات ناقص است.");
      return;
    }
    const dateStr = moment(
      `${appointment.appointmentDate.year}/${appointment.appointmentDate.month}/${appointment.appointmentDate.day}`,
      "jYYYY/jM/jD"
    ).format("jYYYY-jMM-jDD");

    const payload = {
      patientId: selectedPatient._id,
      dateShamsi: dateStr,
      time: `${appointment.appointmentHour}:${appointment.appointmentMinute}`,
      type: appointment.serviceType === "تزریقات" ? "Injection" : "Laser",
      status: appointment.status,
      price: appointment.price,
      consumables: appointment.serviceType === "تزریقات" ? appointment.serviceOption : [],
      laserAreas:
        appointment.serviceType === "لیزر"
          ? appointment.serviceOption.map((a) => ({ area: a, gender: appointment.gender }))
          : [],
    };

    try {
      await createAppointment(payload);
      onSuccess?.();
      onClose?.();
    } catch {
      alert("⛔️ خطا در ثبت نوبت");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-4 md:p-6 font-vazir">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">ثبت نوبت</h3>
          <button onClick={onClose} className="px-2 py-1 rounded-lg border">بستن</button>
        </div>

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

                <div className="mb-3">
                  <label className="text-sm">نوع خدمت:</label>
                  <select
                    value={appointment.serviceType}
                    onChange={(e) =>
                      setAppointment((s) => ({ ...s, serviceType: e.target.value, serviceOption: [] }))
                    }
                    className="border p-2 rounded w-full text-sm mt-1"
                  >
                    <option value="تزریقات">تزریقات</option>
                    <option value="لیزر">لیزر</option>
                  </select>
                </div>

                {appointment.serviceType === "تزریقات" ? (
                  <div className="mb-4">
                    <label className="text-sm block mb-1">انتخاب تزریقات:</label>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {(inventory || []).map((item) => {
                        const selected = (appointment.serviceOption || []).find(
                          (x) => typeof x === "object" && x.name === item.name
                        );
                        return (
                          <div key={item._id || item.name} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!selected}
                              onChange={(e) => {
                                let updated = [...(appointment.serviceOption || [])];
                                if (e.target.checked) updated.push({ name: item.name, amount: 1 });
                                else updated = updated.filter((x) => x.name !== item.name);
                                setAppointment((s) => ({ ...s, serviceOption: updated }));
                              }}
                            />
                            {item.name}
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
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <label className="text-sm">جنسیت:</label>
                      <select
                        value={appointment.gender}
                        onChange={(e) =>
                          setAppointment((s) => ({ ...s, gender: e.target.value, serviceOption: [] }))
                        }
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
                  </>
                )}

                <div className="mb-3">
                  <label className="text-sm">تاریخ نوبت:</label>
                  <DatePicker
                    value={appointment.appointmentDate}
                    onChange={(date) => setAppointment((s) => ({ ...s, appointmentDate: date }))}
                    inputPlaceholder="تاریخ"
                    locale="fa"
                    inputClassName="border p-2 rounded w-full"
                  />
                </div>

                <div className="mb-4 flex gap-2">
                  <div className="w-1/2">
                    <label className="text-sm">دقیقه:</label>
                    <select
                      value={appointment.appointmentMinute}
                      onChange={(e) => setAppointment((s) => ({ ...s, appointmentMinute: e.target.value }))}
                      className="border p-2 rounded w-full"
                    >
                      {minutes.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="w-1/2">
                    <label className="text-sm">ساعت:</label>
                    <select
                      value={appointment.appointmentHour}
                      onChange={(e) => setAppointment((s) => ({ ...s, appointmentHour: e.target.value }))}
                      className="border p-2 rounded w-full"
                    >
                      {hours.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">مبلغ کل: {appointment.price?.toLocaleString("fa-IR")}</div>
                  <button onClick={handleSubmit} className="bg-brand text-white px-4 py-2 rounded">
                    ثبت نوبت
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