import { Route, Routes } from "react-router-dom";
import { Announcement, Dashboard, Events, Home, Login, Signup } from "./pages";
import Layout from "./pages/Layout";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/events" element={<Events />} />
        {/* <Route path="/events/:eventId" element={<EventSignup/>} /> */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/news" element={<Announcement />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Login />} />
      </Route>
    </Routes>
  );
};

export default App;
