import React from "react";
import { useDraggable } from "@dnd-kit/core";

/**
 * Normalize booking status from API.
 * Parent booking.status is the most reliable field in your response.
 */
const normalizeStatus = (booking) => {
  const raw =
    booking?.status ??
    booking?.booking_status ??
    booking?.status_name ??
    booking?.booking_status_name ??
    booking?.fullBooking?.status ??
    booking?.fullBooking?.booking_status ??
    booking?.booking_item_status ??
    booking?.item_status ??
    "";

  // Numeric fallback
  if (raw === 1 || raw === "1") return "confirmed";
  if (raw === 2 || raw === "2") return "checkin";
  if (raw === 3 || raw === "3") return "cancelled";

  const value = String(raw || "").toLowerCase().trim();

  // Cancelled / no-show
  if (
    value.includes("cancelled") ||
    value.includes("canceled") ||
    value.includes("no-show") ||
    value.includes("noshow") ||
    value.includes("no show") ||
    value === "cancel"
  ) {
    return "cancelled";
  }

  // Check-in / in progress / completed
  if (
    value.includes("checkin") ||
    value.includes("Check-in") ||
    value.includes("in progress") ||
    value.includes("in-progress") ||
    value.includes("completed")
  ) {
    return "checkin";
  }

  // Confirmed
  if (value.includes("confirmed") || value === "confirm") {
    return "confirmed";
  }

  return "confirmed";
};

/**
 * Card color by normalized status
 */
const getCardStyle = (status) => {
  if (status === "confirmed") {
    return {
      bg: "#d9eff7",
      border: "#9ed0e2",
      accent: "#5aa9c8",
    };
  }

  if (status === "checkin") {
    return {
      bg: "#f4dce2",
      border: "#dfb3c0",
      accent: "#d07a94",
    };
  }

  return {
    bg: "#ece7e1",
    border: "#d7cfc5",
    accent: "#a19385",
  };
};

/**
 * Show booking start time
 */
const getTimeText = (booking) => {
  if (booking?.start_time) {
    return String(booking.start_time).slice(0, 5);
  }

  if (booking?.service_at) {
    const parts = String(booking.service_at).split(" ");
    return parts[1] ? parts[1].slice(0, 5) : booking.service_at;
  }

  return "";
};

const BookingCard = ({
  booking,
  rowHeight,
  getClientName,
  getServiceName,
  getRoomName,
  onClick,
}) => {
  const status = normalizeStatus(booking);
  const cardStyle = getCardStyle(status);
  const height = Math.max(36, (booking?._slotSpan || 1) * rowHeight - 6);

  const isCancelled =
    status === "cancelled" || booking?._forcedCancelled === true;

  const draggableId = `booking-${booking?.booking_item_id || booking?.id}`;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: draggableId,
    disabled: isCancelled,
    data: {
      booking,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className="absolute left-[3px] right-[3px] top-[3px] z-10"
      style={{
        height,
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        zIndex: isDragging ? 999 : 10,
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(booking);
        }}
        className="relative h-full w-full overflow-hidden rounded-sm border text-left shadow-[0_1px_1px_rgba(0,0,0,0.04)]"
        style={{
          backgroundColor: cardStyle.bg,
          borderColor: cardStyle.border,
          opacity: isDragging ? 0.6 : isCancelled ? 0.7 : 1,
          cursor: "default",
        }}
      >
        <div
          className="absolute left-0 top-0 h-full w-[3px]"
          style={{ backgroundColor: cardStyle.accent }}
        />
        {/* Draggble part UI */}
        {!isCancelled && (
          <div
            {...listeners}
            {...attributes}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-1 top-1 z-20 cursor-grab rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[8px] text-slate-500 active:cursor-grabbing"
            title="Drag booking"
          >
            ⋮⋮
          </div>
        )}

        <div className="pl-[8px] pr-[24px] pt-[4px] text-[9px] leading-[1.25] text-[#3f3a35]">
          <div className="truncate font-semibold text-[#2f2b27]">
            {getClientName?.(booking) || booking?.customer_name || "-"}
          </div>

          <div className="mt-[2px] truncate text-[#605952]">
            {getServiceName?.(booking) || booking?.service || booking?.title || "-"}
          </div>

          <div className="mt-[2px] truncate text-[#756d65]">
            {getTimeText(booking)}
          </div>

          <div className="mt-[2px] truncate text-[#7e746a]">
            {getRoomName?.(booking) || booking?.room_name || "-"}
          </div>

          <div className="mt-[4px] flex items-center gap-[3px]">
            <span className="h-[7px] w-[7px] rounded-full bg-[#67b26f]" />
            <span className="h-[7px] w-[7px] rounded-full bg-[#d19c59]" />
            <span className="h-[7px] w-[7px] rounded-full bg-[#7aa7de]" />
            <span className="h-[7px] w-[7px] rounded-full bg-[#c68599]" />
          </div>
        </div>
      </button>
    </div>
  );
};

export default React.memo(BookingCard);