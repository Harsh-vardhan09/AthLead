import { Route, Routes } from "react-router-dom";
import { Announcement, Home, Login, Signup } from "./pages";
import Layout from "./pages/Layout";
import React from "react";
import { Toaster } from "react-hot-toast";
import AppProvider from "./context/AppProvider";
import ProtectedRoute from "./context/ProtectedRoute";
import Score from "./pages/Score";
import IsLoggedIn from "./context/IsLoggedIn";
import RoleBasedRoute from "./context/RoleBasedRoute";
import AdminLayout from "./pages/admin/AdminLayout";

const LazyEvents = React.lazy(() => import("./pages/Events"));
const LazyEventSignup = React.lazy(() => import("./pages/EventSignup"));
const LazyDashboard = React.lazy(() => import("./pages/Dashboard"));
const LazyScore = React.lazy(() => import("./pages/Score"));
const LazyAdminDashboard = React.lazy(
  () => import("./pages/admin/AdminDashboard"),
);
const LazyAllEvents = React.lazy(() => import("./pages/admin/AllEvents"));
const LazyCreateEvent = React.lazy(() => import("./pages/admin/CreateEvent"));
const LazyAthlete = React.lazy(() => import("./pages/admin/Athlete"));
const LazyEventCardSkeleton = React.lazy(
  () => import("./Components/EventCardSkelton"),
);

const App = () => {
  return (
    <AppProvider>
      <Toaster />
      <React.Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route
              index
              element={
                <IsLoggedIn>
                  <Home />
                </IsLoggedIn>
              }
            />
            <Route
              path="/events"
              element={
                <React.Suspense
                  fallback={
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 my-8 w-full lg:px-20">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <LazyEventCardSkeleton key={i} />
                      ))}
                    </div>
                  }
                >
                  <LazyEvents />
                </React.Suspense>
              }
            />
            <Route
              path="/events/:eventId"
              element={
                <ProtectedRoute>
                  <LazyEventSignup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <LazyDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/news" element={<Announcement />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/score"
              element={
                <ProtectedRoute>
                  <LazyScore />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route
            path="/admin"
            element={
              <RoleBasedRoute allowedRoles={["ADMIN"]}>
                <AdminLayout />
              </RoleBasedRoute>
            }
          >
            <Route
              path="dashboard"
              element={
                <RoleBasedRoute allowedRoles={["ADMIN"]}>
                  <LazyAdminDashboard />
                </RoleBasedRoute>
              }
            />
            <Route
              path="events"
              element={
                <RoleBasedRoute allowedRoles={["ADMIN"]}>
                  <LazyAllEvents />
                </RoleBasedRoute>
              }
            />
            <Route
              path="event/new"
              element={
                <RoleBasedRoute allowedRoles={["ADMIN"]}>
                  <LazyCreateEvent />
                </RoleBasedRoute>
              }
            />
            <Route
              path="athlete"
              element={
                <RoleBasedRoute allowedRoles={["ADMIN"]}>
                  <LazyAthlete />
                </RoleBasedRoute>
              }
            />
          </Route>
        </Routes>
      </React.Suspense>
    </AppProvider>
  );
};

export default App;
