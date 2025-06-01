import React, { useState, useEffect, useRef } from "react";
import useAppointmentsStore from "../../store/useAppointmentsStore";
import { toast } from "react-toastify";
import { formatPrice } from "../../utils/number";

const ConsumablesModal = ({
  isOpen,
  onClose,
  appointmentId,
  disableInventoryUpdate = false,
  onSave,
}) => {
  const { appointments, updateAppointmentItem } = useAppointmentsStore();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [suggestedPrice, setSuggestedPrice] = useState(0);
  const originalItemsRef = useRef([]);

  useEffect(() => {
    if (!isOpen) return;
    fetchData();
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const res = await fetch("https://clinic-crm-backend.onrender.com/api/inventory");
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("ساختار نامعتبر");

      setInventoryItems(data);

      let existingItems = [];
      let appointment = null;

      if (appointmentId) {
        appointment = appointments.find((a) => a._id === appointmentId);
        existingItems = appointment?.consumables || [];
      }

      const cleaned = existingItems.map((item) => ({
        name: item.name,
        amount: Number(item.amount || 0),
      }));

      setSelectedItems(cleaned);

      // فقط اگر از دیتابیس اومده باشه، ذخیره کن
      if (appointmentId) {
  const appointment = appointments.find((a) => a._id === appointmentId);

  // اگر نوبت تازه ایجاد شده باشه (یعنی createdAt و updatedAt یکی هستند) یا آیتمی توش از قبل بوده ولی هنوز از انبار کم نشده
  const isNewlyCreated = appointment?.createdAt === appointment?.updatedAt;

  originalItemsRef.current = isNewlyCreated ? [] : (cleaned || []);
}
      calculateSuggestedPrice(cleaned, data);
    } catch (err) {
      toast.error("\u26D4\uFE0F \u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0645\u0648\u062C\u0648\u062F\u06CC");
      console.error(err);
    }
  };

  const calculateSuggestedPrice = (items, inventory) => {
    let total = 0;
    items.forEach((item) => {
      const found = inventory.find((i) => i.name === item.name);
      if (found?.salePrice) {
        const unitPrice = Number(found.salePrice.toString().replace(/[^\d]/g, ""));
        total += unitPrice * Number(item.amount || 0);
      }
    });
    setSuggestedPrice(total);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...selectedItems];
    updated[index] = {
      ...updated[index],
      [field]: field === "amount" ? Number(value) : value,
    };
    setSelectedItems(updated);
    calculateSuggestedPrice(updated, inventoryItems);
  };

  const addNewItem = () => {
    setSelectedItems([...selectedItems, { name: "", amount: 1 }]);
  };

  const deleteItem = (index) => {
    const updated = [...selectedItems];
    updated.splice(index, 1);
    setSelectedItems(updated);
    calculateSuggestedPrice(updated, inventoryItems);
  };

  const handleFinalSave = async () => {
    const cleanedItems = selectedItems.map((i) => ({
      name: i.name,
      amount: Number(i.amount || 0),
    }));

    if (!appointmentId && typeof onSave === "function") {
      onSave(cleanedItems, suggestedPrice);
      onClose();
      return;
    }

    if (!appointmentId) {
      toast.error("\u26D4\uFE0F \u0634\u0646\u0627\u0633\u0647 \u0646\u0648\u0628\u062A \u0645\u0634\u062E\u0635 \u0646\u06CC\u0633\u062A");
      return;
    }

    try {
      if (!disableInventoryUpdate) {
        const res = await fetch("https://clinic-crm-backend.onrender.com/api/inventory/update-stock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            previous: Array.isArray(originalItemsRef.current) ? originalItemsRef.current : [],
            current: cleanedItems,
          }),
        });

        if (!res.ok) throw new Error("خطا در بروزرسانی موجودی");
      }

      await updateAppointmentItem(appointmentId, {
        consumables: cleanedItems,
        price: suggestedPrice,
      });

      toast.success("\u2714\uFE0F \u0622\u06CC\u062A\u0645\u200C\u0647\u0627\u06CC \u0645\u0635\u0631\u0641\u06CC \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0630\u062E\u06CC\u0631\u0647 \u0634\u062F\u0646\u062F");
      onClose();
    } catch (err) {
      console.error("\u26D4\uFE0F \u062E\u0637\u0627 \u062F\u0631 \u0630\u062E\u06CC\u0631\u0647:", err);
      toast.error("\u26D4\uFE0F \u062E\u0637\u0627 \u062F\u0631 \u0630\u062E\u06CC\u0631\u0647 \u0622\u06CC\u062A\u0645\u200C\u0647\u0627");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999990] font-vazir">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">ثبت آیتم‌های مصرفی</h2>

        {selectedItems.map((item, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 mb-3 items-center">
            <select
              value={item.name}
              onChange={(e) => handleItemChange(idx, "name", e.target.value)}
              className="col-span-6 border px-2 py-1 rounded"
            >
              <option value="">انتخاب آیتم</option>
              {inventoryItems.map((inv, i) => (
                <option key={i} value={inv.name}>
                  {inv.name} (موجودی: {Number(inv.totalQuantity || 0)})
                </option>
              ))}
            </select>

            <input
              type="number"
              value={item.amount}
              onChange={(e) => handleItemChange(idx, "amount", e.target.value)}
              placeholder="مقدار"
              className="col-span-4 border px-2 py-1 rounded text-sm"
              min={1}
            />

            <button
              onClick={() => deleteItem(idx)}
              className="col-span-2 text-red-600 text-xs hover:underline"
            >
              حذف
            </button>
          </div>
        ))}

        <button onClick={addNewItem} className="text-sm text-blue-600 underline mb-4">
          + افزودن آیتم جدید
        </button>

        {suggestedPrice > 0 && (
          <div className="text-sm text-gray-700 mb-3">
            💰 <strong>قیمت پیشنهادی:</strong> {formatPrice(suggestedPrice)} تومان
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          >
            انصراف
          </button>
          <button
            onClick={handleFinalSave}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm"
          >
            ذخیره آیتم‌ها
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsumablesModal;