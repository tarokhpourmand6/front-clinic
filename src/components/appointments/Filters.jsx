// components/appointments/Filters.jsx
import DatePicker from "../../components/DatePicker/DatePicker";

export default function Filters({ filters, setFilters }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 text-sm">
      <input
        type="text"
        placeholder="جستجو نام"
        value={filters.name}
        onChange={(e) => setFilters({ ...filters, name: e.target.value })}
        className="border p-2 rounded"
      />
      <input
        type="text"
        placeholder="جستجو شماره تماس"
        value={filters.phone}
        onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
        className="border p-2 rounded"
      />
      <DatePicker
        value={filters.date}
        onChange={(date) => setFilters({ ...filters, date })}
        inputPlaceholder="تاریخ"
        locale="fa"
        inputClassName="border p-2 rounded w-full"
      />
      <button
        onClick={() => setFilters({ name: '', phone: '', date: null })}
        className="bg-gray-100 rounded px-3 py-2"
      >
        پاک‌کردن فیلتر
      </button>
    </div>
  );
}
