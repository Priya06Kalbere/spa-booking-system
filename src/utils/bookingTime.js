/**
 * Calendar configuration
 */
export const START_HOUR = 9;     // Calendar starts at 9 AM
export const TOTAL_SLOTS = 40;   // Total 15-min slots (10 hours)
export const ROW_HEIGHT = 44;    // Height per slot (px)

/**
 * Convert a Date object to calendar row index (15-min slots)
 */
export const getRowIndex = (dateObj) => {
  if (!dateObj || Number.isNaN(dateObj.getTime())) return -1;

  const hoursFromStart = dateObj.getHours() - START_HOUR;
  const minutes = dateObj.getMinutes();

  return hoursFromStart * 4 + minutes / 15;
};

/**
 * Get booking duration in minutes (fallback to 60 if invalid)
 */
export const getDurationMinutes = (booking = {}) => {
  const value = Number(booking?.duration || booking?.totalDuration || 60);

  return Number.isFinite(value) && value > 0 ? value : 60;
};

/**
 * Get booking start datetime from different API formats
 */
export const getStartDateTime = (booking = {}) => {
  // Case 1: full datetime (preferred)
  if (booking?.service_at) {
    return new Date(String(booking.service_at).replace(" ", "T"));
  }

  // Case 2: separate date + time (DD-MM-YYYY format)
  if (booking?.service_date && booking?.service_time) {
    const [day, month, year] = booking.service_date.split("-");
    return new Date(`${year}-${month}-${day}T${booking.service_time}`);
  }

  // Case 3: only time → assume today
  if (booking?.start_time) {
    const today = new Date().toISOString().split("T")[0];
    return new Date(`${today}T${booking.start_time}`);
  }

  // Invalid / missing data
  return null;
};