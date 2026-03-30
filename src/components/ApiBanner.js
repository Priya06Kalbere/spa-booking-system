import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearMessages } from "../store/bookingSlice";

const AUTO_HIDE_DELAY = 5000;

const ApiBanner = () => {
  const dispatch = useDispatch();

  // Read API messages from redux store
  const errorMessage = useSelector((state) => state.bookings?.error);
  const successMessage = useSelector((state) => state.bookings?.successMessage);

  // Decide which message to show
  const isError = Boolean(errorMessage);
  const message = errorMessage || successMessage;

  // Auto-hide banner after a few seconds
  useEffect(() => {
    if (!message) return undefined;

    const timer = setTimeout(() => {
      dispatch(clearMessages());
    }, AUTO_HIDE_DELAY);

    return () => clearTimeout(timer);
  }, [dispatch, message]);

  // Do not render anything if there is no message
  if (!message) return null;

  return (
    <div className="fixed left-1/2 top-4 z-[9999] w-[calc(100%-32px)] max-w-xl -translate-x-1/2">
      <div
        className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 shadow-lg ${
          isError
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}
        role="alert"
      >
        <div>
          {/* Banner title */}
          <div className="text-sm font-semibold">
            {isError ? "API Error" : "Success"}
          </div>

          {/* Banner message */}
          <div className="mt-1 text-sm">{message}</div>
        </div>

        {/* Manual close button */}
        <button
          type="button"
          onClick={() => dispatch(clearMessages())}
          className="rounded-md px-2 py-1 text-xs font-medium hover:bg-black/5"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ApiBanner;