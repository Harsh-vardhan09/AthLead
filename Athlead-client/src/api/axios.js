import axios from "axios";

const TOKEN_KEY = "accessToken";

// A 401 from these routes means "bad credentials" or "no session", not
// "expired access token", so refreshing and retrying makes no sense.
const NO_REFRESH_ROUTES = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/refresh",
];

// The interceptor lives outside React, so it cannot update the auth context
// itself. AppProvider subscribes here to learn when the session has ended.
const authFailureListeners = new Set();

export const onAuthFailure = (listener) => {
  authFailureListeners.add(listener);
  return () => authFailureListeners.delete(listener);
};

const notifyAuthFailure = () => {
  authFailureListeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error("Auth failure listener threw:", error);
    }
  });
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// When the 15-minute access token expires, every request in flight gets a 401
// at about the same time. They all share one refresh call instead of each
// firing their own. Uses plain axios, so a failing refresh can never recurse
// back into the interceptor below.
let refreshPromise = null;

const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${import.meta.env.VITE_BASE_URL}/api/refresh`,
        {},
        { withCredentials: true },
      )
      .then((result) => {
        const newAccessToken = result.data?.accessToken;

        if (!newAccessToken) {
          throw new Error("Refresh response did not include an access token");
        }

        localStorage.setItem(TOKEN_KEY, newAccessToken);
        return newAccessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    const shouldRefresh =
      err.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !NO_REFRESH_ROUTES.some((route) => originalRequest.url?.includes(route));

    if (!shouldRefresh) {
      return Promise.reject(err);
    }

    originalRequest._retry = true;

    let newAccessToken;
    try {
      newAccessToken = await refreshAccessToken();
    } catch (refreshError) {
      // Only an explicit 401 (cookie missing, expired, or user gone) means the
      // session is over. A network error or 5xx says nothing about whether it
      // is still valid, so the stored token is kept in that case.
      if (
        refreshError.response?.status === 401 &&
        localStorage.getItem(TOKEN_KEY)
      ) {
        localStorage.removeItem(TOKEN_KEY);
        notifyAuthFailure();
      }

      return Promise.reject(err);
    }

    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    return api(originalRequest);
  },
);
