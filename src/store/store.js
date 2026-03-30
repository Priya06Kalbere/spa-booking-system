import { configureStore } from "@reduxjs/toolkit";
import bookingReducer from "./bookingSlice";
import masterReducer from "./masterSlice";

/**
 * Configure Redux store
 * Combines all slice reducers into a single store
 */
export const store = configureStore({
  reducer: {
    // Booking-related state (create, update, cancel, delete, list)
    bookings: bookingReducer,

    // Master data (services, therapists, rooms)
    master: masterReducer,
  },
});

/**
 * Optional (recommended):
 * Export types/helpers if using with hooks
 */
// export const RootState = store.getState;
// export const AppDispatch = store.dispatch;