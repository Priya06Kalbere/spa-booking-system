import { api } from "./api";

// Shared multipart request config
const MULTIPART_CONFIG = {
  headers: {
    "Content-Type": "multipart/form-data",
  },
};

// Convert object values into FormData
const toFormData = (payload = {}) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    formData.append(key, value ?? "");
  });

  return formData;
};

// Create booking
export const createBookingApi = async (payload) => {
  const response = await api.post("/bookings/create", payload);
  return response.data;
};

// Update booking
export const updateBookingApi = async (bookingId, payload) => {
  const formData = toFormData({
    company: String(payload.company ?? 1),
    outlet: String(payload.outlet ?? 1),
    items: JSON.stringify(payload.items || []),
    currency: payload.currency || "SGD",
    source: payload.source || "WhatsApp",
    payment_type: payload.payment_type || "payatstore",
    payment_status: String(payload.payment_status ?? 1),
    service_at: payload.service_at || "",
    customer: String(payload.customer || ""),
    customer_name: payload.customer_name || "",
    customer_lastname: payload.customer_lastname || "",
    customer_email: payload.customer_email || "",
    mobile_number: payload.mobile_number || "",
    panel: payload.panel || "outlet",
    updated_by: String(payload.updated_by || ""),
    booking_type: String(payload.booking_type ?? 1),
    membership: String(payload.membership ?? 0),
    note: payload.note || "",
  });

  const response = await api.post(`/bookings/${bookingId}`, formData, MULTIPART_CONFIG);
  return response.data;
};

// Cancel booking item
export const cancelBookingApi = async (id, type = "normal") => {
  const formData = toFormData({
    company: "1",
    id: String(id),
    type,
    panel: "outlet",
  });

  const response = await api.post("/bookings/item/cancel", formData, MULTIPART_CONFIG);
  return response.data;
};

// Delete booking
export const deleteBookingApi = async (bookingId) => {
  const formData = toFormData({
    _method: "DELETE",
  });

  const response = await api.post(
    `/bookings/destroy/${bookingId}`,
    formData,
    MULTIPART_CONFIG
  );

  return response.data;
};