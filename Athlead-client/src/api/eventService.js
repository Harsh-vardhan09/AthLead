import { api } from "./axios";

export const eventService = {
  getAll: (params) => api.get("/api/events", { params }),

  getMyEvents: () => api.get("/api/my-events"),

  register: (eventId, data) =>
    api.post(`/api/events/${eventId}/register`, data),
};
