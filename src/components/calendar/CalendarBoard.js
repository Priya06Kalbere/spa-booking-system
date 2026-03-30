import React, { useEffect, useMemo, useRef, useState } from "react";
import { DndContext } from "@dnd-kit/core";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBookings,
  createBooking,
  updateBooking,
  cancelBooking,
  deleteBooking,
} from "../../store/bookingActions";
import { fetchAllTherapists } from "../../store/masterDataActions";

import BookingDetailsDrawer from "./BookingDetailsDrawer";
import DroppableCell from "./DroppableCell";

import {
  getDurationMinutes,
  ROW_HEIGHT,
  TOTAL_SLOTS,
} from "../../utils/bookingTime";

import {
  getClientName,
  getServiceName,
  getRoomName,
  getTherapistInfo,
} from "../../utils/bookingMapper";

import {
  flattenBookings,
  buildTherapists,
  buildTimeSlots,
  buildBookingLayoutMap,
  normalizeStatus,
  formatServiceAt,
  normalizeSource,
  formatDateDDMMYYYY,
  calculateEndTime,
  getBookingKey,
  getTherapistLabelClasses,
  TIME_COL_WIDTH,
  NAV_HEIGHT,
  TOOLBAR_HEIGHT,
  HEADER_HEIGHT,
} from "./calendarHelpers";

import {
  getCalendarDimensions,
  getVisibleWindow,
} from "./calendarLayout";

