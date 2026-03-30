import { api } from "./api";

/**
 * Builds FormData for customer create API.
 *
 * @param {Object} payload - Customer details
 * @returns {FormData}
 */
const buildCustomerFormData = (payload = {}) => {
  const formData = new FormData();

  formData.append("name", payload.name || "");
  formData.append("lastname", payload.lastname || "");
  formData.append("email", payload.email || "");
  formData.append("contact_number", payload.contact_number || "");
  formData.append("gender", payload.gender || "male");
  formData.append("status", String(payload.status ?? 1));
  formData.append("membership", String(payload.membership ?? 0));

  return formData;
};

/**
 * Fetch customer list.
 *
 * @param {Object} params
 * @param {number} params.pagination - Page number
 * @param {string} params.daterange - Optional date range filter
 * @returns {Promise<Object>}
 */
export const listCustomersApi = async ({
  pagination = 1,
  daterange = "",
} = {}) => {
  const response = await api.get("/users", {
    params: {
      pagination,
      daterange,
    },
  });

  return response.data;
};

/**
 * Fetch single customer by ID.
 *
 * @param {number|string} id - Customer ID
 * @returns {Promise<Object>}
 */
export const getCustomerApi = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

/**
 * Create a new customer.
 *
 * API expects multipart/form-data, so we convert payload into FormData.
 *
 * @param {Object} payload - Customer data
 * @param {string} payload.name
 * @param {string} payload.lastname
 * @param {string} payload.email
 * @param {string} payload.contact_number
 * @param {string} payload.gender
 * @param {number|boolean} payload.status
 * @param {number|boolean} payload.membership
 * @returns {Promise<Object>}
 */
export const createCustomerApi = async (payload) => {
  const formData = buildCustomerFormData(payload);

  const response = await api.post("/users/create", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  // Useful for debugging API response during development
  console.log("Create customer response:", response);

  return response.data;
};