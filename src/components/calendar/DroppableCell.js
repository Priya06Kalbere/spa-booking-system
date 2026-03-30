import React from "react";
import { useDroppable } from "@dnd-kit/core";
import BookingCard from "./BookingCard";
import { ROW_HEIGHT } from "../../utils/bookingTime";
import { getSlotTimeValue } from "./calendarHelpers";
import {
  getClientName,
  getServiceName,
  getRoomName,
} from "../../utils/bookingMapper";

// Single calendar grid cell
const DroppableCell = ({
  therapist,
  index,
  booking,
  conflicts,
  columnWidth,
  locallyCancelledIds,
  setSelectedBooking,
  currentDate,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${therapist.id}-${index}`,
    data: {
      therapistId: therapist.id,
      startTime: getSlotTimeValue(index),
      serviceDate: currentDate,
    },
  });

  const handleEmptyCellClick = () => {
    if (booking) return;

    setSelectedBooking({
      _isNew: true,
      company: 1,
      outlet: 1,
      outlet_type: 2,
      currency: "SGD",
      panel: "outlet",
      type: "manual",
      booking_type: 1,
      membership: 0,
      payment_status: 1,
      created_by: 229061,
      updated_by: 229061,
      therapist_id: therapist.id,
      therapist: therapist.id,
      therapist_name: therapist.name,
      start_time: getSlotTimeValue(index),
      service_date: currentDate,
      duration: 60,
      customer: 980,
      customer_name: "",
      customer_lastname: "",
      customer_email: "",
      mobile_number: "",
      service: "",
      service_id: "",
      room_id: "",
      room_item_type: "",
      room_item_label: "",
      price: "77.00",
      source: "WhatsApp",
      payment_type: "payatstore",
      note: "",
    });
  };

  return (
    <div
      ref={setNodeRef}
      className={`relative border-r border-b border-[#ece7e1] transition-colors ${
        isOver ? "bg-blue-50" : "hover:bg-[#f5f1eb]"
      }`}
      style={{
        width: columnWidth,
        minWidth: columnWidth,
        height: ROW_HEIGHT,
        boxSizing: "border-box",
      }}
      onClick={handleEmptyCellClick}
    >
      {booking && (
        <BookingCard
          booking={{
            ...booking,
            _forcedCancelled:
              locallyCancelledIds[String(booking?.booking_item_id || booking?.id)] ||
              false,
          }}
          rowHeight={ROW_HEIGHT}
          getClientName={getClientName}
          getServiceName={getServiceName}
          getRoomName={getRoomName}
          onClick={setSelectedBooking}
        />
      )}

      {conflicts.length > 0 && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setSelectedBooking(conflicts[0]);
          }}
          className="absolute bottom-1 right-1 z-30 rounded border border-red-300 bg-red-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-red-700"
          style={{ lineHeight: 1.2 }}
        >
          ⚠ {conflicts.length}
        </button>
      )}
    </div>
  );
};

export default React.memo(DroppableCell);