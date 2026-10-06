import { api } from "./axios";

export const authService = {
  sendOtp: (email) => api.post("/api/auth/send-otp", { email }),

  verifyOtp: (sessionId, otp) =>
    api.post("/api/auth/verify-otp", { sessionId, otp }),

  resendOtp: (sessionId) => api.post("/api/auth/resend-otp", { sessionId }),

  login: (data) => api.post("/api/auth/login", data),

  signup: (data) => api.post("/api/auth/signup", data),

  logout: () => api.post("/api/auth/logout", {}),
};
