import { api } from "./axios";

export const eventService = {
  getAll: () =>
    api.get("/api/events"),

  getMyEvents: () =>
    api.get("/api/my-events"),

  create: (data) =>
    api.post("/api/events", data),

  update: (id, data) =>
    api.patch(`/api/events/${id}`, { data }),

  remove: (id) =>
    api.delete(`/api/events/${id}`),

  register: (eventId, data) =>
    api.post(`/api/events/${eventId}/register`, data),
};
