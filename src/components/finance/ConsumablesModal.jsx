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

      if (appointmentId) {
        const appointment = appointments.find((a) => a._id === appointmentId);
        const isNewlyCreated = appointment?.createdAt === appointment?.updatedAt;
        originalItemsRef.current = isNewlyCreated ? [] : cleaned || [];
      }

      calculateSuggestedPrice(cleaned, data);
    } catch (err) {
      toast.error("⛔️ خطا در دریافت موجودی");
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

  if (!appointmentId) {
    toast.error("⛔️ شناسه نوبت مشخص نیست");
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

    toast.success("✔️ آیتم‌های مصرفی با موفقیت ذخیره شدند");
    onClose();
    
    // ✅ اصلاح این قسمت: ارسال آیتم‌ها و مبلغ
    if (typeof onSave === "function") {
      onSave(cleanedItems, suggestedPrice);
    }

  } catch (err) {
    console.error("⛔️ خطا در ذخیره:", err);
    toast.error("⛔️ خطا در ذخیره آیتم‌ها");
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
