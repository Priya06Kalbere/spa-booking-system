import { api } from "./api";

/**
 * Get list of services based on filters
 */
export const getServicesApi = async ({
  outlet = 1,
  outlet_type = 2,
  therapist,
  service_at,
  search_text = "",
} = {}) => {
  const params = {
    search_text,
    outlet_type,
    outlet,
    status: 1,
    therapist,
    pagination: 0,
    panel: "outlet",
    service_at,
  };

  const response = await api.get("/service-category", { params });
  return response.data;
};

/**
 * Get available therapists (used in drawer / slot selection)
 */
export const getTherapistsApi = async ({
  outlet = 1,
  service_at,
  services,
  outlet_type = 2,
} = {}) => {
  const params = {
    availability: 1,
    outlet,
    service_at,
    services,
    status: 1,
    pagination: 0,
    panel: "outlet",
    outlet_type,
    leave: 0,
  };

  const response = await api.get("/therapists", { params });
  return response.data;
};

/**
 * Get all therapists (used for calendar board view)
 */
export const getAllTherapistsApi = async ({
  outlet = 1,
  outlet_type = 2,
} = {}) => {
  const params = {
    outlet,
    outlet_type,
    status: 1,
    pagination: 0,
    panel: "outlet",
    leave: 0,
  };

  const response = await api.get("/therapists", { params });
  return response.data;
};

/**
 * Get available rooms based on booking details
 */
export const getRoomsApi = async ({
  outlet = 1,
  date,
  duration,
  service_at,
  service_id,
  user_id = 6,
} = {}) => {
  const params = {
    date,
    panel: "outlet",
    duration,
    service_at,
    pagination: 0,
    availability: 1,
    user_id,
    service_id,
  };

  const response = await api.get(`/room-bookings/outlet/${outlet}`, {
    params,
  });

  return response.data;
};