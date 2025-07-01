import React from 'react';

const laserAreas = {
  female: {
    individual: [
      'پشت لب', 'چانه', 'کل صورت', 'کل صورت و گردن', 'زیربغل', 'گردن',
      'خط ناف', 'سینه', 'کل شکم و سینه', 'بازو', 'ساعد', 'کل دست', 'بیکینی',
      'روی باسن', 'کشاله ران', 'ران', 'زانو', 'ساق', 'کل پا',
      // 👇 آیتم‌های اضافه‌شده
      'سری لیزر', 'عینک', 'پک اختصاصی'
    ],
    packages: {
      'پکیج ۱': ['ساعد', 'کل پا', 'بیکینی', 'زیربغل'],
      'پکیج ۲': ['بیکینی', 'زیربغل', 'صورت'],
      'پکیج ۳': ['ساعد', 'ساق پا', 'بیکینی', 'زیربغل'],
      'پکیج ۴': ['بیکینی', 'زیربغل', 'کل پا'],
      'پکیج ۵': ['بیکینی', 'زیربغل', 'ساق پا'],
      'پکیج ۶': ['کل بدن']
    }
  },
  male: {
    individual: [
      'گوش', 'پشت گردن', 'زیر گردن', 'گونه', 'گونه پیشانی و بین ابرو', 'کتف تا کمر',
      'کل شکم و سینه', 'کل دست', 'مایو', 'زیربغل', 'روی باسن', 'کشاله ران',
      'ران', 'زانو', 'ساق پا', 'کل پا',
      // 👇 آیتم‌های اضافه‌شده
      'سری لیزر', 'عینک', 'پک اختصاصی'
    ],
    packages: {
      'پکیج ۱': ['زیر بغل', 'مایو'],
      'پکیج ۲': ['کل شکم', 'سینه', 'کتف تا کمر', 'کل دست'],
      'پکیج ۳': ['مایو', 'روی باسن', 'کل پا'],
      'پکیج ۴': ['پشت گردن', 'زیر گردن', 'خط گردن'],
      'پکیج ۵': ['کل بدن']
    }
  }
};

export default function LaserAreaSelector({ gender, selectedAreas, onChange }) {
  const areas = laserAreas[gender];

  const handleToggle = (value) => {
    const newSelection = selectedAreas.includes(value)
      ? selectedAreas.filter((a) => a !== value)
      : [...selectedAreas, value];
    onChange(newSelection);
  };

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h4 className="font-bold text-gray-700 mb-2">نواحی تکی:</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {areas.individual.map((item, idx) => (
            <label key={idx} className="flex items-center gap-2">
              <input
                type="checkbox"
                value={item}
                checked={selectedAreas.includes(item)}
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
          {Object.entries(areas.packages).map(([packName, items], idx) => (
            <label key={idx} className="flex items-start gap-2">
              <input
                type="checkbox"
                value={packName}
                checked={selectedAreas.includes(packName)}
                onChange={() => handleToggle(packName)}
              />
              <div>
                <span className="font-semibold">{packName}</span>
                <span className="text-xs text-gray-500 ml-2">({items.join('، ')})</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}