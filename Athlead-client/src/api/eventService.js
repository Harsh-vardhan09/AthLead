import { api } from "./axios";

export const eventService = {
  getAll: (params = {}, config = {}) =>
    api.get("/api/events", { ...config, params }),

  getMyEvents: () => api.get("/api/my-events"),

  register: (eventId, data) =>
    api.post(`/api/events/${eventId}/register`, data),
};
