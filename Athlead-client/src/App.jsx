import { Route, Routes, Suspense } from "react-router-dom";
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
import { Toaster } from "react-hot-toast";
import AppProvider from "./context/AppProvider";
import ProtectedRoute from "./context/ProtectedRoute";
import AdminRoute from "./context/AdminRoute";
import Score from "./pages/Score";
const LazyEventCardSkeleton = React.lazy(() => import("./Components/EventCardSkelton"));
import IsLoggedIn from "./context/IsLoggedIn";

// Admin pages are lazy-loaded to keep the initial bundle small
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const AdminLayout = React.lazy(() => import("./pages/admin/AdminLayout"));
const AllEvents = React.lazy(() => import("./pages/admin/AllEvents"));
const CreateEvent = React.lazy(() => import("./pages/admin/CreateEvent"));
const Athlete = React.lazy(() => import("./pages/admin/Athlete"));

function AdminFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-sm text-slate-400">Loading admin panel…</div>
    </div>
  );
}

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
            <AdminRoute>
              <Suspense fallback={<AdminFallback />}>
                <AdminLayout />
              </Suspense>
            </AdminRoute>
          }
        >
          <Route
            path="dashboard"
            element={
              <AdminRoute>
                <Suspense fallback={<AdminFallback />}>
                  <AdminDashboard />
                </Suspense>
              </AdminRoute>
            }
          />
          <Route
            path="events"
            element={
              <AdminRoute>
                <Suspense fallback={<AdminFallback />}>
                  <AllEvents />
                </Suspense>
              </AdminRoute>
            }
          />
          <Route
            path="event/new"
            element={
              <AdminRoute>
                <Suspense fallback={<AdminFallback />}>
                  <CreateEvent />
                </Suspense>
              </AdminRoute>
            }
          />
          <Route
            path="athlete"
            element={
              <AdminRoute>
                <Suspense fallback={<AdminFallback />}>
                  <Athlete />
                </Suspense>
              </AdminRoute>
            }
          />
        </Route>
      </Routes>
    </AppProvider>
  );
};

export default App;
