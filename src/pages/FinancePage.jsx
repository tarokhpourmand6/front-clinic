// FinancePage.jsx
import InventoryManager from "../components/finance/InventoryManager";
import LaserPriceManager from "../components/finance/LaserPriceManager";

export default function FinancePage() {
  return (
    <div className="p-6 font-vazir max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-6">مدیریت مالی کلینیک</h1>
      
      {/* مدیریت انبار */}
      <InventoryManager />

      {/* قیمت نواحی لیزر */}
      <LaserPriceManager />
    </div>
  );
}