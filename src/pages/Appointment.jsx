import { useState, useEffect } from "react";
import DatePicker from "../components/DatePicker/DatePicker";
import LaserAreaSelector from "../components/LaserAreaSelector";
import { useNavigate } from "react-router-dom";
import { getPatients, createPatient } from "../api/patients";
import { createAppointment } from "../api/appointments";
import { getAllProducts } from "../api/inventory";
import { getLaserPrices } from "../api/laserPrice";
import LoadingSpinner from "../components/LoadingSpinner";
import moment from "moment-jalaali";
moment.loadPersian({ dialect: "persian-modern" });

const AppointmentNew = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [laserPrices, setLaserPrices] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointment, setAppointment] = useState({
    serviceType: "تزریقات",
    serviceOption: [],
    appointmentDate: null,
    appointmentHour: "08",
    appointmentMinute: "00",
    status: "Scheduled",
    price: 0,
    gender: "female",
  });

  const hours = Array.from({ length: 15 }, (_, i) => (8 + i).toString().padStart(2, "0"));
  const minutes = ["00", "10", "20", "30", "40", "50"];

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const patientRes = await getPatients();
        const patientList = Array.isArray(patientRes) ? patientRes : patientRes.data;
        setPatients(patientList);

        const productRes = await getAllProducts();
        setInventory(productRes);

        const laserRes = await getLaserPrices();
        const priceMap = {};
        laserRes.forEach(({ gender, area, price }) => {
          priceMap[`${gender}-${area}`] = price;
        });
        setLaserPrices(priceMap);
      } catch (err) {
        console.error("⛔️ خطا در بارگذاری داده‌ها:", err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    let total = 0;
    if (appointment.serviceType === "تزریقات") {
      appointment.serviceOption.forEach(({ name, amount }) => {
        const found = inventory.find((i) => i.name === name);
        if (found?.sellPrice) {
          total += Number(found.sellPrice) * (Number(amount) || 1);
        }
      });
    } else {
      appointment.serviceOption.forEach((area) => {
        const price = laserPrices[`${appointment.gender}-${area}`];
        if (price) total += price;
      });
    }
    setAppointment((prev) => ({ ...prev, price: total }));
  }, [appointment.serviceOption, appointment.gender, appointment.serviceType]);

  const handleSubmit = async () => {
    if (!selectedPatient?._id || !appointment.appointmentDate) {
      alert("اطلاعات ناقص است.");
      return;
    }
    const dateShamsi = moment(
      `${appointment.appointmentDate.year}/${appointment.appointmentDate.month}/${appointment.appointmentDate.day}`,
      "jYYYY/jM/jD"
    ).format("jYYYY-jMM-jDD");

    const payload = {
      patientId: selectedPatient._id,
      dateShamsi,
      time: `${appointment.appointmentHour}:${appointment.appointmentMinute}`,
      type: appointment.serviceType === "تزریقات" ? "Injection" : "Laser",
      status: appointment.status,
      price: appointment.price,
      consumables: appointment.serviceType === "تزریقات" ? appointment.serviceOption : [],
      laserAreas:
        appointment.serviceType === "لیزر"
          ? appointment.serviceOption.map((a) => ({ area: a, gender: appointment.gender }))
          : [],
    };

    try {
      await createAppointment(payload);
      navigate("/appointments");
    } catch (err) {
      console.error("⛔️ خطا در ثبت نوبت:", err);
      alert("⛔️ خطا در ثبت نوبت");
    }
  };

  const filteredPatients = Array.isArray(patients)
    ? patients.filter(
        (p) => p.fullName?.includes(search) || p.phone?.includes(search)
      )
    : [];

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-xl mx-auto font-vazir">
      <h2 className="text-lg font-bold mb-4">ثبت نوبت جدید</h2>

      <input
        className="border p-2 rounded w-full mb-2"
        type="text"
        placeholder="جستجوی نام یا شماره تماس"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {!selectedPatient &&
        filteredPatients.slice(0, 5).map((p, i) => (
          <button
            key={i}
            onClick={() => setSelectedPatient(p)}
            className="block w-full text-right text-sm p-2 border rounded mb-2"
          >
            {p.fullName} - {p.phone}
          </button>
        ))}
      <button onClick={() => navigate("/patients/list")} className="text-blue-600 text-sm mb-4">+ ثبت بیمار جدید</button>

      {selectedPatient && (
        <>
          <div className="bg-gray-100 p-2 rounded mb-4">
            <p className="text-sm">{selectedPatient.fullName} - {selectedPatient.phone}</p>
          </div>

          <div className="mb-4">
            <label className="text-sm">نوع خدمت:</label>
            <select
              value={appointment.serviceType}
              onChange={(e) => {
                const type = e.target.value;
                setAppointment({
                  ...appointment,
                  serviceType: type,
                  serviceOption: [],
                });
              }}
              className="border p-2 rounded w-full text-sm"
            >
              <option value="تزریقات">تزریقات</option>
              <option value="لیزر">لیزر</option>
            </select>
          </div>

          {appointment.serviceType === "تزریقات" && (
            <div className="mb-4">
              <label className="text-sm block mb-1">انتخاب نوع تزریقات:</label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {inventory.map((item, i) => {
                  const selected = Array.isArray(appointment.serviceOption)
                    ? appointment.serviceOption.find((x) => typeof x === "object" && x.name === item.name)
                    : null;

                  return (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={(e) => {
                          let updated = [...appointment.serviceOption];

                          if (e.target.checked) {
                            updated.push({ name: item.name, amount: 1 });
                          } else {
                            updated = updated.filter((x) => x.name !== item.name);
                          }

                          setAppointment({ ...appointment, serviceOption: updated });
                        }}
                      />
                      {item.name}
                      {!!selected && (
                        <input
                          type="number"
                          min="1"
                          value={selected.amount || 1}
                          onChange={(e) => {
                            const updated = appointment.serviceOption.map((opt) =>
                              opt.name === item.name ? { ...opt, amount: e.target.value } : opt
                            );
                            setAppointment({ ...appointment, serviceOption: updated });
                          }}
                          className="w-16 border p-1 text-sm rounded text-center"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {appointment.serviceType === "لیزر" && (
            <>
              <div className="mb-4">
                <label className="text-sm">جنسیت:</label>
                <select
                  value={appointment.gender}
                  onChange={(e) => setAppointment({ ...appointment, gender: e.target.value, serviceOption: [] })}
                  className="border p-2 rounded w-full text-sm"
                >
                  <option value="female">خانم</option>
                  <option value="male">آقا</option>
                </select>
              </div>
              <LaserAreaSelector
                gender={appointment.gender}
                selectedAreas={appointment.serviceOption}
                onChange={(areas) => setAppointment({ ...appointment, serviceOption: areas })}
              />
            </>
          )}

          <div className="mb-4">
            <label className="text-sm">تاریخ نوبت:</label>
            <DatePicker
              value={appointment.appointmentDate}
              onChange={(date) => setAppointment({ ...appointment, appointmentDate: date })}
              inputPlaceholder="تاریخ"
              locale="fa"
              inputClassName="border p-2 rounded w-full"
            />
          </div>

          <div className="mb-4 flex gap-2">
            <div className="w-1/2">
              <label className="text-sm">دقیقه:</label>
              <select
                value={appointment.appointmentMinute}
                onChange={(e) => setAppointment({ ...appointment, appointmentMinute: e.target.value })}
                className="border p-2 rounded w-full"
              >
                {minutes.map((m, i) => <option key={i} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="w-1/2">
              <label className="text-sm">ساعت:</label>
              <select
                value={appointment.appointmentHour}
                onChange={(e) => setAppointment({ ...appointment, appointmentHour: e.target.value })}
                className="border p-2 rounded w-full"
              >
                {hours.map((h, i) => <option key={i} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <button onClick={handleSubmit} className="bg-brand text-white px-4 py-2 rounded w-full">
            ثبت نوبت
          </button>
        </>
      )}
    </div>
  );
};

export default AppointmentNew;