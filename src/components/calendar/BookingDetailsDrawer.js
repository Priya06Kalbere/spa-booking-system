import React, { useEffect, useMemo, useState } from "react";
import CreateBookingForm from "../booking/CreateBookingForm";

const FEMALE_COLOR = "#EC4899";
const MALE_COLOR = "#3B82F6";

// ========================================
// Status helpers
// ========================================

// Normalize status value from number/string into UI-friendly status
const normalizeStatus = (status) => {
  if (status === 1 || status === "1") return "confirmed";
  if (status === 2 || status === "2") return "checkin";
  if (status === 3 || status === "3") return "cancelled";

  const value = String(status || "").toLowerCase().trim();

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

// Return badge classes for each status
const getStatusBadge = (status) => {
  const value = normalizeStatus(status);

  if (value === "confirmed") return "bg-blue-100 text-blue-700";
  if (value === "checkin") return "bg-pink-100 text-pink-700";
  if (value === "cancelled") return "bg-slate-200 text-slate-600";

  return "bg-blue-100 text-blue-700";
};

// Return display label for each status
const getStatusLabel = (status) => {
  const value = normalizeStatus(status);

  if (value === "confirmed") return "Confirmed";
  if (value === "checkin") return "Check-in";
  if (value === "cancelled") return "Cancelled";

  return "Confirmed";
};

// ========================================
// Therapist helpers
// ========================================

// Return badge styles based on therapist gender
const getTherapistLabelClasses = (gender) => {
  const value = String(gender || "").toLowerCase().trim();

  if (value === "female") {
    return {
      dot: FEMALE_COLOR,
      text: "text-pink-600",
      bg: "bg-pink-50",
      border: "border-pink-200",
    };
  }

  if (value === "male") {
    return {
      dot: MALE_COLOR,
      text: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
    };
  }

  return {
    dot: "#94A3B8",
    text: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-200",
  };
};

// Reusable UI block
const InfoCard = ({ label, children }) => {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">
        {children || "-"}
      </div>
    </div>
  );
};

// ========================================
// Booking normalization helpers
// ========================================

