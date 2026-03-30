import {
  setServices,
  setServicesLoading,
  setServicesError,
  setTherapists,
  setTherapistsLoading,
  setTherapistsError,
  setAllTherapists,
  setAllTherapistsLoading,
  setAllTherapistsError,
  setRooms,
  setRoomsLoading,
  setRoomsError,
} from "./masterSlice";

import {
  getServicesApi,
  getTherapistsApi,
  getAllTherapistsApi,
} from "../services/masterData";
import { api } from "../services/api";

/**
 * Get readable error message from API error
 */
const getErrorMessage = (error, fallbackMessage) => {
  return error?.response?.data?.message || error?.message || fallbackMessage;
};

/**
 * Safely return array only
 */
const getSafeArray = (value) => {
  return Array.isArray(value) ? value : [];
};

/**
 * Convert category-based service response into flat service list
 */
const extractServices = (response) => {
  const categories =
    response?.data?.data?.list?.category ||
    response?.data?.data?.category ||
    response?.data?.category ||
    [];

  return Array.isArray(categories)
    ? categories.flatMap((category) =>
        (category.services || []).map((service) => ({
          ...service,
          category_id: category.id,
          category_name: category.name,
        }))
      )
    : [];
};

/**
 * Extract therapist list from different possible response shapes
 */
const extractTherapists = (response) => {
  return (
    response?.data?.data?.list?.staffs ||
    response?.data?.data?.staffs ||
    response?.data?.staffs ||
    response?.staffs ||
    response?.data?.data?.list ||
    response?.data?.list ||
    response?.list ||
    response?.data ||
    []
  );
};

/**
 * Extract room list from response
 */
const extractRooms = (response) => {
  return response?.data?.data?.rooms || response?.data?.data || [];
};

/**
 * Fetch services and store them in redux
 */
export const fetchServices = (params = {}) => async (dispatch) => {
  try {
    dispatch(setServicesLoading(true));
    dispatch(setServicesError(null));

    const response = await getServicesApi(params);
    const services = extractServices(response);

    dispatch(setServices(services));
    return { success: true, data: services };
  } catch (error) {
    const message = getErrorMessage(error, "Failed to fetch services");

    dispatch(setServicesError(message));
    return { success: false, error: message };
  } finally {
    dispatch(setServicesLoading(false));
  }
};

/**
 * Fetch available therapists and store them in redux
 */
export const fetchTherapists = (params = {}) => async (dispatch) => {
  try {
    dispatch(setTherapistsLoading(true));
    dispatch(setTherapistsError(null));

    const response = await getTherapistsApi(params);
    const therapists = getSafeArray(extractTherapists(response));

    dispatch(setTherapists(therapists));
    return { success: true, data: therapists };
  } catch (error) {
    const message = getErrorMessage(error, "Failed to fetch therapists");

    dispatch(setTherapistsError(message));
    return { success: false, error: message };
  } finally {
    dispatch(setTherapistsLoading(false));
  }
};

/**
 * Fetch all therapists for calendar board and store them in redux
 */
export const fetchAllTherapists = (params = {}) => async (dispatch) => {
  try {
    dispatch(setAllTherapistsLoading(true));
    dispatch(setAllTherapistsError(null));

    const response = await getAllTherapistsApi({
      outlet: params.outlet,
      outlet_type: params.outlet_type,
    });

    const therapists = getSafeArray(extractTherapists(response));

    dispatch(setAllTherapists(therapists));
    return { success: true, data: therapists };
  } catch (error) {
    const message = getErrorMessage(error, "Failed to fetch all therapists");

    dispatch(setAllTherapistsError(message));
    return { success: false, error: message };
  } finally {
    dispatch(setAllTherapistsLoading(false));
  }
};

/**
 * Fetch available rooms and store them in redux
 */
export const fetchRooms = (params = {}) => async (dispatch) => {
  try {
    dispatch(setRoomsLoading(true));
    dispatch(setRoomsError(null));

    const response = await api.get(`/room-bookings/outlet/${params.outlet}`, {
      params: {
        date: params.date,
        panel: params.panel,
        duration: params.duration,
        service_at: params.service_at,
        pagination: params.pagination,
        availability: params.availability,
        user_id: params.user_id,
        service_id: params.service_id,
      },
    });

    const rooms = getSafeArray(extractRooms(response));

    dispatch(setRooms(rooms));
    return { success: true, data: rooms };
  } catch (error) {
    const message = getErrorMessage(error, "Failed to fetch rooms");

    dispatch(setRoomsError(message));
    return { success: false, error: message };
  } finally {
    dispatch(setRoomsLoading(false));
  }
};