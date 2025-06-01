export const toPersianNumber = (str) => {
  const digits = "۰۱۲۳۴۵۶۷۸۹";
  return String(str).replace(/\d/g, (d) => digits[d]);
};

// تبدیل اعداد فارسی به انگلیسی (برای ورودی)
export const toEnglishNumber = (str) => {
  if (typeof str !== "string") str = String(str);
  return str.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
};

// حذف کاراکترهای غیر عددی و تبدیل به عدد قابل ذخیره
export const cleanPriceInput = (val) => {
  if (typeof val !== "string") val = String(val);
  const eng = toEnglishNumber(val).replace(/[^\d]/g, "");
  return Number(eng || "0");
};

// تبدیل قیمت به فرمت ۳ رقم ۳ رقم + فارسی
export const formatPrice = (num) => {
  if (!num) return "۰";
  const eng = Number(num).toLocaleString(); // 12,000
  return toPersianNumber(eng);
};

// هنگام تایپ داخل input قیمت فارسی+کاما تولید کن
export const formatPriceLive = (val) => {
  if (typeof val !== "string") val = String(val);
  const eng = toEnglishNumber(val).replace(/[^\d]/g, "");
  if (!eng) return "";
  const formatted = Number(eng).toLocaleString(); // 12000 → 12,000
  return toPersianNumber(formatted);
};

// تبدیل رشته تاریخ شمسی به آبجکت سال، ماه، روز
export const convertToObj = (dateStr) => {
  const [year, month, day] = dateStr.split('-');
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
  };
};
