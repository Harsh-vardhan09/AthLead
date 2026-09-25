import { api } from "./axios";

export const scoreService = {
  submit: (formData) =>
    api.post("/api/score", formData),

  getMyScores: () =>
    api.get("/api/my-scores"),

  getRanking: (params = {}) =>
    api.get("/api/score/rank", { params }),
};
