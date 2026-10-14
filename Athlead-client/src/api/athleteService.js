import { api } from "./axios";

export const athleteService = {
  getAll: (params) => api.get("/api/athletes", { params }),
  getById: (id) => api.get(`/api/athletes/${id}`),
};
