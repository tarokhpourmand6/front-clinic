import { useEffect, useMemo, useState } from "react";
import moment from "moment-jalaali";
import DatePicker from "../DatePicker/DatePicker";
import LaserAreaSelector from "../LaserAreaSelector";
import LoadingSpinner from "../LoadingSpinner";
import { getPatientsFast } from "../../api/patients";
import { getAllProducts } from "../../api/inventory";     // تزریقات (salePrice)
import { getLaserPrices } from "../../api/laserPrice";
import { createAppointment } from "../../api/appointments";
import { getCareProducts } from "../../api/careProductsApi";     // محصولات (sellPrice / salePrice)
import { getFacialPackages } from "../../api/facialPackagesApi"; // فیشیال

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
    .replace(/\س+/g, " ")
    .toLowerCase();

const Section = ({ title, right, children, open, onToggle }) => (
  <div className="border rounded-xl mb-3 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100"
    >
      <span className="font-medium text-sm">{title}</span>
      <div className="flex items-center gap-2">
        {right}
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
      </div>
    </button>
    {open && <div className="p-3">{children}</div>}
  </div>
);

export default function AppointmentCreateModal({
  open,
  onClose,
  preselectedPatient,
  onSuccess,
  onCreated,
  onOpenPatientCreate,
}) {
  const [allPatients, setAllPatients] = useState([]);
  const [visiblePatients, setVisiblePatients] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(preselectedPatient || null);

  const [inventory, setInventory] = useState([]);        // تزریقات
  const [laserPrices, setLaserPrices] = useState({});
  const [careProducts, setCareProducts] = useState([]);  // محصولات مراقبتی
  const [facialPackages, setFacialPackages] = useState([]); // فیشیال

  const [loading, setLoading] = useState(false);

  const [draft, setDraft] = useState({
    serviceType: "تزریقات",
    serviceOption: [],
    appointmentDate: null,
    appointmentHour: "08",
    appointmentMinute: "00",
    status: "Scheduled",
    price: 0,
    gender: "female",
  });

  const [cart, setCart] = useState([]);

  const [openSec, setOpenSec] = useState({
    patient: true,
    picker: true,
    cart: true,
  });

  const hours = useMemo(
    () => Array.from({ length: 15 }, (_, i) => (8 + i).toString().padStart(2, "0")),
    []
  );
  const minutes = ["00", "10", "20", "30", "40", "50"];

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
        setCart([]);
        setDraft((s) => ({ ...s, serviceOption: [], appointmentDate: null, price: 0 }));
      } finally {
        setLoading(false);
      }
    })();
  }, [open, preselectedPatient]);

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

  // ---------- PRICE for Draft ----------
  useEffect(() => {
    let total = 0;

    if (draft.serviceType === "تزریقات") {
      (draft.serviceOption || []).forEach(({ name, amount }) => {
        const found = (inventory || []).find((i) => i.name === name);
        if (found?.salePrice) total += Number(found.salePrice) * (Number(amount) || 1);
      });
    } else if (draft.serviceType === "لیزر") {
      (draft.serviceOption || []).forEach((area) => {
        const price = laserPrices[`${draft.gender}-${area}`];
        if (price) total += price;
      });
    } else if (draft.serviceType === "محصولات") {
      (draft.serviceOption || []).forEach(({ id, qty, unitPrice }) => {
        let price = Number(unitPrice);
        if (!Number.isFinite(price)) {
          const p = (careProducts || []).find((x) => x._id === id);
          // ✅ اولویت با sellPrice، سپس salePrice برای سازگاری
          price = Number(p?.sellPrice ?? p?.salePrice) || 0;
        }
        total += price * (Number(qty) || 1);
      });
    } else if (draft.serviceType === "فیشیال") {
      (draft.serviceOption || []).forEach(({ id, qty }) => {
        const pkg = (facialPackages || []).find((x) => x._id === id);
        if (pkg?.price) total += Number(pkg.price) * (Number(qty) || 1);
      });
    }

    setDraft((s) => ({ ...s, price: total }));
  }, [
    draft.serviceOption,
    draft.gender,
    draft.serviceType,
    inventory,
    laserPrices,
    careProducts,
    facialPackages,
  ]);

  // ---------- Small Pickers (only product part changed) ----------
  const ProductPicker = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
      {(careProducts || []).map((p) => {
        const chosen = (draft.serviceOption || []).find((x) => x.id === p._id);
        const effectivePrice = Number(p?.sellPrice ?? p?.salePrice) || 0; // ✅ نمایش درست
        return (
          <div key={p._id} className="flex items-center gap-2 border p-2 rounded">
            <input
              type="checkbox"
              checked={!!chosen}
              onChange={(e) => {
                let next = [...(draft.serviceOption || [])];
                if (e.target.checked) {
                  // ✅ ذخیره‌ی قیمت واحد بر اساس sellPrice سپس salePrice
                  next.push({ id: p._id, qty: 1, unitPrice: effectivePrice });
                } else {
                  next = next.filter((x) => x.id !== p._id);
                }
                setDraft((s) => ({ ...s, serviceOption: next }));
              }}
            />
            <div className="flex-1">
              <div className="font-medium">{p.name}{p.brand ? ` — ${p.brand}` : ""}</div>
              <div className="text-xs text-gray-500">
                فروش: {effectivePrice.toLocaleString("fa-IR")}
              </div>
            </div>
            {!!chosen && (
              <input
                type="number"
                min="1"
                value={chosen.qty}
                onChange={(e) => {
                  const qty = Number(e.target.value) || 1;
                  const next = (draft.serviceOption || []).map((x) =>
                    x.id === p._id ? { ...x, qty } : x
                  );
                  setDraft((s) => ({ ...s, serviceOption: next }));
                }}
                className="w-16 border p-1 text-sm rounded text-center"
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const FacialPicker = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
      {(facialPackages || []).map((pkg) => {
        const chosen = (draft.serviceOption || []).find((x) => x.id === pkg._id);
        return (
          <div key={pkg._id} className="flex items-center gap-2 border p-2 rounded">
            <input
              type="checkbox"
              checked={!!chosen}
              onChange={(e) => {
                let next = [...(draft.serviceOption || [])];
                if (e.target.checked) next.push({ id: pkg._id, qty: 1 });
                else next = next.filter((x) => x.id !== pkg._id);
                setDraft((s) => ({ ...s, serviceOption: next }));
              }}
            />
            <div className="flex-1">
              <div className="font-medium">{pkg.name}</div>
              <div className="text-xs text-gray-500">
                قیمت: {(Number(pkg?.price) || 0).toLocaleString("fa-IR")}
              </div>
            </div>
            {!!chosen && (
              <input
                type="number"
                min="1"
                value={chosen.qty}
                onChange={(e) => {
                  const qty = Number(e.target.value) || 1;
                  const next = (draft.serviceOption || []).map((x) =>
                    x.id === pkg._id ? { ...x, qty } : x
                  );
                  setDraft((s) => ({ ...s, serviceOption: next }));
                }}
                className="w-16 border p-1 text-sm rounded text-center"
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const addDraftToCart = () => {
    if (!selectedPatient?._id) {
      alert("بیمار را انتخاب کنید.");
      return;
    }
    if (!(draft.serviceOption || []).length) {
      alert("برای این خدمت هیچ موردی انتخاب نشده است.");
      return;
    }
    if (!draft.appointmentDate) {
      alert(draft.serviceType === "محصولات" ? "تاریخ فروش را انتخاب کنید." : "تاریخ نوبت را انتخاب کنید.");
      return;
    }

    const jDate = moment(
      `${draft.appointmentDate.year}/${draft.appointmentDate.month}/${draft.appointmentDate.day}`,
      "jYYYY/jM/jD"
    ).format("jYYYY-jMM-jDD");

    const item = {
      _localId: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      serviceType: draft.serviceType,
      gender: draft.gender,
      dateShamsi: jDate,
      time: draft.serviceType === "محصولات" ? "" : `${draft.appointmentHour}:${draft.appointmentMinute}`,
      status: draft.status,
      price: draft.price,
      serviceOption: draft.serviceOption,
    };

    setCart((c) => [item, ...c]);
    setDraft((s) => ({ ...s, serviceOption: [], price: 0 }));
    setOpenSec((o) => ({ ...o, cart: true }));
  };

  const submitAll = async () => {
    if (!selectedPatient?._id) {
      alert("بیمار انتخاب نشده است.");
      return;
    }
    if (cart.length === 0) {
      alert("سبد خالی است.");
      return;
    }

    let lastSaleForPayment = null;

    try {
      for (const it of [...cart].reverse()) {
        const base = {
          patientId: selectedPatient._id,
          dateShamsi: it.dateShamsi,
          time: it.time,
          status: it.status,
          price: it.price,
        };

        let payload = { ...base };
        if (it.serviceType === "تزریقات") {
          payload = { ...payload, type: "Injection", consumables: it.serviceOption, laserAreas: [] };
        } else if (it.serviceType === "لیزر") {
          payload = {
            ...payload,
            type: "Laser",
            laserAreas: (it.serviceOption || []).map((a) => ({ area: a, gender: it.gender })),
            consumables: [],
          };
        } else if (it.serviceType === "محصولات") {
          payload = {
            ...payload,
            type: "CareProductSale",
            products: (it.serviceOption || []).map(({ id, qty, unitPrice }) => ({
              productId: id,
              qty: Number(qty) || 1,
              unitPrice: Number(unitPrice) || 0,
            })),
          };
        } else if (it.serviceType === "فیشیال") {
          payload = {
            ...payload,
            type: "Facial",
            facials: (it.serviceOption || []).map(({ id, qty }) => {
              const pkg = (facialPackages || []).find((x) => x._id === id);
              return {
                packageId: id,
                qty: Number(qty) || 1,
                unitPrice: Number(pkg?.price) || 0,
              };
            }),
          };
        }

        const res = await createAppointment(payload);
        const appt = res?.data ?? res;

        if (appt?.type === "CareProductSale") {
          lastSaleForPayment = {
            id: appt._id,
            price: Number(appt.price) || 0,
            paymentDetails: Array.isArray(appt.paymentDetails) ? appt.paymentDetails : [],
          };
        }
      }

      onSuccess?.();
      if (lastSaleForPayment) onCreated?.(lastSaleForPayment);

      setCart([]);
      setDraft((s) => ({ ...s, serviceOption: [], price: 0 }));
      onClose?.();
    } catch (e) {
      console.error("submitAll error:", e);
      alert("⛔️ خطا در ثبت سبد");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4">
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-4 md:p-6 font-vazir
                   max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-3 sticky top-0 bg-white">
          <h3 className="text-lg font-bold">ثبت خدمات برای بیمار</h3>
          <button onClick={onClose} className="px-2 py-1 rounded-lg border">بستن</button>
        </div>

        {loading ? (
          <div className="py-12"><LoadingSpinner /></div>
        ) : (
          <>
            {/* بیمار */}
            <Section
              title="انتخاب بیمار"
              open={openSec.patient}
              onToggle={() => setOpenSec((o) => ({ ...o, patient: !o.patient }))}
              right={selectedPatient ? <span className="text-xs text-gray-600">{selectedPatient.fullName}</span> : null}
            >
              {!selectedPatient ? (
                <>
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
                </>
              ) : (
                <div className="bg-gray-50 border rounded p-2 text-sm flex items-center justify-between">
                  <span>{selectedPatient.fullName} — {selectedPatient.phone}</span>
                  <button className="text-xs underline" onClick={() => setSelectedPatient(null)}>تغییر بیمار</button>
                </div>
              )}
            </Section>

            {/* انتخاب خدمت (Draft) */}
            <Section
              title="افزودن خدمت جدید به سبد"
              open={openSec.picker}
              onToggle={() => setOpenSec((o) => ({ ...o, picker: !o.picker }))}
              right={<span className="text-xs text-gray-600">مبلغ: {draft.price?.toLocaleString("fa-IR")}</span>}
            >
              <div className="mb-3">
                <label className="text-sm">نوع خدمت:</label>
                <select
                  value={draft.serviceType}
                  onChange={(e) =>
                    setDraft((s) => ({ ...s, serviceType: e.target.value }))
                  }
                  className="border p-2 rounded w-full text-sm mt-1"
                >
                  <option value="تزریقات">تزریقات</option>
                  <option value="لیزر">لیزر</option>
                  <option value="محصولات">محصولات</option>
                  <option value="فیشیال">فیشیال</option>
                </select>
              </div>

              {draft.serviceType === "تزریقات" && (
                <div className="mb-4">
                  <label className="text-sm block mb-1">انتخاب تزریقات:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {(inventory || []).map((item) => {
                      const selected = (draft.serviceOption || []).find(
                        (x) => typeof x === "object" && x.name === item.name && "amount" in x
                      );
                      return (
                        <div key={item._id || item.name} className="flex items-center gap-2 border p-2 rounded">
                          <input
                            type="checkbox"
                            checked={!!selected}
                            onChange={(e) => {
                              let updated = [...(draft.serviceOption || [])];
                              if (e.target.checked) {
                                updated.push({ name: item.name, amount: 1 });
                              } else {
                                updated = updated.filter((x) => x.name !== item.name);
                              }
                              setDraft((s) => ({ ...s, serviceOption: updated }));
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500">
                              قیمت: {(Number(item?.salePrice) || 0).toLocaleString("fa-IR")}
                            </div>
                          </div>
                          {!!selected && (
                            <input
                              type="number"
                              min="1"
                              value={selected.amount || 1}
                              onChange={(e) => {
                                const updated = (draft.serviceOption || []).map((opt) =>
                                  opt.name === item.name ? { ...opt, amount: Number(e.target.value) || 1 } : opt
                                );
                                setDraft((s) => ({ ...s, serviceOption: updated }));
                              }}
                              className="w-16 border p-1 text-sm rounded text-center"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {draft.serviceType === "لیزر" && (
                <>
                  <div className="mb-4">
                    <label className="text-sm">جنسیت:</label>
                    <select
                      value={draft.gender}
                      onChange={(e) => setDraft((s) => ({ ...s, gender: e.target.value }))}
                      className="border p-2 rounded w-full text-sm mt-1"
                    >
                      <option value="female">خانم</option>
                      <option value="male">آقا</option>
                    </select>
                  </div>
                  <LaserAreaSelector
                    gender={draft.gender}
                    selectedAreas={(draft.serviceOption || []).filter((x) => typeof x === "string")}
                    onChange={(areas) => {
                      const nonLaser = (draft.serviceOption || []).filter((x) => typeof x !== "string");
                      setDraft((s) => ({ ...s, serviceOption: [...nonLaser, ...areas] }));
                    }}
                  />
                </>
              )}

              {draft.serviceType === "محصولات" && <ProductPicker />}
              {draft.serviceType === "فیشیال" && <FacialPicker />}

              <div className="mt-3">
                <label className="text-sm">
                  {draft.serviceType === "محصولات" ? "تاریخ فروش:" : "تاریخ نوبت:"}
                </label>
                <DatePicker
                  value={draft.appointmentDate}
                  onChange={(date) => setDraft((s) => ({ ...s, appointmentDate: date }))}
                  inputPlaceholder="تاریخ"
                  locale="fa"
                  inputClassName="border p-2 rounded w-full"
                />
              </div>

              {draft.serviceType !== "محصولات" && (
                <div className="mt-3 flex gap-2">
                  <div className="w-1/2">
                    <label className="text-sm">دقیقه:</label>
                    <select
                      value={draft.appointmentMinute}
                      onChange={(e) => setDraft((s) => ({ ...s, appointmentMinute: e.target.value }))}
                      className="border p-2 rounded w-full"
                    >
                      {minutes.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="w-1/2">
                    <label className="text-sm">ساعت:</label>
                    <select
                      value={draft.appointmentHour}
                      onChange={(e) => setDraft((s) => ({ ...s, appointmentHour: e.target.value }))}
                      className="border p-2 rounded w-full"
                    >
                      {hours.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  مبلغ این خدمت: {draft.price?.toLocaleString("fa-IR")}
                </div>
                <button onClick={addDraftToCart} className="bg-emerald-600 text-white px-4 py-2 rounded">
                  + افزودن به سبد
                </button>
              </div>
            </Section>

            <Section
              title={`سبد (${cart.length})`}
              open={openSec.cart}
              onToggle={() => setOpenSec((o) => ({ ...o, cart: !o.cart }))}
              right={
                cart.length > 0 ? (
                  <span className="text-xs text-gray-700">
                    جمع: {cart.reduce((s,x)=>s+(Number(x.price)||0),0).toLocaleString("fa-IR")}
                  </span>
                ) : null
              }
            >
              {cart.length === 0 ? (
                <div className="text-xs text-gray-500">هنوز آیتمی اضافه نشده است.</div>
              ) : (
                <div className="space-y-2">
                  {cart.map((it) => (
                    <details key={it._localId} className="border rounded p-2" open={false}>
                      <summary className="cursor-pointer text-sm flex items-center justify-between">
                        <span>
                          {it.serviceType} — {it.dateShamsi}
                          {it.time ? ` — ${it.time}` : ""}
                        </span>
                        <span className="text-gray-700">
                          {Number(it.price).toLocaleString("fa-IR")} تومان
                        </span>
                      </summary>
                      <div className="mt-2 text-xs text-gray-600 space-y-1">
                        {it.serviceType === "تزریقات" && (
                          <div>
                            {it.serviceOption.map((o, idx) => (
                              <div key={idx}>{o.name} × {o.amount}</div>
                            ))}
                          </div>
                        )}
                        {it.serviceType === "لیزر" && (
                          <div>{it.serviceOption.filter((x)=>typeof x==="string").join("، ")}</div>
                        )}
                        {it.serviceType === "محصولات" && (
                          <div>
                            {it.serviceOption.map((o, idx) => {
                              const p = careProducts.find((x)=>x._id===o.id);
                              return (
                                <div key={idx}>
                                  {p?.name || o.id} — {Number(o.unitPrice).toLocaleString("fa-IR")} × {o.qty}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {it.serviceType === "فیشیال" && (
                          <div>
                            {it.serviceOption.map((o, idx) => {
                              const pkg = facialPackages.find((x)=>x._id===o.id);
                              return (
                                <div key={idx}>
                                  {pkg?.name || o.id} × {o.qty}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <button
                          onClick={() => setCart((c) => c.filter(x => x._localId !== it._localId))}
                          className="text-red-600 text-xs underline"
                        >
                          حذف از سبد
                        </button>
                      </div>
                    </details>
                  ))}
                </div>
              )}

              <div className="mt-3 flex justify-end">
                <button
                  onClick={submitAll}
                  disabled={cart.length === 0 || !selectedPatient?._id}
                  className="bg-brand text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  ثبت همه
                </button>
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}