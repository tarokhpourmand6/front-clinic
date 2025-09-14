import { useEffect, useState } from "react";
import { getLaserPrices, saveLaserPrices } from "../../api/laserPrice";
import { cleanPriceInput, formatPrice } from "../../utils/number";

const laserAreas = {
  female: {
    individual: [
      "پشت لب", "چانه", "کل صورت", "کل صورت و گردن", "زیربغل", "گردن",
      "خط ناف", "سینه", "کل شکم و سینه", "بازو", "ساعد", "کل دست", "بیکینی",
      "روی باسن", "کشاله ران", "ران", "زانو", "ساق", "کل پا",
      // 👇 آیتم‌های اضافه شده
      "سری لیزر", "عینک", "پک اختصاصی"
    ],
    packages: {
      "پکیج ۱": ["ساعد", "کل پا", "بیکینی", "زیربغل"],
      "پکیج ۲": ["بیکینی", "زیربغل", "صورت"],
      "پکیج ۳": ["ساعد", "ساق پا", "بیکینی", "زیربغل"],
      "پکیج ۴": ["بیکینی", "زیربغل", "کل پا"],
      "پکیج ۵": ["بیکینی", "زیربغل", "ساق پا"],
      "فول بادی VIP": ["کل بدن"],
"فول بادی": ["کل بدن"],
"پک کاربردی": ["کل بدن"]
    }
  },
  male: {
    individual: [
      "گوش", "پشت گردن", "زیر گردن", "گونه", "گونه پیشانی و بین ابرو", "کتف تا کمر",
      "کل شکم و سینه", "کل دست", "مایو", "زیربغل", "روی باسن", "کشاله ران",
      "ران", "زانو", "ساق پا", "کل پا",
      // 👇 آیتم‌های اضافه شده
      "سری لیزر", "عینک", "پک اختصاصی"
    ],
    packages: {
      "پکیج ۱": ["زیر بغل", "مایو"],
      "پکیج ۲": ["بالاتنه"],
      "پکیج ۳": ["پایین تنه"],
      "پکیج ۴": ["پشت گردن", "زیر گردن", "خط گردن"],
      "فول VIP": ["کل بدن"],
 "فول بادی": ["کل بدن"]
    }
  }
};

export default function LaserPriceManager() {
  const [laserPrices, setLaserPrices] = useState({});

  const fetchLaserPrices = async () => {
    try {
      const data = await getLaserPrices();
      const formatted = {};
      data.forEach((item) => {
        const key = `${item.gender}-${item.area}`;
        formatted[key] = formatPrice(item.price);
      });
      setLaserPrices(formatted);
    } catch (err) {
      console.error("⛔️ خطا در دریافت قیمت لیزر:", err);
    }
  };

  useEffect(() => {
    fetchLaserPrices();
  }, []);

  const handleLaserPriceChange = (key, value) => {
    const cleaned = cleanPriceInput(value);
    const formatted = formatPrice(cleaned);
    setLaserPrices((prev) => ({ ...prev, [key]: formatted }));
  };

  const handleSaveLaserPrices = async () => {
    try {
      const keys = Object.keys(laserPrices);
      for (const key of keys) {
        const [gender, ...rest] = key.split("-");
        const areaKey = rest.join("-");
        const cleaned = cleanPriceInput(laserPrices[key]);
        await saveLaserPrices({ gender, area: areaKey, price: cleaned });
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
          <h3 className="text-md font-semibold mb-2">{gender === 'female' ? 'خانم' : 'آقا'}</h3>
          {[...laserAreas[gender].individual, ...Object.keys(laserAreas[gender].packages)].map((area, i) => (
            <div key={i} className="grid grid-cols-3 gap-3 mb-2 items-center">
              <label className="text-sm">{area}</label>
              <input
                type="text"
                placeholder="قیمت (تومان)"
                value={laserPrices[`${gender}-${area}`] || ""}
                onChange={(e) => handleLaserPriceChange(`${gender}-${area}`, e.target.value)}
                className="border p-2 rounded text-sm"
              />
              <span className="text-gray-500 text-xs">({gender === 'female' ? 'خانم' : 'آقا'})</span>
            </div>
          ))}
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