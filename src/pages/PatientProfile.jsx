import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getPatientByPhone, updatePatientPhoto } from "../api/patients";
import useAppointmentsStore from "../store/useAppointmentsStore";
import { toPersianNumber } from "../utils/number";
import getImageUrl from "../utils/getImageUrl";
import { toShamsi } from "../utils/date";
import moment from "moment-jalaali";

export default function PatientProfile() {
  const { phone } = useParams();
  const [patient, setPatient] = useState(null);
  const [lastAppointment, setLastAppointment] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [editedNotes, setEditedNotes] = useState({});
  const images = patient?.photos || { before: [], after: [] };

  const { appointments, fetchAppointments } = useAppointmentsStore();

  useEffect(() => {
    const fetchData = async () => {
      const patientData = await getPatientByPhone(phone);
      setPatient(patientData);
      console.log("🎂 تاریخ تولد خام:", patientData.birthDate);
      await fetchAppointments();

      const related = appointments.filter(
        (a) => a.patientId?._id === patientData._id
      );

      if (related.length > 0) {
        const sorted = [...related].sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        setLastAppointment(sorted[0]);
      } else {
        setLastAppointment(null);
      }
    };

    fetchData();
  }, [phone, appointments.length]);

  if (!patient) return <p>در حال بارگذاری اطلاعات بیمار...</p>;

  const patientAppointments = appointments.filter(
    (a) => a.patientId?.phone === patient.phone
  );
  const doneAppointments = patientAppointments.filter(
    (a) => a.status === "Completed"
  );
  const pendingAppointments = patientAppointments.filter(
    (a) => a.status === "Scheduled"
  );
  const totalAmount = doneAppointments.reduce(
    (acc, a) => acc + Number(a.price || 0),
    0
  );

  const handleNoteChange = (id, value) => {
    setEditedNotes((prev) => ({ ...prev, [id]: value }));
  };

  const handleNoteSave = async (id) => {
    const note = editedNotes[id];
    try {
      const res = await fetch(`https://clinic-crm-backend.onrender.com/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) throw new Error("خطا در ذخیره یادداشت");

      await res.json();
      fetchAppointments();
    } catch (err) {
      console.error("⛔️ خطا در ذخیره یادداشت:", err);
    }
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file || !patient?._id) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const updated = await updatePatientPhoto(patient._id, type, formData);
      setPatient(updated);
    } catch (err) {
      console.error("⛔️ خطا در آپلود عکس:", err);
    }
  };

  const handleImageDelete = async (type, index) => {
    if (!window.confirm("آیا از حذف این عکس مطمئن هستید؟")) return;

    const updatedList = [...images[type]];
    const deletedPath = updatedList.splice(index, 1)[0];

    try {
      await updatePatientPhoto(patient._id, type, {
        method: "DELETE",
        imagePath: deletedPath,
      });

      setPatient((prev) => ({
        ...prev,
        photos: {
          ...prev.photos,
          [type]: updatedList,
        },
      }));
    } catch (err) {
      console.error("⛔️ خطا در حذف عکس:", err);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4 text-right">
      <h2 className="text-xl font-bold mb-1">{patient.fullName}</h2>
      <p className="text-gray-700">شماره تماس: {toPersianNumber(patient.phone)}</p>
      {patient.birthDate && (
        <p className="text-gray-700">تاریخ تولد: {toPersianNumber(toShamsi(patient.birthDate))}</p>
      )}
{patient.address && (
  <p className="text-gray-700">آدرس: {patient.address}</p>
)}
      <div className="bg-green-50 border p-4 rounded text-sm mb-6">
        <p>تعداد کل نوبت‌ها: {toPersianNumber(patientAppointments.length)}</p>
        <p>در انتظار: {toPersianNumber(pendingAppointments.length)}</p>
        <p>انجام شده: {toPersianNumber(doneAppointments.length)}</p>
        <p>مجموع دریافتی: {toPersianNumber(totalAmount.toLocaleString())} تومان</p>
      </div>

      {patientAppointments.length > 0 && (
        <div className="mt-8">
          <h3 className="font-bold mb-2">لیست نوبت‌ها</h3>
          <div className="bg-white shadow-md rounded-xl overflow-x-auto">
            <table className="min-w-full text-sm text-right border-separate border-spacing-y-1">
              <thead>
                <tr className="bg-brand text-white">
                  <th className="px-3 py-2">تاریخ</th>
                  <th className="px-3 py-2">ساعت</th>
                  <th className="px-3 py-2">آیتم‌ها / نواحی</th>
                  <th className="px-3 py-2">مبلغ</th>
                  <th className="px-3 py-2">وضعیت</th>
                  <th className="px-3 py-2">توضیحات</th>
                </tr>
              </thead>
              <tbody>
                {patientAppointments.map((a) => (
                  <tr
                    key={a._id}
                    className={
                      a.status === "Completed"
                        ? "bg-emerald-50 border border-emerald-200"
                        : a.status === "Scheduled"
                        ? "bg-yellow-50 border border-yellow-200"
                        : "bg-red-50 border border-red-200"
                    }
                  >
                    <td className="px-3 py-2">{toPersianNumber(a.dateShamsi)}</td>
                    <td className="px-3 py-2">{toPersianNumber(a.time)}</td>
                    <td className="px-3 py-2">
  {a.type === "Injection"
    ? a.consumables?.map((c) => `${c.name} (${c.amount})`).join(" + ") || "-"
    : a.laserAreas?.map((areaObj) => areaObj.area).join(" + ") || "-"}
</td>
                    <td className="px-3 py-2">{toPersianNumber(Number(a.price || 0).toLocaleString())} تومان</td>
                    <td className="px-3 py-2">
                      {a.status === "Completed"
                        ? "انجام‌شده"
                        : a.status === "Scheduled"
                        ? "در انتظار"
                        : "لغو‌شده"}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={editedNotes[a._id] ?? a.note ?? ""}
                        onChange={(e) => handleNoteChange(a._id, e.target.value)}
                        onBlur={() => handleNoteSave(a._id)}
                        className="border px-2 py-1 rounded w-full text-sm"
                        placeholder="یادداشت..."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h3 className="font-bold mb-3">تصاویر بیمار</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {["before", "after"].map((type) => (
            <div key={type}>
              <p className="font-semibold mb-2">{type === "before" ? "قبل" : "بعد"}</p>
              <label className="block w-32 h-32 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:border-emerald-500 transition">
                <span className="text-sm text-gray-600">انتخاب عکس</span>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, type)} className="hidden" />
              </label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {images[type]?.map((src, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={getImageUrl(src)}
                      alt={`${type}-${i}`}
                      className="h-24 w-24 object-cover cursor-pointer border rounded"
                      onClick={() => setPreviewSrc(getImageUrl(src))}
                    />
                    <button
                      onClick={() => handleImageDelete(type, i)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full shadow flex items-center justify-center"
                      title="حذف"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {previewSrc && (
          <div
            onClick={() => setPreviewSrc(null)}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          >
            <img src={previewSrc} className="max-w-full max-h-full rounded shadow-xl" />
          </div>
        )}
      </div>
    </div>
  );
}