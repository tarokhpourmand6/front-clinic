import { useEffect, useMemo, useState } from "react";
import { getLaserPrices, saveLaserPrices } from "../../api/laserPrice";
import { cleanPriceInput, formatPrice } from "../../utils/number";
import laserAreas from "../../constants/laserAreas";

// نرمال‌سازی چند املای رایج برای همخوانی داده‌های قدیمی
const normalizeArea = (label) => {
  const map = {
    "زیر بغل": "زیربغل",
    "ساق پا": "ساق",
    "صورت": "کل صورت",
  };
  return map[label] || label;
};

export default function LaserPriceManager() {
  // همان ساختار قبلی state
  const [laserPrices, setLaserPrices] = useState({});

  // کلیدهای استاندارد نمایش بر اساس منبع مشترک
  const displayKeys = useMemo(() => {
    const keys = [];
    ["female", "male"].forEach((gender) => {
      const base = [
        ...laserAreas[gender].individual,
        ...Object.keys(laserAreas[gender].packages),
      ];
      base.forEach((area) => keys.push(`${gender}-${area}`));
    });
    return keys;
  }, []);

  const fetchLaserPrices = async () => {
    try {
      const data = await getLaserPrices(); // [{gender, area, price}]
      const formatted = {};
      data.forEach((item) => {
        const g = item.gender === "male" ? "male" : "female";
        const a = normalizeArea(item.area);
        const key = `${g}-${a}`;
        formatted[key] = formatPrice(item.price);
      });
      // روی کلیدهای نمایش سوار می‌کنیم تا آیتم‌های جدید هم با مقدار خالی/۰ دیده شوند
      setLaserPrices((prev) => {
        const next = { ...prev };
        displayKeys.forEach((k) => {
          next[k] = formatted[k] ?? next[k] ?? "";
        });
        return next;
      });
    } catch (err) {
      console.error("⛔️ خطا در دریافت قیمت لیزر:", err);
    }
  };

  useEffect(() => {
    fetchLaserPrices();
  }, []);

  const handleLaserPriceChange = (key, value) => {
    const cleaned = cleanPriceInput(value);
    setLaserPrices((prev) => ({ ...prev, [key]: formatPrice(cleaned) }));
  };

  const handleSaveLaserPrices = async () => {
    try {
      // فقط همان آیتم‌هایی که در UI داریم ذخیره شوند (یک‌دست)
      for (const key of displayKeys) {
        const [gender, ...rest] = key.split("-");
        const areaLabel = rest.join("-");
        const cleaned = cleanPriceInput(laserPrices[key]);
        await saveLaserPrices({ gender, area: areaLabel, price: cleaned || 0 });
      }
      await fetchLaserPrices();
    } catch (err) {
      console.error("⛔️ خطا در ذخیره قیمت لیزر:", err);
    }
  };

  return (
    <div className="p-6">
      <h2 className="font-bold mb-4">💡 قیمت نواحی لیزر</h2>

      {["female", "male"].map((gender) => (
        <div key={gender} className="mb-6">
          <h3 className="text-md font-semibold mb-2">
            {gender === "female" ? "خانم" : "آقا"}
          </h3>

          {[...laserAreas[gender].individual, ...Object.keys(laserAreas[gender].packages)].map((area) => {
            const key = `${gender}-${area}`;
            return (
              <div key={key} className="grid grid-cols-3 gap-3 mb-2 items-center">
                <label className="text-sm">{area}</label>
                <input
                  type="text"
                  placeholder="قیمت (تومان)"
                  value={laserPrices[key] || ""}
                  onChange={(e) => handleLaserPriceChange(key, e.target.value)}
                  className="border p-2 rounded text-sm"
                />
                <span className="text-gray-500 text-xs">
                  ({gender === "female" ? "خانم" : "آقا"})
                </span>
              </div>
            );
          })}
        </div>
      ))}

      <button
        onClick={handleSaveLaserPrices}
        className="bg-emerald-600 text-white px-4 py-2 rounded mt-4 hover:bg-emerald-700"
      >
        ذخیره قیمت‌ها
      </button>
    </div>
  );
}