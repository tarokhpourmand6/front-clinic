// components/appointments/SummaryBox.jsx
import { toPersianNumber } from "../../utils/number";

export default function SummaryBox({ summary }) {
  return (
    <div className="bg-blue-50 p-4 rounded mb-4 text-sm">
      <p>تعداد کل نوبت‌ها: {toPersianNumber(summary.total)}</p>
      <p>
        در انتظار: {toPersianNumber(summary.pending)} | انجام‌شده: {toPersianNumber(summary.done)} | لغو شده: {toPersianNumber(summary.canceled)}
      </p>
    </div>
  );
}