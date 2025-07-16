import { useEffect, useState } from "react";
import { toPersianNumber } from "../../utils/number";
import useAppointmentsStore from "../../store/useAppointmentsStore";

const PaymentModal = ({
  isOpen,
  onClose,
  appointmentId,
  paymentDetails = [],
  onSave,
  paymentMethods = [],
  initialPrice = 0,
}) => {
  const [localDetails, setLocalDetails] = useState([]);
  const { updateAppointmentItem } = useAppointmentsStore();

  useEffect(() => {
  if (isOpen) {
    if (paymentDetails?.length > 0) {
      setLocalDetails(paymentDetails); // اگر قبلاً پرداختی انجام شده باشه
    } else {
      // هیچ گزینه‌ای تیک‌خورده نباشه در ابتدا
      setLocalDetails([]);
    }
  }
}, [isOpen, paymentDetails]);

  const handleToggleMethod = (method) => {
  const exists = localDetails.find((p) => p.method === method);
  if (exists) {
    setLocalDetails((prev) => prev.filter((p) => p.method !== method));
  } else {
    const defaultAmount =
      localDetails.length === 0 && typeof initialPrice === "number"
        ? initialPrice
        : 0;

    setLocalDetails((prev) => [...prev, { method, amount: defaultAmount }]);
  }
};
  const handleAmountChange = (method, val) => {
    const f2e = (str) => str.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
    const cleaned = f2e(val).replace(/[^0-9]/g, "");
    setLocalDetails((prev) =>
      prev.map((p) => (p.method === method ? { ...p, amount: Number(cleaned) } : p))
    );
  };

  const handleSave = async () => {
    const total = localDetails.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    await updateAppointmentItem(appointmentId, {
      paymentDetails: localDetails,
      price: total,
    });

    if (typeof onSave === "function") {
      onSave(appointmentId, localDetails);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[999999] flex justify-center items-center">
      <div className="bg-white p-4 rounded-md max-w-md w-full font-vazir text-sm">
        <h3 className="text-lg font-bold mb-3">مدیریت روش‌های پرداخت</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {paymentMethods.map((pm) => {
            const item = localDetails.find((p) => p.method === pm.name);
            return (
              <div key={pm.name} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!item}
                  onChange={() => handleToggleMethod(pm.name)}
                />
                <span>{pm.name}</span>
                {item && (
                  <input
                    type="text"
                    value={toPersianNumber(
                      (item.amount || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "٬")
                    )}
                    onChange={(e) => handleAmountChange(pm.name, e.target.value)}
                    className="border rounded px-2 py-1 text-xs text-right w-28"
                    placeholder="مبلغ"
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1 text-gray-600 hover:text-black">
            بستن
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            ذخیره
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;