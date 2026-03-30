import {
  getRowIndex,
  getDurationMinutes,
  getStartDateTime,
  START_HOUR,
  TOTAL_SLOTS,
} from "../../utils/bookingTime";
import { getTherapistInfo } from "../../utils/bookingMapper";

// Layout constants
export const TIME_COL_WIDTH = 58;
export const BASE_COLUMN_WIDTH = 108;
export const NAV_HEIGHT = 56;
export const TOOLBAR_HEIGHT = 48;
export const HEADER_HEIGHT = 56;

const FEMALE_COLOR = "#EC4899";
const MALE_COLOR = "#3B82F6";

// Normalize booking status for filter logic
export const normalizeStatus = (booking) => {
  const raw =
    booking?.booking_status ??
    booking?.status ??
    booking?.booking_item_status ??
    booking?.item_status ??
    booking?.booking_status_name ??
    booking?.status_name ??
    "";

  if (raw === 1 || raw === "1") return "confirmed";
  if (raw === 2 || raw === "2") return "checkin";
  if (raw === 3 || raw === "3") return "cancelled";

  const value = String(raw || "").toLowerCase().trim();

  if (["confirmed", "confirm"].includes(value)) return "confirmed";

  if (
    ["checkin", "check-in", "in-progress", "in progress", "completed"].includes(
      value
    )
  ) {
    return "checkin";
  }

  if (
    ["cancelled", "canceled", "no-show", "noshow", "cancel", "no show"].includes(
      value
    )
  ) {
    return "cancelled";
  }

  return "confirmed";
};

// Normalize gender
export const getGenderValue = (gender) => {
  const value = String(gender || "").toLowerCase().trim();

  if (["female", "f", "woman"].includes(value)) return "female";
  if (["male", "m", "man"].includes(value)) return "male";

  return "";
};

// Gender badge styles
export const getTherapistLabelClasses = (gender) => {
  const value = getGenderValue(gender);

  if (value === "female") {
    return {
      dot: FEMALE_COLOR,
      text: "text-pink-600",
      bg: "bg-pink-100",
      border: "border-pink-200",
    };
  }

  if (value === "male") {
    return {
      dot: MALE_COLOR,
      text: "text-blue-600",
      bg: "bg-blue-100",
      border: "border-blue-200",
    };
  }

  return {
    dot: "#94A3B8",
    text: "text-slate-500",
    bg: "bg-slate-100",
    border: "border-slate-200",
  };
};

