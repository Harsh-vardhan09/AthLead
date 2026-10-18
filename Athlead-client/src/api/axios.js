import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const getApiErrorMessage = (status) => {
  const messages = {
    400: "Bad request. Please check your input.",
    401: "Unauthorized. Please check your credentials.",
    403: "You do not have permission to perform this action.",
    404: "The requested resource was not found.",
    409: "Conflict. Resource already exists.",
    429: "Too many requests. Please try again later.",
    500: "Server error. Please try again later.",
  };

  return messages[status] || "Something went wrong. Please try again.";
};

let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    const status = err.response?.status;

    if (
      status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/login") &&
      !originalRequest.url?.includes("/api/auth/verify-otp")
    ) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = axios
          .post(
            `${import.meta.env.VITE_BASE_URL}/api/refresh`,
            {},
            { withCredentials: true },
          )
          .then((result) => {
            const newAccessToken = result.data.accessToken;
            localStorage.setItem("accessToken", newAccessToken);
            return newAccessToken;
          })
          .catch((error) => {
            localStorage.removeItem("accessToken");
            const refreshStatus = error.response?.status;
            if (refreshStatus) {
              error.apiMessage = getApiErrorMessage(refreshStatus);
            }
            throw error;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      try {
        const newAccessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (error) {
        return Promise.reject(error);
      }
    }

    if (status) {
      err.apiMessage = getApiErrorMessage(status);
    }

    return Promise.reject(err);
  },
);
