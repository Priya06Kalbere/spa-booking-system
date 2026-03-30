/**
 * Normalize status into standard values:
 * "confirmed" | "checkin" | "cancelled"
 */
export const normalizeStatus = (status) => {
  const value = String(status ?? "").toLowerCase().trim();

  // Handle numeric statuses
  if (status === 1 || value === "1") return "confirmed";
  if (status === 2 || value === "2") return "checkin";
  if (status === 3 || value === "3") return "cancelled";

  // Handle string-based statuses
  if (value.includes("confirm")) return "confirmed";
  if (value.includes("check")) return "checkin";
  if (value.includes("cancel")) return "cancelled";

  // Default fallback
  return "confirmed";
};

/**
 * Get Tailwind classes for status card UI
 */
export const getStatusCardClasses = (status) => {
  const normalized = normalizeStatus(status);

  const statusClasses = {
    confirmed: "bg-blue-50 border-blue-200 text-slate-700",
    checkin: "bg-pink-50 border-pink-200 text-slate-700",
    cancelled: "bg-slate-100 border-slate-200 text-slate-500",
  };

  return statusClasses[normalized] || statusClasses.confirmed;
};