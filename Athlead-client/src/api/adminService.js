import { api } from "./axios";

export const adminService = {
  createEvent: (data) => api.post("/api/events", { data }),

  updateEvent: (id, data) => api.patch(`/api/events/${id}`, { data }),

  deleteEvent: (id) => api.delete(`/api/events/${id}`),
  getAthletes: (params) => api.get("/api/admin/athletes", { params }),
  getAthleteById: (id) => api.get(`/api/admin/athletes/${id}`),
};