// Convert different date formats into YYYY-MM-DD for form input
const formatDateForInput = (value) => {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  if (/^\d{2}-\d{2}-\d{4}/.test(value)) {
    const [day, month, year] = value.split(" ")[0].split("-");
    return `${year}-${month}-${day}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().split("T")[0];
};

// Extract HH:MM time from booking object
const extractTime = (booking) => {
  if (booking?.start_time) return String(booking.start_time).slice(0, 5);

  if (booking?.service_at) {
    const raw = String(booking.service_at);
    const parts = raw.split(" ");
    if (parts[1]) return parts[1].slice(0, 5);
  }

  return "";
};

// Normalize booking data into CreateBookingForm format
const normalizeBookingForForm = (booking, therapistInfo) => {
  const bookingItem =
    booking?.booking_item?.check?.[0] ||
    booking?.booking_item?.Auto_Assignment?.[0] ||
    booking?.booking_item?.auto_assignment?.[0] ||
    booking?.booking_item?.[0] ||
    booking?.booking_item ||
    booking;

  const firstRoomSegment =
    bookingItem?.room_segments?.[0] || booking?.room_segments?.[0] || null;

  return {
    booking_id: booking?.booking_id || booking?.id || "",
    booking_item_id:
      bookingItem?.id || booking?.booking_item_id || booking?.id || "",
    customer: booking?.user?.id || booking?.customer_id || booking?.customer || "",
    customer_name:
      booking?.customer_name ||
      bookingItem?.customer_name ||
      booking?.user?.name ||
      "",
    customer_lastname: booking?.customer_lastname || "",
    customer_email: booking?.customer_email || "",
    mobile_number: booking?.mobile_number || "",
    therapist:
      booking?.therapist_id ||
      bookingItem?.therapist_id ||
      therapistInfo?.id ||
      "",
    therapist_name:
      therapistInfo?.name || booking?.therapist || bookingItem?.therapist || "",
    service:
      booking?.service_id || bookingItem?.service_id || bookingItem?.service || "",
    room_id:
      firstRoomSegment?.room_id ||
      booking?.room_id ||
      bookingItem?.room_id ||
      "",
    room_item_type: firstRoomSegment?.item_type || "",
    room_item_label:
      firstRoomSegment?.item_name || firstRoomSegment?.label || "",
    service_date: formatDateForInput(
      booking?.service_date || bookingItem?.service_date || booking?.service_at
    ),
    start_time: booking?.start_time
      ? String(booking.start_time).slice(0, 5)
      : extractTime(booking),
    duration: Number(booking?.duration || bookingItem?.duration || 60),
    price: booking?.price || bookingItem?.price || "77.00",
    source: booking?.source || "WhatsApp",
    payment_type: booking?.payment_type || "payatstore",
    payment_status: booking?.payment_status || 1,
    note: booking?.note || booking?.users_notes || bookingItem?.note || "",
    company: booking?.company_id || booking?.company || 1,
    outlet: booking?.outlet_id || booking?.outlet || 1,
    outlet_type: booking?.outlet_type || 2,
    currency: booking?.currency || "SGD",
    booking_type: booking?.booking_type_id || booking?.booking_type || 1,
    membership: booking?.membership || 0,
    panel: booking?.panel || "outlet",
    type: booking?.type || "outlet",
    created_by: booking?.created_by || 229061,
    updated_by: booking?.updated_by || booking?.created_by || 229061,
  };
};

// Main component
const BookingDetailsDrawer = ({
  booking,
  onClose,
  onEdit,
  onCancel,
  onDelete,
  onCreate,
  loading,
  getClientName,
  getServiceName,
  getRoomName,
  getDisplayTime,
  getDurationMinutes,
  getTherapistInfo,
}) => {
  const [mode, setMode] = useState("view");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [actionType, setActionType] = useState("cancel-normal");

  // Reset internal UI state when booking changes
  useEffect(() => {
    if (!booking) return;

    setMode(booking?._isNew ? "create" : "view");
    setShowCancelModal(false);
    setActionType("cancel-normal");
  }, [booking?._isNew, booking?.id, booking?.booking_id, booking?.booking_item_id]);

  // Resolve therapist info for current booking
  const therapist = useMemo(
    () => getTherapistInfo?.(booking) || {},
    [booking, getTherapistInfo]
  );

  // Resolve therapist badge style
  const genderStyle = useMemo(
    () => getTherapistLabelClasses(therapist.gender),
    [therapist.gender]
  );

  // Build initial form data for create/edit modes
  const formInitialData = useMemo(() => {
    if (!booking) return null;
    if (booking?._isNew) return booking;

    return normalizeBookingForForm(booking, therapist);
  }, [booking, therapist]);

  // Resolve booking status from available fields
  const resolvedStatus =
    booking?.booking_status ??
    booking?.status ??
    booking?.booking_item_status ??
    booking?.item_status ??
    booking?.booking_status_name ??
    booking?.status_name ??
    "";

  if (!booking) return null;

  return (
    <>
      {/* Cancel / delete modal */}
      {showCancelModal && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/40"
            onClick={() => {
              if (!loading) setShowCancelModal(false);
            }}
          />

          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-slate-900">
                Cancel / Delete Booking
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Please select the cancellation type.
              </p>

              <div className="mt-5 space-y-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="radio"
                    name="bookingActionType"
                    value="cancel-normal"
                    checked={actionType === "cancel-normal"}
                    onChange={(e) => setActionType(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      Normal Cancellation
                    </div>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="radio"
                    name="bookingActionType"
                    value="cancel-no-show"
                    checked={actionType === "cancel-no-show"}
                    onChange={(e) => setActionType(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      No Show
                    </div>
                  </div>
                </label>

                <div className="border-t border-slate-200 pt-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="radio"
                      name="bookingActionType"
                      value="delete"
                      checked={actionType === "delete"}
                      onChange={(e) => setActionType(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        Just Delete It
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Permanently removes the booking record.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <div>
                  <strong>Client:</strong> {getClientName?.(booking)}
                </div>
                <div>
                  <strong>Service:</strong> {getServiceName?.(booking)}
                </div>
                <div>
                  <strong>Therapist:</strong> {therapist.name || "Unknown"}
                </div>
                <div>
                  <strong>Time:</strong> {getDisplayTime?.(booking)}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    const bookingId = booking?.booking_id || booking?.id;
                    const bookingItemId = booking?.booking_id || booking?.id;

                    if (!bookingItemId) {
                      console.error("Missing booking_item_id", booking);
                      return;
                    }

                    let result;

                    if (actionType === "delete") {
                      result = await onDelete?.(bookingId);
                    } else if (actionType === "cancel-no-show") {
                      result = await onCancel?.(bookingItemId, "no-show");
                    } else {
                      result = await onCancel?.(bookingItemId, "normal");
                    }

                    if (result?.success) {
                      setShowCancelModal(false);
                    } else {
                      console.error(result?.error);
                    }
                  }}
                  className="flex-1 rounded-xl bg-amber-900 px-4 py-3 text-sm font-medium text-white hover:bg-amber-950 disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Next"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Drawer overlay */}
      <div className="absolute inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Right drawer */}
      <div className="absolute right-0 top-0 z-50 h-full w-[360px] overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl">
        {(mode === "create" || mode === "edit") && (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {mode === "edit" ? "Update Booking" : "Create Booking"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {mode === "edit"
                    ? "Edit booking details"
                    : "Add a new booking"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (mode === "edit") setMode("view");
                  else onClose();
                }}
                className="rounded-lg px-3 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                {mode === "edit" ? "Back" : "Close"}
              </button>
            </div>

            <div className="mt-5">
              <CreateBookingForm
                initialData={formInitialData}
                onSubmit={async (data) => {
                  let result;

                  if (mode === "edit") {
                    result = await onEdit?.({
                      ...data,
                      booking_id: formInitialData?.booking_id || booking?.id,
                      booking_item_id:
                        formInitialData?.booking_item_id ||
                        booking?.booking_item_id ||
                        booking?.id,
                    });
                  } else {
                    result = await onCreate?.(data);
                  }

                  return result;
                }}
                onClose={onClose}
                loading={loading}
              />
            </div>
          </>
        )}

        {mode === "view" && (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Booking Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  View and manage booking information
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <InfoCard label="Client">{getClientName?.(booking)}</InfoCard>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="text-xs font-medium text-slate-500">
                  Therapist
                </div>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${genderStyle.bg} ${genderStyle.text} ${genderStyle.border}`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: genderStyle.dot }}
                    />
                    {therapist.name || "Unknown"}
                    {therapist.gender && (
                      <span className="opacity-80">
                        ({therapist.gender === "female" ? "Female" : "Male"})
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <InfoCard label="Service">{getServiceName?.(booking)}</InfoCard>
              <InfoCard label="Room">{getRoomName?.(booking)}</InfoCard>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="text-xs font-medium text-slate-500">Status</div>
                <div className="mt-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(
                      resolvedStatus
                    )}`}
                  >
                    {getStatusLabel(resolvedStatus)}
                  </span>
                </div>
              </div>

              {booking._hasConflict && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="text-xs font-medium text-red-600">
                    Conflict
                  </div>
                  <div className="mt-1 text-sm font-semibold text-red-700">
                    This booking overlaps with another booking for the same
                    therapist.
                  </div>
                </div>
              )}

              <InfoCard label="Time">{getDisplayTime?.(booking)}</InfoCard>

              <InfoCard label="Duration">
                {getDurationMinutes?.(booking)} min
              </InfoCard>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={
                    loading || normalizeStatus(resolvedStatus) === "cancelled"
                  }
                  onClick={() => setMode("edit")}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Edit
                </button>

                <button
                  type="button"
                  disabled={
                    loading || normalizeStatus(resolvedStatus) === "cancelled"
                  }
                  onClick={() => setShowCancelModal(true)}
                  className="flex-1 rounded-xl bg-red-100 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-200 disabled:opacity-50"
                >
                  Cancel / Delete
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default React.memo(BookingDetailsDrawer);