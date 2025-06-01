const BASE_URL = "https://clinic-crm-backend.onrender.com"; // اگر بعداً دامنه‌ات عوض شد، فقط اینو تغییر بده

export default function getImageUrl(relativePath) {
  if (!relativePath) return "";
  if (relativePath.startsWith("http")) return relativePath; // اگر کامل بود تغییر نده
  return `${BASE_URL}${relativePath}`;
}