import { api } from "./axios";

export const newsService = {
  getAll: () =>
    api.get("/api/news"),
};
