import { useEffect, useMemo, useState } from "react";
import moment from "moment-jalaali";
import DatePicker from "../DatePicker/DatePicker";
import LaserAreaSelector from "../LaserAreaSelector";
import LoadingSpinner from "../LoadingSpinner";
import { getPatientsPaged } from "../../api/patients";
import { getAllProducts } from "../../api/inventory";
import { getLaserPrices } from "../../api/laserPrice";
import { createAppointment } from "../../api/appointments";

moment.loadPersian({ dialect: "persian-modern" });

export default function AppointmentCreateModal({
  open,
  onClose,
  preselectedPatient,
  onSuccess,
  onOpenPatientCreate, // <-- برای باز کردن مودال ثبت بیمار
}) {
  const [patients, setPatients] = useState([]);
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

  // لود دیتای ثابت (کالاها و قیمت لیزر)
  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const prod = await getAllProducts();
        setInventory(prod || []);

        const laser = await getLaserPrices();
        const map = {};
        (laser || []).forEach(({ gender, area, price }) => {
          map[`${gender}-${area}`] = price;
        });
        setLaserPrices(map);

        setSelectedPatient(preselectedPatient || null);
        setPage(1);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, preselectedPatient]);

  // جستجوی سروری بیماران (debounce ساده)
  useEffect(() => {
    if (!open) return;

    const t = setTimeout(async () => {
      const res = await getPatientsPaged({ page: 1, limit: 20, q: search?.trim() || undefined });
      setPatients(res.data || []);
      setPage(1);
      setHasMore(res.currentPage < res.totalPages);
    }, 300);

    return () => clearTimeout(t);
  }, [open, search]);

  const loadMore = async () => {
    if (!hasMore) return;
    const next = page + 1;
    const res = await getPatientsPaged({ page: next, limit: 20, q: search?.trim() || undefined });
    setPatients((prev) => [...prev, ...(res.data || [])]);
    setPage(next);
    setHasMore(res.currentPage < res.totalPages);
  };

  // محاسبه مبلغ
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
                  {(patients || []).map((p) => (
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
                    onChange={(e) => setAppointment((s) => ({ ...s, serviceType: e.target.value, serviceOption: [] }))}
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