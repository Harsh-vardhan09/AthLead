import { api } from "./axios";

export const athleteService = {
  getAll: (params) => api.get("/api/admin/athletes", { params }),
  getById: (id) => api.get(`/api/admin/athletes/${id}`),
};
