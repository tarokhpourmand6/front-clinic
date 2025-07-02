const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export default function getImageUrl(relativePath) {
  if (!relativePath) return "";
  if (relativePath.startsWith("http")) return relativePath;
  return `${BASE_URL}/${relativePath.replace(/^\//, "")}`;
}