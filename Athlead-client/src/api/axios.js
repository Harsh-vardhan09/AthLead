import { api } from "./axios";

// ======================
// Authentication Service
// ======================
export const authService = {
  login: (credentials) => api.post("/api/auth/login", credentials),
  register: (userData) => api.post("/api/auth/register", userData),
  logout: () => api.post("/api/auth/logout"),
  refresh: () => api.post("/api/refresh"),
  getProfile: () => api.get("/api/auth/profile"),
  updateProfile: (data) => api.put("/api/auth/profile", data),
  forgotPassword: (email) => api.post("/api/auth/forgot-password", { email }),
  resetPassword: (token, password) =>
    api.post("/api/auth/reset-password", { token, password }),
};

// ======================
// Events Service
// ======================
export const eventsService = {
  getAll: (params) => api.get("/api/events", { params }),
  getById: (id) => api.get(`/api/events/${id}`),
  create: (data) => api.post("/api/events", data),
  update: (id, data) => api.put(`/api/events/${id}`, data),
  remove: (id) => api.delete(`/api/events/${id}`),
  register: (id) => api.post(`/api/events/${id}/register`),
  unregister: (id) => api.post(`/api/events/${id}/unregister`),
  getParticipants: (id) => api.get(`/api/events/${id}/participants`),
};

// ======================
// Scores Service
// ======================
export const scoresService = {
  getAll: (params) => api.get("/api/scores", { params }),
  getById: (id) => api.get(`/api/scores/${id}`),
  create: (data) => api.post("/api/scores", data),
  update: (id, data) => api.put(`/api/scores/${id}`, data),
  remove: (id) => api.delete(`/api/scores/${id}`),
  getByEvent: (eventId) => api.get(`/api/scores/event/${eventId}`),
  getByUser: (userId) => api.get(`/api/scores/user/${userId}`),
};

// ======================
// Rankings Service
// ======================
export const rankingsService = {
  getAll: (params) => api.get("/api/rankings", { params }),
  getById: (id) => api.get(`/api/rankings/${id}`),
  getByEvent: (eventId) => api.get(`/api/rankings/event/${eventId}`),
  getByUser: (userId) => api.get(`/api/rankings/user/${userId}`),
  getLeaderboard: (params) => api.get("/api/rankings/leaderboard", { params }),
};

// ======================
// Users Service
// ======================
export const usersService = {
  getAll: (params) => api.get("/api/users", { params }),
  getById: (id) => api.get(`/api/users/${id}`),
  create: (data) => api.post("/api/users", data),
  update: (id, data) => api.put(`/api/users/${id}`, data),
  remove: (id) => api.delete(`/api/users/${id}`),
};

// ======================
// Admin Service
// ======================
export const adminService = {
  getDashboard: () => api.get("/api/admin/dashboard"),
  getUsers: (params) => api.get("/api/admin/users", { params }),
  updateUser: (id, data) => api.put(`/api/admin/users/${id}`, data),
  removeUser: (id) => api.delete(`/api/admin/users/${id}`),
  getEvents: (params) => api.get("/api/admin/events", { params }),
  updateEvent: (id, data) => api.put(`/api/admin/events/${id}`, data),
  removeEvent: (id) => api.delete(`/api/admin/events/${id}`),
  getSettings: () => api.get("/api/admin/settings"),
  updateSettings: (data) => api.put("/api/admin/settings", data),
};