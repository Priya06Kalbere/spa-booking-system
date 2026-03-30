import React, { useEffect, useState } from "react";
import { createCustomerApi } from "../../services/customer";

const initialForm = {
  name: "",
  lastname: "",
  email: "",
  contact_number: "+91",
  gender: "male",
  status: 1,
  membership: 0,
};

const CustomerCreateModal = ({ open, onClose, onCreated }) => {

  // Local State
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  //Reset modal state whenever it closes

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setErrors({});
      setSuccessMessage("");
      setLoading(false);
    }
  }, [open]);

  // Validation
  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "First name is required";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email is required";
    }

    if (!form.contact_number.trim()) {
      nextErrors.contact_number = "Contact number is required";
    } else if (!/^\+\d{6,20}$/.test(form.contact_number.trim())) {
      nextErrors.contact_number =
        "Contact number must include country code (e.g. +919876543210)";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // Input Handler
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      // Convert numeric fields properly
      [name]: name === "status" || name === "membership" ? Number(value) : value,
    }));

    // Clear error for changed field
    setErrors((prev) => ({
      ...prev,
      [name]: "",
      general: "",
    }));

    setSuccessMessage("");
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      setErrors({});
      setSuccessMessage("");

      const res = await createCustomerApi(form);
      const newUser = res?.data?.data || {};

      // Normalize created user
      const createdCustomer = {
        id: newUser?.id,
        name: newUser?.name || form.name,
        lastname: newUser?.lastname || form.lastname,
        email: newUser?.email || form.email,
        contact_number: newUser?.contact_number || form.contact_number,
        membership: Number(newUser?.membership ?? form.membership ?? 0),
      };

      setSuccessMessage("Customer created successfully");

      // Notify parent
      onCreated?.(createdCustomer);

      // Auto close after success
      setTimeout(() => {
        onClose?.();
        setForm(initialForm);
        setSuccessMessage("");
      }, 800);
    } catch (error) {
      console.error("Failed to create customer", error);

      const apiMessage =
        error?.response?.data?.message || "Failed to create customer";

      const apiErrors = error?.response?.data?.errors || {};

      // Map API errors to UI fields
      setErrors({
        name: apiErrors?.name?.[0] || "",
        lastname: apiErrors?.lastname?.[0] || "",
        email: apiErrors?.email?.[0] || "",
        contact_number: apiErrors?.contact_number?.[0] || "",
        general: apiMessage,
      });

      setSuccessMessage("");
    } finally {
      setLoading(false);
    }
  };

  // Early Return (Modal Closed)
  if (!open) return null;

  // Helper to style inputs based on error
  const inputClass = (field) =>
    `w-full rounded-lg border px-3 py-2 text-sm ${
      errors[field] ? "border-red-400" : "border-slate-300"
    }`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">
            Create Client
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {errors.general}
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-3">
          <div>
            <input
              name="name"
              placeholder="First Name"
              value={form.name}
              onChange={handleChange}
              className={inputClass("name")}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <input
              name="lastname"
              placeholder="Last Name"
              value={form.lastname}
              onChange={handleChange}
              className={inputClass("lastname")}
            />
            {errors.lastname && (
              <p className="mt-1 text-xs text-red-600">{errors.lastname}</p>
            )}
          </div>

          <div>
            <input
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className={inputClass("email")}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <input
              name="contact_number"
              placeholder="Contact Number (e.g. +919876543210)"
              value={form.contact_number}
              onChange={handleChange}
              className={inputClass("contact_number")}
            />

            {errors.contact_number ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.contact_number}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Must include country code like +91, +65, +1
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className={inputClass("gender")}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className={inputClass("status")}
            >
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>

            <select
              name="membership"
              value={form.membership}
              onChange={handleChange}
              className={inputClass("membership")}
            >
              <option value={0}>No</option>
              <option value={1}>Yes</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Client"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerCreateModal;