import axios from "axios";


export const api = axios.create({
 baseURL: `${process.env.REACT_APP_BASE_URL}/api/v1`
});

// Add token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});