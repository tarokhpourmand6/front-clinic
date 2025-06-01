// InventoryManager.jsx
import { useEffect, useState } from "react";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  addPurchase,
  deletePurchase,
} from "../../api/inventory";
import DatePicker from "../../components/DatePicker/DatePicker";
import { toPersianNumber, toEnglishNumber, cleanPriceInput, formatPrice } from "../../utils/number";
import { toShamsi, formatDateObj } from "../../utils/date";
import moment from "moment-jalaali";
import { toast } from "react-toastify";

export default function InventoryManager() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: "", unit: "عدد", salePrice: "" });
  const [purchaseInputs, setPurchaseInputs] = useState({});
  const [salePriceInputs, setSalePriceInputs] = useState({});

  const LOW_STOCK_THRESHOLD = 5;

  const fetchProducts = async () => {
    try {
      const data = await getAllProducts();
      setProducts(data);
    } catch (err) {
      console.error("⛔️ خطا در دریافت محصولات:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const lowStockItems = products.filter(p => p.totalQuantity < LOW_STOCK_THRESHOLD);
    if (lowStockItems.length > 0) {
      lowStockItems.forEach(p => {
        toast.warn(`موجودی «${p.name}» کم است (${toPersianNumber(p.totalQuantity)})`);
      });
    }
  }, [products]);

  const handlePurchaseChange = (id, field, value) => {
    setPurchaseInputs({
      ...purchaseInputs,
      [id]: {
        ...purchaseInputs[id],
        [field]: value,
      },
    });
  };

  const savePurchase = async (id) => {
    const product = products[id];
    const current = purchaseInputs[id];
    if (!current?.date || !current?.amount || !current?.price) return;

    const { year, month, day } = current.date;
    const shamsiStr = `${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
    const miladiDate = moment(shamsiStr, "jYYYY/jMM/jDD").toDate();
    const cleanedPrice = cleanPriceInput(current.price);

    try {
      await addPurchase(product._id, {
        date: miladiDate,
        amount: Number(current.amount),
        price: cleanedPrice,
      });
      await fetchProducts();
      setPurchaseInputs((prev) => ({ ...prev, [id]: {} }));
    } catch (err) {
      console.error("⛔️ خطا در ثبت خرید:", err);
    }
  };

  const saveSalePrice = async (id) => {
    const product = products[id];
    const rawPrice = salePriceInputs[id];
    const cleanedPrice = Number(toEnglishNumber(rawPrice).replace(/[^\d]/g, ""));

    try {
      await updateProduct(product._id, { salePrice: cleanedPrice || 0 });
      await fetchProducts();
    } catch (err) {
      console.error("⛔️ خطا در ویرایش قیمت:", err);
    }
  };

  const handleAddProduct = async () => {
    try {
      const cleanedPrice = Number(toEnglishNumber(newProduct.salePrice).replace(/[^\d]/g, ""));
      const payload = {
        name: newProduct.name.trim(),
        unit: newProduct.unit,
        salePrice: cleanedPrice || 0,
      };
      await createProduct(payload);
      await fetchProducts();
      setNewProduct({ name: "", unit: "عدد", salePrice: "" });
    } catch (err) {
      console.error("⛔️ خطا در افزودن محصول:", err);
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteProduct(id);
      await fetchProducts();
    } catch (err) {
      console.error("⛔️ خطا در حذف محصول:", err);
    }
  };

  const handleDeletePurchase = async (productId, purchaseId) => {
    try {
      await deletePurchase(productId, purchaseId);
      await fetchProducts();
    } catch (err) {
      console.error("⛔️ خطا در حذف خرید:", err);
    }
  };

  return (
    <div>
      <h2 className="font-bold text-lg mb-4">📦 مدیریت انبار</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <input
          type="text"
          placeholder="نام محصول"
          value={newProduct.name}
          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
          className="border p-2 rounded text-sm"
        />
        <select
          value={newProduct.unit}
          onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
          className="border p-2 rounded text-sm"
        >
          <option value="عدد">عدد</option>
          <option value="میلی‌لیتر">میلی‌لیتر</option>
        </select>
        <input
          type="text"
          placeholder="قیمت فروش"
          value={newProduct.salePrice}
          onChange={(e) => setNewProduct({ ...newProduct, salePrice: e.target.value })}
          className="border p-2 rounded text-sm"
        />
        <button
          onClick={handleAddProduct}
          className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 text-sm"
        >
          افزودن
        </button>
      </div>

      {products.map((product, idx) => (
        <div key={product._id} className="border rounded-xl p-4 mb-6 shadow-sm bg-white">
          <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
            <h3 className="font-semibold flex items-center gap-2">
              {product.name} ({product.unit})
              {product.totalQuantity < LOW_STOCK_THRESHOLD && (
                <span className="text-red-600 text-xs bg-red-100 px-2 py-0.5 rounded">
                  موجودی کم
                </span>
              )}
            </h3>
            <span className="text-sm text-gray-600">
              موجودی: {toPersianNumber(product.totalQuantity)}
            </span>
            <span className="text-sm text-gray-600">
              قیمت فروش: {formatPrice(product.salePrice)} تومان
            </span>
            <input
              type="text"
              value={salePriceInputs[idx] || product.salePrice}
              onChange={(e) => setSalePriceInputs({ ...salePriceInputs, [idx]: e.target.value })}
              placeholder="قیمت فروش"
              className="border px-2 py-1 rounded text-sm w-28"
            />
            <button
              onClick={() => saveSalePrice(idx)}
              className="bg-gray-200 text-xs px-3 py-1 rounded"
            >
              ذخیره
            </button>
            <button
              onClick={() => handleDeleteProduct(product._id)}
              className="text-xs text-red-500 underline"
            >
              حذف محصول
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
            <DatePicker
              value={purchaseInputs[idx]?.date || null}
              onChange={(date) => handlePurchaseChange(idx, "date", date)}
              inputPlaceholder="تاریخ خرید"
              locale="fa"
              inputClassName="border px-2 py-1 rounded text-sm w-full"
            />
            <input
              type="number"
              value={purchaseInputs[idx]?.amount || ""}
              onChange={(e) => handlePurchaseChange(idx, "amount", e.target.value)}
              placeholder="تعداد"
              className="border px-2 py-1 rounded text-sm"
            />
            <input
              type="text"
              value={purchaseInputs[idx]?.price || ""}
              onChange={(e) => handlePurchaseChange(idx, "price", e.target.value)}
              placeholder="قیمت خرید"
              className="border px-2 py-1 rounded text-sm"
            />
            <button
              onClick={() => savePurchase(idx)}
              className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600"
            >
              ثبت خرید
            </button>
          </div>

          {product.purchases.length > 0 && (
            <table className="w-full text-sm border border-separate border-spacing-y-1">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-1">تاریخ</th>
                  <th className="px-2 py-1">تعداد</th>
                  <th className="px-2 py-1">قیمت</th>
                  <th className="px-2 py-1">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {product.purchases.map((p) => (
                  <tr key={p._id} className="bg-gray-50">
                    <td className="px-2 py-1">{toPersianNumber(formatDateObj(toShamsi(p.date)))}</td>
                    <td className="px-2 py-1">{toPersianNumber(p.amount)}</td>
                    <td className="px-2 py-1">{formatPrice(p.price)} تومان</td>
                    <td className="px-2 py-1 text-center">
                      <button
                        onClick={() => handleDeletePurchase(product._id, p._id)}
                        className="text-xs text-red-500 underline"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}