const CalendarBoard = () => {
  const dispatch = useDispatch();

  // Redux state
  const bookings = useSelector((state) => state.bookings?.bookings);
  const loading = useSelector((state) => state.bookings?.loading);
  const allTherapists = useSelector((state) => state.master?.allTherapists || []);

  // Local state
  const [locallyCancelledIds, setLocallyCancelledIds] = useState({});
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [boardWidth, setBoardWidth] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [optimisticMoves, setOptimisticMoves] = useState({});

  // DOM refs
  const shellRef = useRef(null);
  const headerScrollRef = useRef(null);
  const bodyScrollRef = useRef(null);

  // Current date
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const today = new Date();
  const currentDate = today.toISOString().split("T")[0];

  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  // Load booking list
  useEffect(() => {
    dispatch(fetchBookings());
  }, [dispatch]);

  // Track board width for responsive column sizing
  useEffect(() => {
    const node = shellRef.current;
    if (!node) return;

    const updateWidth = () => {
      setBoardWidth(node.clientWidth || 0);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  // Load all therapists
  useEffect(() => {
    dispatch(
      fetchAllTherapists({
        outlet: 1,
        outlet_type: 2,
      })
    );
  }, [dispatch]);

  // Update existing booking
  const handleUpdateBooking = async (formValues) => {
    const startTime =
      String(formValues.start_time || "").length >= 5
        ? String(formValues.start_time).slice(0, 5)
        : formValues.start_time;

    const duration = Number(formValues.duration || 60);
    const endTime = calculateEndTime(startTime, duration);
    const formattedUpdateDate = formatDateDDMMYYYY(formValues.service_date);
    const resolvedService = Number(formValues.service_id || formValues.service || 0);

    const payload = {
      company: Number(formValues.company || 1),
      outlet: 1,
      items: [
        {
          id: Number(formValues.booking_item_id),
          service: resolvedService,
          customer_name: formValues.customer_name || "",
          start_time: startTime,
          end_time: endTime,
          duration,
          therapist: Number(formValues.therapist || formValues.therapist_id),
          room_segments: [
            {
              room_id: Number(formValues.room_id),
              item_type:
                formValues.room_item_type ||
                formValues.room_item_label ||
                "single-bed",
              meta_service: null,
              start_time: startTime,
              end_time: endTime,
              service: resolvedService,
              duration,
              priority: 1,
            },
          ],
          requested_person: Number(formValues.requested_person || 0),
          requested_room: Number(formValues.requested_room || 0),
          isMemberRateApplied: Boolean(formValues.isMemberRateApplied || false),
          isMembershipApplied: Boolean(formValues.isMembershipApplied || false),
          price: String(formValues.price || ""),
          quantity: "1",
          service_request: formValues.service_request || "",
          commission: {
            tier: null,
            title: null,
            rate: "0.00",
          },
          primary: 1,
          item_number: 1,
          parent_booking_item_id: null,
          cross_day_booking_item: null,
          start_date: formattedUpdateDate,
          end_date: formattedUpdateDate,
          is_calendar_expansion: 0,
          guest_checkin_id: null,
          guest_checkin_name: null,
        },
      ],
      currency: formValues.currency || "SGD",
      source: normalizeSource(formValues.source),
      payment_type: formValues.payment_type || "payatstore",
      payment_status: Number(formValues.payment_status || 1),
      service_at: formatServiceAt(formValues.service_date, startTime),
      customer: Number(formValues.customer || 980),
      customer_name: formValues.customer_name || "",
      customer_lastname: formValues.customer_lastname || "",
      customer_email: formValues.customer_email || "",
      mobile_number: formValues.mobile_number || "",
      panel: "outlet",
      updated_by: Number(formValues.updated_by || 229061),
      booking_type: Number(formValues.booking_type || 1),
      membership: Number(formValues.membership || 0),
      note: formValues.note || "",
    };

    const result = await dispatch(updateBooking(formValues.booking_id, payload));

    if (result?.success) {
      setSelectedBooking(null);
    } else {
      console.error(result?.error);
    }

    return result;
  };

  // Create or update from drawer
  const handleCreateOrUpdate = async (formValues) => {
    const startTime = formValues.start_time;
    const duration = Number(formValues.duration);
    const endTime = calculateEndTime(startTime, duration);
    const formattedCreateDate = formatDateDDMMYYYY(formValues.service_date);

    let result;

    if (formValues.booking_id) {
      const resolvedService = Number(formValues.service_id || formValues.service || 0);

      const updatePayload = {
        company: Number(formValues.company || 1),
        outlet: 1,
        currency: formValues.currency || "SGD",
        source: normalizeSource(formValues.source),
        payment_type: formValues.payment_type || "payatstore",
        payment_status: Number(formValues.payment_status || 1),
        service_at: formatServiceAt(formValues.service_date, startTime),
        customer: Number(formValues.customer || 980),
        customer_name: formValues.customer_name || "",
        customer_lastname: formValues.customer_lastname || "",
        customer_email: formValues.customer_email || "",
        mobile_number: formValues.mobile_number || "",
        panel: "outlet",
        updated_by: Number(formValues.updated_by || 229061),
        booking_type: Number(formValues.booking_type || 1),
        membership: Number(formValues.membership || 0),
        note: formValues.note || "",
        items: [
          {
            id: Number(formValues.booking_item_id),
            service: resolvedService,
            customer_name: formValues.customer_name || "",
            start_time: startTime,
            end_time: endTime,
            duration,
            therapist: Number(formValues.therapist || formValues.therapist_id),
            room_segments: [
              {
                room_id: Number(formValues.room_id),
                item_type:
                  formValues.room_item_type ||
                  formValues.room_item_label ||
                  "single-bed",
                meta_service: null,
                start_time: startTime,
                end_time: endTime,
                duration,
                priority: 1,
              },
            ],
            requested_person: 0,
            requested_room: 0,
            isMemberRateApplied: false,
            isMembershipApplied: false,
            price: String(formValues.price),
            quantity: "1",
            service_request: "",
            commission: {
              tier: null,
              title: null,
              rate: "0.00",
            },
            primary: 1,
            item_number: 1,
            parent_booking_item_id: null,
            cross_day_booking_item: null,
            start_date: formattedCreateDate,
            end_date: formattedCreateDate,
            is_calendar_expansion: 0,
            guest_checkin_id: null,
            guest_checkin_name: null,
          },
        ],
      };

      result = await dispatch(updateBooking(formValues.booking_id, updatePayload));
    } else {
      const createPayload = {
        company: Number(formValues.company || 1),
        outlet: 1,
        outlet_type: Number(formValues.outlet_type || 2),
        booking_type: Number(formValues.booking_type || 1),
        customer: Number(formValues.customer),
        created_by: Number(formValues.created_by || 229061),
        currency: formValues.currency || "SGD",
        source: normalizeSource(formValues.source),
        payment_type: formValues.payment_type || "payatstore",
        service_at: formatServiceAt(formValues.service_date, startTime),
        note: formValues.note || "",
        membership: Number(formValues.membership || 0),
        panel: "outlet",
        type: "manual",
        items: [
          {
            service: Number(formValues.service),
            room_id: Number(formValues.room_id),
            start_time: startTime,
            end_time: endTime,
            duration,
            therapist: Number(formValues.therapist),
            requested_person: 0,
            price: String(formValues.price),
            quantity: "1",
            service_request: "",
            commission: null,
            customer_name: formValues.customer_name || "",
            primary: 1,
            item_number: 1,
            room_segments: [
              {
                room_id: Number(formValues.room_id),
                item_type:
                  formValues.room_item_type ||
                  formValues.room_item_label ||
                  "single-bed",
                meta_service: null,
                start_time: startTime,
                end_time: endTime,
                duration,
                priority: 1,
              },
            ],
          },
        ],
      };

      result = await dispatch(createBooking(createPayload));
    }

    if (result?.success) {
      setSelectedBooking(null);
    } else {
      console.error(result?.error);
    }

    return result;
  };

  // Cancel booking item
  const handleCancelBooking = async (bookingItemId, cancelType = "normal") => {
    const result = await dispatch(cancelBooking(bookingItemId, cancelType));

    if (result?.success) {
      setLocallyCancelledIds((prev) => ({
        ...prev,
        [String(bookingItemId)]: true,
      }));
    } else {
      console.error(result?.error);
    }

    return result;
  };

  // Delete booking
  const handleDeleteBooking = async (bookingId) => {
    const result = await dispatch(deleteBooking(bookingId));

    if (result?.success) {
      setSelectedBooking(null);
    } else {
      alert(result?.error || "Failed to cancel booking");
    }

    return result;
  };

  // Flat booking list with optimistic drag updates
  const flatBookings = useMemo(() => {
    const flattened = flattenBookings(safeBookings);
    const seen = new Set();

    return flattened
      .map((item) => {
        const key = getBookingKey(item);
        const optimistic = optimisticMoves[key];

        if (!optimistic) return item;

        return {
          ...item,
          ...optimistic,
        };
      })
      .filter((item) => {
        const key =
          item?.booking_item_id ||
          item?.id ||
          `${item?.booking_id}-${item?.therapist_id}-${item?.service_at}-${item?.customer_name}`;

        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [safeBookings, optimisticMoves]);

  // Search + status filtered bookings
  const filteredBookings = useMemo(() => {
    const term = search.trim().toLowerCase();

    return flatBookings.filter((booking) => {
      const therapist = getTherapistInfo(booking);
      const status = normalizeStatus(booking);

      const matchesSearch =
        !term ||
        [getClientName(booking), getServiceName(booking), therapist?.name, getRoomName(booking)]
          .join(" ")
          .toLowerCase()
          .includes(term);

      const matchesStatus =
        selectedStatus === "all" ? true : status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [flatBookings, search, selectedStatus]);

  // Therapist columns
  const therapists = useMemo(
    () => buildTherapists(allTherapists, flatBookings),
    [allTherapists, flatBookings]
  );

  // Time labels
  const timeSlots = useMemo(() => buildTimeSlots(), []);

  // Width calculations
  const { columnWidth, tableWidth, fullWidth } = useMemo(
    () => getCalendarDimensions(boardWidth, therapists.length),
    [boardWidth, therapists.length]
  );

  // Positioned booking map
  const bookingLayoutMap = useMemo(
    () => buildBookingLayoutMap(filteredBookings),
    [filteredBookings]
  );

  // Sync body scroll with header
  const syncScroll = (source) => {
    const left = source.scrollLeft;

    if (source === bodyScrollRef.current && headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = left;
    }
  };

  // Drag and drop booking update
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over) return;

    const draggedBooking = active?.data?.current?.booking;
    const target = over?.data?.current;

    if (!draggedBooking || !target) return;

    const newStartTime = target.startTime;
    const newTherapistId = target.therapistId;
    const serviceDate = target.serviceDate;

    if (!newStartTime || !newTherapistId) return;

    const sameSlot =
      String(draggedBooking?.therapist || draggedBooking?.therapist_id) ===
        String(newTherapistId) &&
      String(draggedBooking?.start_time || "").slice(0, 5) ===
        String(newStartTime).slice(0, 5);

    if (sameSlot) return;

    const key = getBookingKey(draggedBooking);

    const previous = {
      therapist: draggedBooking?.therapist,
      therapist_id: draggedBooking?.therapist_id,
      start_time: draggedBooking?.start_time,
      service_date: draggedBooking?.service_date,
    };

    setOptimisticMoves((prev) => ({
      ...prev,
      [key]: {
        therapist: newTherapistId,
        therapist_id: newTherapistId,
        start_time: newStartTime,
        service_date: serviceDate,
      },
    }));

    const result = await handleUpdateBooking({
      ...draggedBooking,
      booking_id: draggedBooking?.booking_id,
      customer: Number(draggedBooking?.user?.id),
      booking_item_id: draggedBooking?.booking_item_id,
      therapist: newTherapistId,
      therapist_id: newTherapistId,
      start_time: newStartTime,
      service_date: serviceDate,
      duration: Number(draggedBooking?.duration || 60),
      service_id: draggedBooking?.service_id || draggedBooking?.service,
    });

    if (!result?.success) {
      setOptimisticMoves((prev) => ({
        ...prev,
        [key]: previous,
      }));
      return;
    }

    setTimeout(() => {
      setOptimisticMoves((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }, 300);
  };

  // Virtualization calculations
  const viewportHeight =
    bodyScrollRef.current?.clientHeight || window.innerHeight;

  const viewportWidth =
    bodyScrollRef.current?.clientWidth ||
    Math.max(boardWidth - TIME_COL_WIDTH, 0);

  const { startRow, endRow, startCol, endCol } = useMemo(
    () =>
      getVisibleWindow({
        scrollTop,
        scrollLeft,
        rowHeight: ROW_HEIGHT,
        totalSlots: TOTAL_SLOTS,
        columnWidth,
        therapistCount: therapists.length,
        viewportHeight,
        viewportWidth,
      }),
    [
      scrollTop,
      scrollLeft,
      columnWidth,
      therapists.length,
      viewportHeight,
      viewportWidth,
    ]
  );

  const visibleTherapists = therapists.slice(startCol, endCol);

  // Render one row
  const Row = React.memo(({ index }) => {
    const time = timeSlots[index];
    const isHourRow = index % 4 === 0;

    return (
      <div
        className="flex"
        style={{
          minHeight: ROW_HEIGHT,
          backgroundColor: isHourRow ? "#f8f8f8" : "#fcfcfc",
        }}
      >
        <div
          className="sticky left-0 z-20 border-r border-b border-[#ece7e1] bg-[#faf7f2] px-1.5 pt-1 text-[10px] leading-tight text-[#8e8479]"
          style={{
            width: TIME_COL_WIDTH,
            minWidth: TIME_COL_WIDTH,
            height: ROW_HEIGHT,
            boxSizing: "border-box",
          }}
        >
          <div className="font-medium">{time}</div>
        </div>

        <div className="flex" style={{ width: tableWidth, minWidth: tableWidth }}>
          <div
            style={{
              position: "relative",
              width: tableWidth,
              minWidth: tableWidth,
              height: ROW_HEIGHT,
            }}
          >
            {visibleTherapists.map((therapist, visibleIndex) => {
              const actualIndex = startCol + visibleIndex;
              const booking = bookingLayoutMap[`${index}-${therapist.id}`];
              const conflicts =
                bookingLayoutMap[`${index}-${therapist.id}-conflict`] || [];

              return (
                <div
                  key={`${therapist.id}-${index}`}
                  style={{
                    position: "absolute",
                    left: actualIndex * columnWidth,
                    top: 0,
                    width: columnWidth,
                    minWidth: columnWidth,
                    height: ROW_HEIGHT,
                  }}
                >
                  <DroppableCell
                    therapist={therapist}
                    index={index}
                    booking={booking}
                    conflicts={conflicts}
                    columnWidth={columnWidth}
                    locallyCancelledIds={locallyCancelledIds}
                    setSelectedBooking={setSelectedBooking}
                    currentDate={currentDate}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  });

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="h-screen overflow-hidden bg-[#f5f2ec] text-slate-800">
        {/* Top nav */}
            <div
          className="flex items-center px-4 text-white shadow-sm"
          style={{ height: NAV_HEIGHT, backgroundColor: "#4B240D" }}
        >
          {/* Left logo */}
          <div className="text-[20px] font-bold tracking-tight">NatureLand</div>

          {/* Right side content */}
          <div className="ml-auto flex items-center gap-6">
            <div className="hidden items-center gap-5 text-[16px] font-medium md:flex">
              <span className="text-[#f0bf4c]">Home</span>
              <span className="text-slate-200/90">Therapists</span>
              <span className="text-slate-200/90">Sales</span>
              <span className="text-slate-200/90">Clients</span>
              <span className="text-slate-200/90">Transactions</span>
              <span className="text-slate-200/90">Reports</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-white/90" />
              <div className="h-5 w-5 rounded-full bg-[#f3a84f]" />
            </div>
         </div>
         </div>

        <div className="flex h-[calc(100vh-56px)] flex-col">
          {/* Toolbar */}
          <div
            className="border-b border-[#e9e2d8] bg-[#fbf8f3] px-4"
            style={{ height: TOOLBAR_HEIGHT }}
          >
            <div className="flex h-full items-center justify-between gap-3">
              <div className="min-w-[140px]">
                <div className="text-[12px] font-semibold text-[#45352b]">
                  Liat Towers
                </div>
                <div className="text-[10px] text-[#8c7f73]">Display: 15 Min</div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-8 items-center rounded border border-[#ddd3c7] bg-white px-3">
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search Sales by name"
                    className="w-56 bg-transparent text-[11px] text-slate-700 outline-none placeholder:text-[#a19385]"
                  />
                </div>

                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  className="h-8 rounded border border-[#ddd3c7] bg-white px-3 text-[11px] text-slate-700 outline-none"
                >
                  <option value="all">Filter</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="checkin">Check-in</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <button
                  type="button"
                  className="h-8 rounded border border-[#ddd3c7] bg-white px-3 text-[11px] font-medium text-slate-700"
                >
                  Today
                </button>

                <button
                  type="button"
                  className="h-8 rounded border border-[#ddd3c7] bg-white px-3 text-[11px] font-medium text-slate-700"
                >
                  ‹
                </button>

                <button
                  type="button"
                  className="h-8 rounded border border-[#ddd3c7] bg-white px-3 text-[11px] font-medium text-slate-700"
                >
                  {formattedDate}
                </button>

                <button
                  type="button"
                  className="h-8 rounded border border-[#ddd3c7] bg-white px-3 text-[11px] font-medium text-slate-700"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          <div ref={shellRef} className="flex min-h-0 flex-1 flex-col">
            {/* Header */}
            <div className="flex border-b border-[#e9e2d8] bg-[#fbf8f3]">
              <div
                className="sticky left-0 z-30 flex items-center border-r border-[#ece7e1] bg-[#fbf8f3] px-2 text-[11px] font-semibold text-[#5a4b40]"
                style={{
                  width: TIME_COL_WIDTH,
                  minWidth: TIME_COL_WIDTH,
                  height: HEADER_HEIGHT,
                }}
              >
                Time
              </div>

              <div ref={headerScrollRef} className="flex-1 overflow-hidden">
                <div
                  className="bg-[#fbf8f3]"
                  style={{
                    width: tableWidth,
                    minWidth: tableWidth,
                    position: "relative",
                    height: HEADER_HEIGHT,
                  }}
                >
                  {visibleTherapists.map((therapist, visibleIndex) => {
                    const actualIndex = startCol + visibleIndex;
                    const genderStyle = getTherapistLabelClasses(therapist.gender);

                    return (
                      <div
                        key={therapist.id}
                        className="flex flex-col items-center justify-center border-r border-[#ece7e1] px-1"
                        style={{
                          position: "absolute",
                          left: actualIndex * columnWidth,
                          width: columnWidth,
                          minWidth: columnWidth,
                          height: HEADER_HEIGHT,
                        }}
                      >
                        <div
                          className={`flex h-4.5 w-4.5 items-center justify-center rounded-full border text-[9px] font-bold ${genderStyle.bg} ${genderStyle.text} ${genderStyle.border}`}
                          style={{ width: 18, height: 18 }}
                        >
                          {therapist.name?.charAt(0) || "T"}
                        </div>

                        <div className="mt-1 max-w-full truncate text-[10px] font-semibold leading-none text-[#4d4035]">
                          {therapist.name}
                        </div>

                        <div
                          className={`mt-0.5 text-[8px] leading-none ${genderStyle.text}`}
                        >
                          {therapist.gender === "female"
                            ? "Female"
                            : therapist.gender === "male"
                            ? "Male"
                            : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Scroll body */}
            <div
              ref={bodyScrollRef}
              className="flex-1 overflow-auto"
              onScroll={(event) => {
                syncScroll(event.currentTarget);
                setScrollTop(event.currentTarget.scrollTop);
                setScrollLeft(event.currentTarget.scrollLeft);
              }}
            >
              <div
                style={{
                  width: "max-content",
                  minWidth: fullWidth,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    height: TOTAL_SLOTS * ROW_HEIGHT,
                  }}
                >
                  {Array.from({ length: endRow - startRow }, (_, offset) => {
                    const index = startRow + offset;

                    return (
                      <div
                        key={index}
                        style={{
                          position: "absolute",
                          top: index * ROW_HEIGHT,
                          left: 0,
                          right: 0,
                        }}
                      >
                        <Row index={index} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Drawer */}
          <BookingDetailsDrawer
            key={
              selectedBooking?._isNew
                ? `new-${
                    selectedBooking?.therapist_id || selectedBooking?.therapist
                  }-${selectedBooking?.start_time}-${selectedBooking?.service_date}`
                : `existing-${
                    selectedBooking?.booking_item_id ||
                    selectedBooking?.booking_id ||
                    selectedBooking?.id ||
                    "none"
                  }`
            }
            booking={
              selectedBooking
                ? {
                    ...selectedBooking,
                    _forcedCancelled:
                      locallyCancelledIds[
                        String(selectedBooking?.booking_item_id || selectedBooking?.id)
                      ] || false,
                  }
                : null
            }
            onClose={() => setSelectedBooking(null)}
            onEdit={handleUpdateBooking}
            onCancel={handleCancelBooking}
            onDelete={handleDeleteBooking}
            onCreate={handleCreateOrUpdate}
            loading={loading}
            getClientName={getClientName}
            getServiceName={getServiceName}
            getRoomName={getRoomName}
            getDisplayTime={(booking) => {
              if (booking?.start_time && booking?.end_time) {
                return `${booking.start_time} - ${booking.end_time}`;
              }

              if (booking?.service_at) return booking.service_at;
              if (booking?.start_time) return booking.start_time;

              return "-";
            }}
            getDurationMinutes={getDurationMinutes}
            getTherapistInfo={getTherapistInfo}
          />
        </div>
      </div>
    </DndContext>
  );
};

export default CalendarBoard;