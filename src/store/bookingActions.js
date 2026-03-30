import { api } from "../services/api";
import {
  createBookingApi,
  updateBookingApi,
  cancelBookingApi,
  deleteBookingApi,
} from "../services/booking";
import {
  setBookings,
  setLoading,
  setError,
  setSuccessMessage,
  clearMessages,
  markBookingCancelled,
} from "./bookingSlice";

/**
 * Extract readable error message from API error object
 */
const getErrorMessage = (error, fallbackMessage) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage
  );
};

/**
 * Refresh booking list after create/update/cancel/delete
 */
const refreshBookingsAfterAction = async (dispatch) => {
  return await dispatch(
    fetchBookings({
      silent: true,
      preserveMessages: true,
    })
  );
};

/**
 * Handle success message when refresh fails after action success
 */
const handleRefreshWarning = (dispatch, successMessage, warningMessage) => {
  dispatch(setSuccessMessage(successMessage));
  console.warn(warningMessage);
};

/**
 * Fetch all bookings
 */
export const fetchBookings = (options = {}) => async (dispatch) => {
  const { silent = false, preserveMessages = false } = options;

  try {
    if (!silent) {
      dispatch(setLoading(true));
    }

    if (!preserveMessages) {
      dispatch(clearMessages());
    }

    const response = await api.get("/bookings", {
      params: {
        pagination: 1,
      },
    });

    const bookings = response?.data?.data?.data?.list?.bookings || [];
    dispatch(setBookings(bookings));

    return { success: true, data: bookings };
  } catch (error) {
    const message = getErrorMessage(error, "Failed to fetch bookings");

    dispatch(setError(message));
    console.error("[API_ERROR][FETCH_BOOKINGS]", message, error);

    return { success: false, error: message };
  } finally {
    if (!silent) {
      dispatch(setLoading(false));
    }
  }
};

/**
 * Create a new booking
 */
export const createBooking = (payload) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    dispatch(clearMessages());

    const response = await createBookingApi(payload);
    const refreshResult = await refreshBookingsAfterAction(dispatch);

    if (!refreshResult?.success) {
      handleRefreshWarning(
        dispatch,
        "Booking created successfully, but failed to refresh bookings.",
        `[BOOKING_CREATED_REFRESH_FAILED] ${refreshResult?.error || ""}`
      );

      return {
        success: true,
        data: response,
        warning: refreshResult?.error,
      };
    }

    dispatch(setSuccessMessage("Booking created successfully."));
    console.log("[BOOKING_CREATED]", response);

    return { success: true, data: response };
  } catch (error) {
    const message = getErrorMessage(error, "Failed to create booking");

    dispatch(setError(message));
    console.error("[API_ERROR][CREATE_BOOKING]", message, error);

    return { success: false, error: message };
  } finally {
    dispatch(setLoading(false));
  }
};

/**
 * Update an existing booking
 */
export const updateBooking = (bookingId, payload) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    dispatch(clearMessages());

    const response = await updateBookingApi(bookingId, payload);
    const refreshResult = await refreshBookingsAfterAction(dispatch);

    if (!refreshResult?.success) {
      handleRefreshWarning(
        dispatch,
        "Booking updated successfully, but failed to refresh bookings.",
        `[BOOKING_UPDATED_REFRESH_FAILED] ${bookingId} ${refreshResult?.error || ""}`
      );

      return {
        success: true,
        data: response,
        warning: refreshResult?.error,
      };
    }

    dispatch(setSuccessMessage("Booking updated successfully."));
    console.log("[BOOKING_UPDATED]", bookingId, response);

    return { success: true, data: response };
  } catch (error) {
    const message = getErrorMessage(error, "Failed to update booking");

    dispatch(setError(message));
    console.error("[API_ERROR][UPDATE_BOOKING]", bookingId, message, error);

    return { success: false, error: message };
  } finally {
    dispatch(setLoading(false));
  }
};

/**
 * Cancel booking
 * cancelType can be "normal" or "no-show"
 */
export const cancelBooking =
  (id, cancelType = "normal") =>
  async (dispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearMessages());

      await cancelBookingApi(id, cancelType);

      // Update UI immediately before refetch
      dispatch(markBookingCancelled(id));

      const refreshResult = await refreshBookingsAfterAction(dispatch);

      if (!refreshResult?.success) {
        handleRefreshWarning(
          dispatch,
          "Booking cancelled successfully, but failed to refresh bookings.",
          `[BOOKING_CANCELLED_REFRESH_FAILED] ${id} ${refreshResult?.error || ""}`
        );

        return {
          success: true,
          warning: refreshResult?.error,
        };
      }

      dispatch(setSuccessMessage("Booking cancelled successfully."));
      console.log("[BOOKING_CANCELLED]", id, cancelType);

      return { success: true };
    } catch (error) {
      const message = getErrorMessage(error, "Failed to cancel booking");

      dispatch(setError(message));
      console.error(
        "[API_ERROR][CANCEL_BOOKING]",
        id,
        cancelType,
        message,
        error
      );

      return { success: false, error: message };
    } finally {
      dispatch(setLoading(false));
    }
  };

/**
 * Delete booking permanently
 */
export const deleteBooking = (bookingId) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    dispatch(clearMessages());

    await deleteBookingApi(bookingId);
    const refreshResult = await refreshBookingsAfterAction(dispatch);

    if (!refreshResult?.success) {
      handleRefreshWarning(
        dispatch,
        "Booking deleted successfully, but failed to refresh bookings.",
        `[BOOKING_DELETED_REFRESH_FAILED] ${bookingId} ${refreshResult?.error || ""}`
      );

      return {
        success: true,
        warning: refreshResult?.error,
      };
    }

    dispatch(setSuccessMessage("Booking deleted successfully."));
    console.log("[BOOKING_DELETED]", bookingId);

    return { success: true };
  } catch (error) {
    const message = getErrorMessage(error, "Failed to delete booking");

    dispatch(setError(message));
    console.error("[API_ERROR][DELETE_BOOKING]", bookingId, message, error);

    return { success: false, error: message };
  } finally {
    dispatch(setLoading(false));
  }
};