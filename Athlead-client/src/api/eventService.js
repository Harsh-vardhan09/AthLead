import { api } from "./axios";

export const eventService = {
  getAll: () =>
    api.get("/api/events"),

  getMyEvents: () =>
    api.get("/api/my-events"),

  register: (eventId, data) =>
    api.post(`/api/events/${eventId}/register`, data),
};
