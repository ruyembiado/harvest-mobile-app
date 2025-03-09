import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.1.31:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add interceptor to catch errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global API errors
    console.error("Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;