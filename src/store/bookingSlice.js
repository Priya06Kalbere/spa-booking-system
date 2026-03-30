import { createSlice } from "@reduxjs/toolkit";

/**
 * Apply cancelled status to a booking or booking item
 */
const applyCancelledStatus = (item) => {
  if (!item || typeof item !== "object") return item;

  return {
    ...item,
    status: 3,
    booking_status: 3,
    booking_item_status: 3,
    item_status: 3,
    status_name: "cancelled",
    booking_status_name: "cancelled",
  };
};

/**
 * Update booking items inside grouped booking_item object
 */
const updateBookingItems = (bookingItem, cancelledId, onMatch) => {
  if (!bookingItem || typeof bookingItem !== "object" || Array.isArray(bookingItem)) {
    return bookingItem;
  }

  return Object.fromEntries(
    Object.entries(bookingItem).map(([groupKey, items]) => {
      if (!Array.isArray(items)) {
        return [groupKey, items];
      }

      const updatedItems = items.map((item) => {
        const itemMatched =
          String(item?.id || "") === cancelledId ||
          String(item?.booking_item_id || "") === cancelledId;

        if (itemMatched) {
          onMatch();
          return applyCancelledStatus(item);
        }

        return item;
      });

      return [groupKey, updatedItems];
    })
  );
};

const initialState = {
  bookings: [],
  selectedBooking: null,
  loading: false,
  error: null,
  successMessage: null,
};

const bookingSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {
    /**
     * Set full booking list
     */
    setBookings: (state, action) => {
      state.bookings = action.payload;
    },

    /**
     * Add new booking at the top
     */
    addBooking: (state, action) => {
      state.bookings.unshift(action.payload);
    },

    /**
     * Set loading state
     */
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    /**
     * Set error message and clear success message
     */
    setError: (state, action) => {
      state.error = action.payload;

      if (action.payload) {
        state.successMessage = null;
      }
    },

    /**
     * Set success message and clear error
     */
    setSuccessMessage: (state, action) => {
      state.successMessage = action.payload;

      if (action.payload) {
        state.error = null;
      }
    },

    /**
     * Clear both success and error messages
     */
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },

    /**
     * Mark a booking or booking item as cancelled
     */
    markBookingCancelled: (state, action) => {
      const cancelledId = String(action.payload);

      state.bookings = (state.bookings || []).map((booking) => {
        if (!booking || typeof booking !== "object") return booking;

        let bookingMatched = false;

        // Check if top-level booking matches
        const topLevelMatch =
          String(booking?.booking_item_id || "") === cancelledId ||
          String(booking?.id || "") === cancelledId;

        // Update nested booking items
        const updatedBookingItem = updateBookingItems(
          booking?.booking_item,
          cancelledId,
          () => {
            bookingMatched = true;
          }
        );

        // If booking or any nested item matched, mark booking as cancelled too
        if (topLevelMatch || bookingMatched) {
          return {
            ...applyCancelledStatus(booking),
            booking_item: updatedBookingItem,
          };
        }

        // Otherwise only return updated nested items
        return {
          ...booking,
          booking_item: updatedBookingItem,
        };
      });
    },
  },
});

export const {
  setBookings,
  addBooking,
  setLoading,
  setError,
  setSuccessMessage,
  clearMessages,
  markBookingCancelled,
} = bookingSlice.actions;

export default bookingSlice.reducer;