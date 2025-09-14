// src/components/LaserAreaSelector.jsx
import React, { useMemo } from "react";
import laserAreas from "../constants/laserAreas"; // همون آبجکت مشترک

// نرمال‌سازی چند املای رایج برای سازگاری با دیتابیس/قیمت‌ها
const normalize = (label = "") => {
  const map = {
    "زیر بغل": "زیربغل",
    "ساق پا": "ساق",
    "صورت": "کل صورت",
    "کل بدن": "کل بدن", // برای آینده اگر معادل دیگری داشتی، اینجا اضافه کن
  };
  return map[label] || label;
};

export default function LaserAreaSelector({
  gender = "female",
  selectedAreas = [],
  onChange,
}) {
  const areas = laserAreas[gender] || { individual: [], packages: {} };

  // مجموعه‌ی انتخاب‌ها به‌صورت نرمال‌شده (برای تیک‌خوردن درست)
  const selectedSet = useMemo(
    () => new Set((selectedAreas || []).map(normalize)),
    [selectedAreas]
  );

  const handleToggle = (value) => {
    const norm = normalize(value);
    const next = new Set(selectedSet);
    if (next.has(norm)) next.delete(norm);
    else next.add(norm);
    onChange?.(Array.from(next)); // برگردوندن آرایه نرمال‌شده
  };

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h4 className="font-bold text-gray-700 mb-2">نواحی تکی:</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {areas.individual.map((item) => (
            <label key={item} className="flex items-center gap-2">
              <input
                type="checkbox"
                value={item}
                checked={selectedSet.has(normalize(item))}
                onChange={() => handleToggle(item)}
              />
              {item}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-bold text-gray-700 mb-2 mt-4">پکیج‌ها:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {Object.entries(areas.packages).map(([packName, items]) => (
            <label key={packName} className="flex items-start gap-2">
              <input
                type="checkbox"
                value={packName}
                checked={selectedSet.has(normalize(packName))}
                onChange={() => handleToggle(packName)}
              />
              <div>
                <span className="font-semibold">{packName}</span>
                <span className="text-xs text-gray-500 ml-2">
                  ({items.join("، ")})
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}