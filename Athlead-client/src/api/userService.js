import { api } from "./axios";

export const userService = {
  getMe: () => api.get("/api/auth/me"),

  updateProfile: (formData) => api.patch("/api/edit", formData),
};
