import { Route, Routes } from "react-router-dom";
import {
  Announcement,
  Dashboard,
  Events,
  EventSignup,
  Home,
  Login,
  Signup,
} from "./pages";
import Layout from "./pages/Layout";
import React from "react";
const LazyEvents = React.lazy(() => import("./pages/Events"));
const LazyEventCardSkeleton = React.lazy(() => import("./Components/EventCardSkelton"));
import { Toaster } from "react-hot-toast";
import AppProvider from "./context/AppProvider";
import ProtectedRoute from "./context/ProtectedRoute";
import Score from "./pages/Score";
import IsLoggedIn from "./context/IsLoggedIn";
import RoleBasedRoute from "./context/RoleBasedRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLayout from "./pages/admin/AdminLayout";
import AllEvents from "./pages/admin/AllEvents";
import CreateEvent from "./pages/admin/CreateEvent";
import Athlete from "./pages/admin/Athlete";

const App = () => {
  return (
    <AppProvider>
      <Toaster />
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
                <EventSignup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
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
                <Score />
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
                <AdminDashboard />
              </RoleBasedRoute>
            }
          />
          <Route
            path="events"
            element={
              <RoleBasedRoute allowedRoles={["ADMIN"]}>
                <AllEvents />
              </RoleBasedRoute>
            }
          />
          <Route
            path="event/new"
            element={
              <RoleBasedRoute allowedRoles={["ADMIN"]}>
                <CreateEvent />
              </RoleBasedRoute>
            }
          />
          <Route
            path="athlete"
            element={
              <RoleBasedRoute allowedRoles={["ADMIN"]}>
                <Athlete />
              </RoleBasedRoute>
            }
          />
        </Route>
      </Routes>
    </AppProvider>
  );
};

export default App;
