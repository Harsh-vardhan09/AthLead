import { Route, Routes } from "react-router-dom";
import { Announcement, Dashboard, Events, Home, Login, Signup } from "./pages";
import Layout from "./pages/Layout";
import React from "react";
const LazyEvents = React.lazy(() => import("./pages/Events"));

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route
          path="/events"
          element={
            <React.Suspense>
              <LazyEvents />
            </React.Suspense>
          }
        />
        {/* <Route path="/events/:eventId" element={<EventSignup/>} /> */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/news" element={<Announcement />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/Login" element={<Login/>} />
      </Route>
    </Routes>
  );
};

export default App;
