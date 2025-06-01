import moment from "moment-jalaali";

export function toShamsi(dateStr) {
  const m = moment(dateStr, "jYYYY-jMM-jDD");
  return m.isValid() ? m.format("jYYYY/jMM/jDD") : "تاریخ نامعتبر";
}

export function formatDateObj(input) {
  // اگر آبجکت بود (مثلاً از DatePicker اومده)
  if (typeof input === "object" && input.year && input.month && input.day) {
    return `${input.year}-${String(input.month).padStart(2, "0")}-${String(input.day).padStart(2, "0")}`;
  }

  // اگر رشته بود (از بک‌اند اومده)، با مشخص‌کردن فرمت وارد moment بشه
  const m = moment(input, "YYYY-MM-DD"); // ✅ جلوگیری از هشدار
  return m.isValid() ? m.format("jYYYY-jMM-jDD") : "تاریخ نامعتبر";
}