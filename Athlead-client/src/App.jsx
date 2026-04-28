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
import { Toaster } from "react-hot-toast";
import { useState } from "react";
import AppProvider from "./context/AppProvider";
import ProtectedRoute from "./context/ProtectedRoute";
import Score from "./pages/Score";
import EventCardSkeleton from "./Components/EventCardSkelton";
import IsLoggedIn from "./context/IsLoggedIn";

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
                      <EventCardSkeleton key={i} />
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
      </Routes>
    </AppProvider>
  );
};

export default App;
