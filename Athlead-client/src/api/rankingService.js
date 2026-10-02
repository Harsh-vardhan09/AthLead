import { api } from "./axios";

export const rankingService = {
  getRanking: () =>
    api.get("/api/score/rank"),
};
