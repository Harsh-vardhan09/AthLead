import { api } from "./axios";

export const newsService = {
  getAnnouncements: () =>
    api.get("/api/news"),
};
