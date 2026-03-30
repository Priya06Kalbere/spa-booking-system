import { useEffect, useMemo, useState } from "react";
import {
  fetchServices,
  fetchTherapists,
  fetchRooms,
} from "../../store/masterDataActions";
import { useDispatch, useSelector } from "react-redux";
import { listCustomersApi } from "../../services/customer";
import CustomerCreateModal from "./CustomerCreateModal";

const CreateBookingForm = ({ initialData, onSubmit, onClose, loading }) => {
  const dispatch = useDispatch();

  // Redux Data
  const services = useSelector((state) => state.master?.services || []);
  const therapists = useSelector((state) => state.master?.therapists || []);
  const rooms = useSelector((state) => state.master?.rooms || []);

  const servicesLoading = useSelector((state) => state.master?.servicesLoading);
  const therapistsLoading = useSelector((state) => state.master?.therapistsLoading);
  const roomsLoading = useSelector((state) => state.master?.roomsLoading);

  // Local State
  const [customerResults, setCustomerResults] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Main form state
  const [form, setForm] = useState({
    customer: initialData?.customer || "",
    customer_name: initialData?.customer_name || "",
    customer_lastname: initialData?.customer_lastname || "",
    customer_email: initialData?.customer_email || "",
    mobile_number: initialData?.mobile_number || "",
    therapist: initialData?.therapist || initialData?.therapist_id || "",
    service: initialData?.service || initialData?.service_id || "",
    room_id: initialData?.room_id || "",
    room_item_type: initialData?.room_item_type || "",
    room_item_label: initialData?.room_item_label || "",
    service_date: initialData?.service_date || "",
    start_time: initialData?.start_time || "",
    duration: initialData?.duration || 60,
    price: initialData?.price || "",
    membership: initialData?.membership || 0,
  });

  const isEdit = Boolean(initialData?.booking_id || initialData?.booking_item_id);

  // Generate 1-year date range for customer API
  const getCustomerDateRange = () => {
    const today = new Date();
    const start = new Date();
    start.setFullYear(today.getFullYear() - 1);

    const format = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;

    return `${format(start)} / ${format(today)}`;
  };

  // Convert YYYY-MM-DD → DD-MM-YYYY
  const formatDateDDMMYYYY = (date) => {
    if (!date) return "";
    const [y, m, d] = String(date).split("T")[0].split("-");
    return y && m && d ? `${d}-${m}-${y}` : "";
  };

  // Normalize customer object (important!)
  const normalizeCustomer = (c) => ({
    id: c?.id || c?.user_id || "",
    name: c?.name || c?.firstname || c?.first_name || "",
    lastname: c?.lastname || c?.last_name || "",
    email: c?.email || "",
    contact_number:
      c?.contact_number || c?.mobile_number || c?.phone || "",
    membership: Number(c?.membership ?? 0),
  });

  // Load customers initially
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setCustomersLoading(true);

        const res = await listCustomersApi({
          pagination: 1,
          daterange: getCustomerDateRange(),
        });

        const list = res?.data?.data?.list?.users || [];
        setCustomerResults(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Failed to load customers", err);
        setCustomerResults([]);
      } finally {
        setCustomersLoading(false);
      }
    };

    loadCustomers();
  }, []);

  // Load services
  useEffect(() => {
    dispatch(fetchServices({ outlet: 1, outlet_type: 2 }));
  }, [dispatch]);

  // Load therapists (depends on service + date + time)
  useEffect(() => {
    if (!form.service || !form.service_date || !form.start_time) return;

    dispatch(
      fetchTherapists({
        outlet: 1,
        outlet_type: 2,
        services: form.service,
        service_at: `${form.service_date} ${form.start_time}`,
      })
    );
  }, [dispatch, form.service, form.service_date, form.start_time]);

  // Load rooms
  useEffect(() => {
    if (!form.service || !form.service_date || !form.start_time) return;

    dispatch(
      fetchRooms({
        outlet: 1,
        date: formatDateDDMMYYYY(form.service_date),
        service_id: form.service,
      })
    );
  }, [dispatch, form.service, form.service_date, form.start_time]);

  // Populate form when editing
  useEffect(() => {
    if (!initialData) return;

    setForm((prev) => ({
      ...prev,
      ...initialData,
    }));

    setCustomerSearch(
      `${initialData?.customer_name || ""} ${initialData?.customer_lastname || ""}`.trim()
    );
  }, [initialData]);

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    const keyword = customerSearch.toLowerCase().trim();

    if (!keyword) return customerResults.slice(0, 20);

    return customerResults
      .filter((c) => {
        const full = `${c?.name || ""} ${c?.lastname || ""}`.toLowerCase();
        return (
          full.includes(keyword) ||
          String(c?.contact_number || "").includes(keyword) ||
          String(c?.email || "").includes(keyword)
        );
      })
      .slice(0, 20);
  }, [customerResults, customerSearch]);

  // Flatten room items
  const roomOptions = useMemo(() => {
    return rooms.flatMap((room) =>
      (room.items || []).map((item) => ({
        value: item.item_id,
        label: `${room.room_name} - ${item.item_name}`,
        itemType: item.item,
      }))
    );
  }, [rooms]);

  // =========================
  // Handlers
  // =========================

  const handleSelectCustomer = (customer) => {
    const c = normalizeCustomer(customer);

    setForm((prev) => ({
      ...prev,
      customer: c.id,
      customer_name: c.name,
      customer_lastname: c.lastname,
      customer_email: c.email,
      mobile_number: c.contact_number,
      membership: c.membership,
    }));

    setCustomerSearch(`${c.name} ${c.lastname}`.trim());
    setShowDropdown(false);
    setErrors((prev) => ({ ...prev, customer: "" }));
  };

  const handleCustomerCreated = (created) => {
    const c = normalizeCustomer(created);

    if (!c.id) {
      console.error("Missing customer id", created);
      return;
    }

    setCustomerResults((prev) => {
      if (prev.some((p) => String(p.id) === String(c.id))) return prev;
      return [c, ...prev];
    });

    handleSelectCustomer(c);
  };

  // Generic input handler
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "room_id") {
      const selected = roomOptions.find((r) => String(r.value) === value);

      setForm((prev) => ({
        ...prev,
        room_id: value,
        room_item_type: selected?.itemType || "",
        room_item_label: selected?.label || "",
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Validation
  const validate = () => {
    const e = {};

    if (!form.customer) e.customer = "Please select or create a client";
    if (!form.service) e.service = "Please select a service";
    if (!form.therapist) e.therapist = "Please select a therapist";
    if (!form.room_id) e.room_id = "Please select a room";
    if (!form.service_date) e.service_date = "Select date";
    if (!form.start_time) e.start_time = "Select time";
    if (!form.price) e.price = "Price required";
    if (!form.duration || form.duration < 15)
      e.duration = "Minimum 15 mins";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await onSubmit({
      ...form,
      customer: Number(form.customer),
      therapist: Number(form.therapist),
      service: Number(form.service),
      room_id: Number(form.room_id),
      duration: Number(form.duration),
    });

    if (!result?.success) {
      console.error(result?.message);
    }
  };


  // UI Helpers
  const inputClass = (field) =>
    `w-full rounded-lg border px-3 py-2 text-sm ${
      errors[field]
        ? "border-red-400"
        : "border-slate-300 focus:border-blue-500"
    }`;
   
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Customer Create Modal */}
      <CustomerCreateModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCustomerCreated}
      />
      {!isEdit ? (
            <>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Search or create client
            </label>

            <div className="flex gap-2">
              <input
                value={customerSearch}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomerSearch(value);
                  setShowDropdown(true);

                  if (!value.trim()) {
                    setForm((prev) => ({
                      ...prev,
                      customer: "",
                      customer_name: "",
                      customer_lastname: "",
                      customer_email: "",
                      mobile_number: "",
                      membership: 0,
                    }));
                  }
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder={
                  customersLoading
                    ? "Loading customers..."
                    : "Search by name, phone, email"
                }
                className={inputClass("customer")}
              />

              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                +
              </button>
            </div>

            {showDropdown && (
              <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border bg-white shadow">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={() => handleSelectCustomer(c)}
                      className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <div className="text-sm font-medium text-slate-800">
                        {c.name} {c.lastname}
                      </div>
                      <div className="text-xs text-slate-500">
                        {c.contact_number || c.email || "-"}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-slate-500">
                    {customersLoading ? "Loading..." : "No customers found"}
                  </div>
                )}
              </div>
            )}

            {errors.customer && (
              <p className="mt-1 text-xs text-red-600">{errors.customer}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                First Name
              </label>
              <input
                name="customer_name"
                value={form.customer_name}
                readOnly
                className={`${inputClass("customer_name")} bg-slate-50`}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Last Name
              </label>
              <input
                name="customer_lastname"
                value={form.customer_lastname}
                readOnly
                className={`${inputClass("customer_lastname")} bg-slate-50`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Email
              </label>
              <input
                name="customer_email"
                value={form.customer_email}
                readOnly
                className={`${inputClass("customer_email")} bg-slate-50`}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Mobile
              </label>
              <input
                name="mobile_number"
                value={form.mobile_number}
                readOnly
                className={`${inputClass("mobile_number")} bg-slate-50`}
              />
            </div>
          </div>
        </>
      ) : (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Client
          </label>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-sm font-medium text-slate-800">
              {form.customer_name} {form.customer_lastname}
            </div>
            <div className="text-xs text-slate-500">
              {form.mobile_number || form.customer_email}
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Service
        </label>
        <select
          name="service"
          value={form.service}
          onChange={handleChange}
          className={inputClass("service")}
          disabled={servicesLoading}
        >
          <option value="">
            {servicesLoading ? "Loading services..." : "Select Service"}
          </option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || `Service #${s.id}`}
            </option>
          ))}
        </select>
        {errors.service && (
          <p className="mt-1 text-xs text-red-600">{errors.service}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Therapist
        </label>
        <select
          name="therapist"
          value={form.therapist}
          onChange={handleChange}
          className={inputClass("therapist")}
          disabled={
            !form.service ||
            !form.service_date ||
            !form.start_time ||
            therapistsLoading
          }
        >
          <option value="">
            {therapistsLoading ? "Loading therapists..." : "Select Therapist"}
          </option>
          {therapists.map((t) => (
            <option key={t.id} value={t.id}>
              {t.alias || t.name || t.full_name || `Therapist #${t.id}`}
            </option>
          ))}
        </select>
        {errors.therapist && (
          <p className="mt-1 text-xs text-red-600">{errors.therapist}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Room Item
        </label>
        <select
          name="room_id"
          value={form.room_id}
          onChange={handleChange}
          className={inputClass("room_id")}
          disabled={
            !form.service || !form.service_date || !form.start_time || roomsLoading
          }
        >
          <option value="">
            {roomsLoading ? "Loading room items..." : "Select Room Item"}
          </option>
          {roomOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.room_id && (
          <p className="mt-1 text-xs text-red-600">{errors.room_id}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Date
          </label>
          <input
            type="date"
            name="service_date"
            value={form.service_date}
            onChange={handleChange}
            className={inputClass("service_date")}
          />
          {errors.service_date && (
            <p className="mt-1 text-xs text-red-600">{errors.service_date}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Start Time
          </label>
          <input
            type="time"
            name="start_time"
            value={form.start_time}
            onChange={handleChange}
            className={inputClass("start_time")}
          />
          {errors.start_time && (
            <p className="mt-1 text-xs text-red-600">{errors.start_time}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Duration
          </label>
          <input
            type="number"
            name="duration"
            min="15"
            value={form.duration}
            onChange={handleChange}
            className={inputClass("duration")}
          />
          {errors.duration && (
            <p className="mt-1 text-xs text-red-600">{errors.duration}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Price
          </label>
          <input
            name="price"
            value={form.price}
            onChange={handleChange}
            className={inputClass("price")}
          />
          {errors.price && (
            <p className="mt-1 text-xs text-red-600">{errors.price}</p>
          )}
        </div>
      </div>

 
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : isEdit ? "Update Booking" : "Create Booking"}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
        >
          Close
        </button>
      </div>
    </form>
  );
};

export default CreateBookingForm;