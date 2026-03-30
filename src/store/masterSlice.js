import { createSlice } from "@reduxjs/toolkit";

/**
 * Ensure payload is always an array
 */
const getSafeArray = (payload) => {
  return Array.isArray(payload) ? payload : [];
};

const initialState = {
  // Services
  services: [],
  servicesLoading: false,
  servicesError: null,

  // Therapists (slot-based)
  therapists: [],
  therapistsLoading: false,
  therapistsError: null,

  // All therapists (calendar board)
  allTherapists: [],
  allTherapistsLoading: false,
  allTherapistsError: null,

  // Rooms
  rooms: [],
  roomsLoading: false,
  roomsError: null,
};

const masterSlice = createSlice({
  name: "master",
  initialState,
  reducers: {
    /**
     * SERVICES
     */
    setServices: (state, action) => {
      state.services = getSafeArray(action.payload);
    },
    setServicesLoading: (state, action) => {
      state.servicesLoading = action.payload;
    },
    setServicesError: (state, action) => {
      state.servicesError = action.payload;
    },

    /**
     * THERAPISTS (for drawer / slot selection)
     */
    setTherapists: (state, action) => {
      state.therapists = getSafeArray(action.payload);
    },
    setTherapistsLoading: (state, action) => {
      state.therapistsLoading = action.payload;
    },
    setTherapistsError: (state, action) => {
      state.therapistsError = action.payload;
    },

    /**
     * ALL THERAPISTS (for calendar board)
     */
    setAllTherapists: (state, action) => {
      state.allTherapists = getSafeArray(action.payload);
    },
    setAllTherapistsLoading: (state, action) => {
      state.allTherapistsLoading = action.payload;
    },
    setAllTherapistsError: (state, action) => {
      state.allTherapistsError = action.payload;
    },

    /**
     * ROOMS
     */
    setRooms: (state, action) => {
      state.rooms = getSafeArray(action.payload);
    },
    setRoomsLoading: (state, action) => {
      state.roomsLoading = action.payload;
    },
    setRoomsError: (state, action) => {
      state.roomsError = action.payload;
    },
  },
});

/**
 * Export actions
 */
export const {
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
} = masterSlice.actions;

/**
 * Export reducer
 */
export default masterSlice.reducer;