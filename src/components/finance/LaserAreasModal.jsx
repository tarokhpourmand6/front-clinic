// src/components/LaserAreasModal.jsx
import { useEffect, useMemo, useState } from "react";
import { getLaserPrices } from "../../api/laserPrice";
import useAppointmentsStore from "../../store/useAppointmentsStore";
import { toast } from "react-toastify";
import laserAreas from "../../constants/laserAreas"; // منبع مشترک لیست

const LaserAreasModal = ({ isOpen, onClose, appointmentId, onOpenPaymentModal }) => {
  const [laserPrices, setLaserPrices] = useState([]); // خام از API: [{gender, area, price}]
  const [gender, setGender] = useState("female");
  const [selected, setSelected] = useState([]);       // [{ area, price, gender }]
  const [total, setTotal] = useState(0);
  const { updateAppointmentItem, fetchAppointments } = useAppointmentsStore();

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setSelected([]);
      setTotal(0);
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const data = await getLaserPrices();
      setLaserPrices(data);
    } catch (err) {
      toast.error("⛔️ خطا در دریافت نواحی لیزر");
    }
  };

  // priceMap: gender -> area(label) -> number
  const priceMap = useMemo(() => {
    const m = { female: {}, male: {} };
    laserPrices.forEach((it) => {
      const g = it.gender === "male" ? "male" : "female";
      m[g][it.area] = Number(it.price || 0);
    });
    return m;
  }, [laserPrices]);

  // لیست نهایی نمایش: از constants + تزریق قیمت (اگر نبود => 0)
  const displayList = useMemo(() => {
    const base = [
      ...laserAreas[gender].individual,
      ...Object.keys(laserAreas[gender].packages),
    ];
    return base.map((label) => ({
      area: label,
      price: priceMap[gender]?.[label] ?? 0,
      gender,
    }));
  }, [gender, priceMap]);

  const toggleArea = (area, price) => {
    const exists = selected.find((s) => s.area === area && s.gender === gender);
    const updated = exists
      ? selected.filter((s) => !(s.area === area && s.gender === gender))
      : [...selected, { area, price, gender }];
    setSelected(updated);
    setTotal(updated.reduce((acc, cur) => acc + (cur.price || 0), 0));
  };

  const handleSave = async () => {
    try {
      await updateAppointmentItem(appointmentId, {
        laserAreas: selected, // [{area, price, gender}] بدون تغییر
        price: total,
      });
      await fetchAppointments();
      toast.success("✔️ نواحی لیزر ثبت شد");
      onClose();
      if (typeof onOpenPaymentModal === "function") {
        onOpenPaymentModal(appointmentId, [], total);
      }
    } catch (err) {
      toast.error("⛔️ خطا در ذخیره نواحی");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999990]">
      <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-4xl">
        <h2 className="text-lg font-bold mb-4">انتخاب نواحی لیزر</h2>

        <div className="mb-4">
          <label className="text-sm font-medium">جنسیت:</label>
          <select
            value={gender}
            onChange={(e) => {
              setGender(e.target.value);
              setSelected([]);
              setTotal(0);
            }}
            className="border p-2 rounded w-full mt-1"
          >
            <option value="female">خانم</option>
            <option value="male">آقا</option>
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto text-sm mb-4">
          {displayList.map((item) => (
            <label key={item.area} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.some((s) => s.area === item.area && s.gender === gender)}
                onChange={() => toggleArea(item.area, item.price)}
              />
              <span>{item.area}</span>
              <span className="text-gray-400 text-xs">
                ({(item.price || 0).toLocaleString("fa-IR")} تومان)
              </span>
            </label>
          ))}
        </div>

        {total > 0 && (
          <div className="text-sm text-gray-700 mb-3">
            💰 مبلغ پیشنهادی: <strong>{total.toLocaleString("fa-IR")} تومان</strong>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          >
            انصراف
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm"
          >
            ذخیره
          </button>
        </div>
      </div>
    </div>
  );
};

export default LaserAreasModal;