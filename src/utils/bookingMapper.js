/**
 * Get client name from different possible fields
 */
export const getClientName = (b = {}) => {
  return (
    b?.customer_name ||
    b?.client_name ||
    b?.customer?.name ||
    b?.user?.name ||
    `${b?.guest_first_name || ""} ${b?.guest_last_name || ""}`.trim() ||
    b?.name ||
    "Client"
  );
};

/**
 * Get service name
 */
export const getServiceName = (b = {}) => {
  return b?.service_name || b?.service_label || b?.service || "Service";
};

/**
 * Extract first booking item safely from different API shapes
 */
const getBookingItem = (booking = {}) => {
  return (
    booking?.booking_item?.check?.[0] ||
    booking?.booking_item?.Auto_Assignment?.[0] ||
    booking?.booking_item?.auto_assignment?.[0] ||
    booking?.booking_item?.[0] ||
    booking?.booking_item ||
    booking
  );
};

/**
 * Get room name from booking
 */
export const getRoomName = (booking = {}) => {
  const bookingItem = getBookingItem(booking);

  return (
    bookingItem?.room_items?.[0]?.room_name || // highest priority
    bookingItem?.room_segments?.[0]?.item_type ||
    booking?.room_item_label ||
    bookingItem?.room_name ||
    booking?.room_name ||
    booking?.room_code ||
    "-"
  );
};

/**
 * Normalize gender value into "male" / "female"
 */
export const getGenderValue = (gender) => {
  const value = String(gender || "").toLowerCase().trim();

  if (["female", "f", "woman"].includes(value)) return "female";
  if (["male", "m", "man"].includes(value)) return "male";

  return "";
};

/**
 * Get therapist details (id, name, gender)
 */
export const getTherapistInfo = (b = {}) => {
  const gender = getGenderValue(
    b?.gender ||
      b?.therapist_gender ||
      b?.user?.gender ||
      b?.therapist_details?.gender
  );

  return {
    id: String(b?.therapist_id || b?.therapist || "unassigned"),
    name:
      b?.therapist_name ||
      b?.therapist_alias ||
      b?.therapist ||
      "Unassigned",
    gender,
  };
};