// Convert slot index to HH:MM
export const getSlotTimeValue = (index) => {
  const hour = Math.floor(index / 4) + START_HOUR;
  const minutes = (index % 4) * 15;

  return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

// Convert YYYY-MM-DD + time to DD-MM-YYYY HH:MM:SS
export const formatServiceAt = (date, time) => {
  const [year, month, day] = date.split("-");
  const safeTime = String(time || "").length === 5 ? `${time}:00` : time;

  return `${day}-${month}-${year} ${safeTime}`;
};

// Normalize booking source for API payload
export const normalizeSource = (value) => {
  const source = String(value || "").toLowerCase().trim();

  if (source.includes("walk")) return "Walk-in";
  if (source.includes("phone")) return "By Phone";

  return "WhatsApp";
};

// Convert YYYY-MM-DD to DD-MM-YYYY
export const formatDateDDMMYYYY = (date) => {
  const [year, month, day] = date.split("-");
  return `${day}-${month}-${year}`;
};

// Calculate end time from start time + duration
export const calculateEndTime = (startTime, duration) => {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + Number(duration);

  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;

  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(
    2,
    "0"
  )}`;
};

// Stable booking key
export const getBookingKey = (booking) =>
  String(booking?.booking_item_id || booking?.id || booking?.booking_id || "");

// Flatten nested booking response into booking rows
export const flattenBookings = (sourceBookings) => {
  const output = [];

  sourceBookings.forEach((booking) => {
    if (!booking) return;

    const parentStatus =
      booking?.status ??
      booking?.booking_status ??
      booking?.status_name ??
      booking?.booking_status_name ??
      "";

    // Already flat
    if (booking?.service || booking?.service_at || booking?.start_time) {
      output.push({
        ...booking,
        fullBooking: booking,
        status: parentStatus,
        booking_status: parentStatus,
        status_name: String(parentStatus || ""),
        booking_status_name: String(parentStatus || ""),
      });
      return;
    }

    // booking_item grouped object
    if (
      booking?.booking_item &&
      typeof booking.booking_item === "object" &&
      !Array.isArray(booking.booking_item) &&
      Object.keys(booking.booking_item).length > 0
    ) {
      Object.entries(booking.booking_item).forEach(([groupKey, items]) => {
        if (!Array.isArray(items)) return;

        items.forEach((item, childIndex) => {
          output.push({
            ...booking,
            ...item,
            fullBooking: booking,
            booking_id: booking?.id || booking?.booking_id || item?.booking_id || "",
            booking_item_id: item?.id || booking?.booking_item_id || "",
            status: parentStatus,
            booking_status: parentStatus,
            status_name: String(parentStatus || ""),
            booking_status_name: String(parentStatus || ""),
            booking_item_status: item?.status ?? "",
            item_status: item?.status ?? "",
            booking_payment_status_id: booking?.payment_status_id,
            room_item_label:
              item?.room_segments?.[0]?.item_name ||
              item?.room_segments?.[0]?.label ||
              item?.room_segments?.[0]?.item_type ||
              booking?.room_item_label ||
              "",
            room_id:
              item?.room_segments?.[0]?.room_id ||
              item?.room_id ||
              booking?.room_id ||
              "",
            therapist_id:
              item?.therapist_id ||
              item?.therapist ||
              booking?.therapist_id ||
              "",
            service_id:
              item?.service_id || item?.service || booking?.service_id || "",
            _groupKey: groupKey,
            _childIndex: childIndex,
          });
        });
      });
      return;
    }

    // Fallback
    output.push({
      ...booking,
      fullBooking: booking,
      booking_id: booking?.id || booking?.booking_id || "",
      booking_item_id: booking?.booking_item_id || booking?.id || "",
      status: parentStatus,
      booking_status: parentStatus,
      status_name: String(parentStatus || ""),
      booking_status_name: String(parentStatus || ""),
    });
  });

  return output;
};

// Build therapist list
export const buildTherapists = (allTherapists, flatBookings) => {
  if (Array.isArray(allTherapists) && allTherapists.length > 0) {
    return allTherapists.map((therapist) => ({
      id: therapist.id || therapist.therapist_id,
      name:
        therapist.alias ||
        therapist.name ||
        `${therapist.firstname || ""} ${therapist.lastname || ""}`.trim() ||
        `Therapist #${therapist.id || therapist.therapist_id}`,
      gender: therapist.gender || "",
    }));
  }

  const therapistMap = new Map();

  flatBookings.forEach((booking) => {
    const therapist = getTherapistInfo(booking);
    if (!therapist?.id) return;

    if (!therapistMap.has(therapist.id)) {
      therapistMap.set(therapist.id, therapist);
    }
  });

  const fallbackTherapists = Array.from(therapistMap.values());

  if (fallbackTherapists.length === 0) {
    return [{ id: "unassigned", name: "Unassigned", gender: "" }];
  }

  return fallbackTherapists;
};

// Build left-side time labels
export const buildTimeSlots = () =>
  Array.from({ length: TOTAL_SLOTS }, (_, index) => {
    const hour = Math.floor(index / 4) + START_HOUR;
    const minutes = (index % 4) * 15;
    const hh = ((hour + 11) % 12) + 1;
    const ampm = hour >= 12 ? "PM" : "AM";

    return `${hh}:${String(minutes).padStart(2, "0")} ${ampm}`;
  });

// Build booking layout map used by the grid
export const buildBookingLayoutMap = (filteredBookings) => {
  const map = {};
  const occupied = {};

  filteredBookings.forEach((booking) => {
    const therapist = getTherapistInfo(booking);
    const therapistId = therapist?.id || therapist?.therapist_id;

    const start = getStartDateTime(booking);
    const startRow = getRowIndex(start);
    const slotSpan = Math.max(1, Math.ceil(getDurationMinutes(booking) / 15));
    const endRow = startRow + slotSpan - 1;

    if (!therapistId || startRow < 0 || startRow >= TOTAL_SLOTS || endRow < 0) {
      return;
    }

    if (!occupied[therapistId]) {
      occupied[therapistId] = {};
    }

    let hasConflict = false;

    for (let row = startRow; row <= endRow; row += 1) {
      if (occupied[therapistId][row]) {
        hasConflict = true;
        break;
      }
    }

    const bookingWithMeta = {
      ...booking,
      booking_status:
        booking?.booking_status ??
        booking?.status ??
        booking?.booking_item_status ??
        booking?.item_status ??
        booking?.booking_status_name ??
        booking?.status_name ??
        "",
      _slotSpan: slotSpan,
      _startRow: startRow,
      _endRow: endRow,
      _hasConflict: hasConflict,
    };

    if (!hasConflict) {
      for (let row = startRow; row <= endRow; row += 1) {
        occupied[therapistId][row] = true;
      }

      const key = `${startRow}-${therapistId}`;
      if (!map[key]) {
        map[key] = bookingWithMeta;
      }
    } else {
      const conflictKey = `${startRow}-${therapistId}-conflict`;
      if (!map[conflictKey]) {
        map[conflictKey] = [];
      }
      map[conflictKey].push(bookingWithMeta);
    }
  });

  return map;
};