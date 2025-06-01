import React from "react";
import { formatPrice, toPersianNumber } from "../../utils/number";

export default function ProductCard({ product, onEdit, onDelete }) {
  return (
    <div className="border p-3 rounded shadow-sm bg-white flex justify-between items-center mb-2">
      <div>
        <p className="font-semibold">{product.name}</p>
        <p className="text-sm text-gray-500">
          {product.unit} - موجودی: {toPersianNumber(product.totalQuantity || 0)}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          قیمت فروش: {formatPrice(product.salePrice || 0)} تومان
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(product)}
          className="text-blue-600 hover:underline text-sm"
        >
          ویرایش
        </button>
        <button
          onClick={() => onDelete(product._id)}
          className="text-red-600 hover:underline text-sm"
        >
          حذف
        </button>
      </div>
    </div>
  );
}
