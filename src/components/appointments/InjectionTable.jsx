// components/appointments/InjectionTable.jsx
import DatePicker from "../../components/DatePicker/DatePicker";
import { toPersianNumber, convertToObj } from "../../utils/number";
import { Plus } from "lucide-react";

const InjectionTable = ({ data, onDateChange, onTimeChange, onStatusChange, onPriceChange, onDelete, onOpenConsumables }) => {
  return (
    <div className="mt-6">
      <h2 className="font-bold text-md mb-2"> نوبت‌های تزریقات</h2>
      <table className="w-full text-sm text-right">
        <thead className="bg-brand text-white">
          <tr>
            <th className="px-2 py-1">نام</th>
            <th className="px-2 py-1">تلفن</th>
            <th className="px-2 py-1">تاریخ</th>
            <th className="px-2 py-1">ساعت</th>
            <th className="px-2 py-1">خدمت</th>
            <th className="px-2 py-1">وضعیت</th>
            <th className="px-2 py-1">مبلغ + موارد</th>
            <th className="px-2 py-1">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {(data || []).map((a, i) => (
            <tr key={i} className="even:bg-gray-50">
              <td className="border px-2 py-1">{a.patientId?.fullName}</td>
              <td className="border px-2 py-1">{toPersianNumber(a.patientId?.phone || '')}</td>
              <td className="border px-2 py-1">
                <DatePicker
                  value={convertToObj(a.dateShamsi)}
                  onChange={(dateObj) => onDateChange(a._id, dateObj)}
                  locale="fa"
                  inputClassName="border p-1 rounded w-full"
                />
              </td>
              <td className="border px-2 py-1">
                <select value={a.time} onChange={(e) => onTimeChange(a._id, e.target.value)} className="border rounded px-2 py-1">
                  {["09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:30","20:00","20:30","21:00","21:30","22:00"].map((t) => (
                    <option key={t} value={t}>{toPersianNumber(t)}</option>
                  ))}
                </select>
              </td>
              <td className="border px-2 py-1">{a.type}</td>
              <td className="border px-2 py-1">
                <select
                  value={a.status === 'Completed' ? 'done' : a.status === 'Scheduled' ? 'pending' : 'canceled'}
                  onChange={(e) => onStatusChange(a._id, e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="pending">در انتظار</option>
                  <option value="done">انجام شده</option>
                  <option value="canceled">لغو شده</option>
                </select>
              </td>
              <td className="border px-2 py-1">
                <input
                  value={toPersianNumber((a.price || '').toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬'))}
                  onChange={(e) => onPriceChange(a._id, e.target.value)}
                  className="border rounded px-2 py-1 text-right"
                  inputMode="numeric"
                />
                {a.consumables?.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {a.consumables.map((c) => `${c.name} (${c.amount})`).join(" + ")}
                  </div>
                )}
              </td>
              <td className="border px-2 py-1 flex gap-2 items-center">
                <button className="text-red-500" onClick={() => onDelete(a._id)}>حذف</button>
                <button
                  title="ثبت آیتم مصرفی"
                  onClick={() => onOpenConsumables(a._id)}
                  className="text-emerald-600 hover:text-emerald-800"
                >
                  <Plus size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InjectionTable;