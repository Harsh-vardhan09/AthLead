import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home.jsx";
import { Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar.jsx";
import Program from "./pages/Program";
import Events from "./pages/Events";
import Authentication from "./User/Signin.jsx";
import Scorecard from "./pages/Scorecard.jsx";

function App() {
  return (
    <div>
      {/* <Navbar /> */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/program" element={<Program/>} />
        <Route path="/events" element={<Events />} />
        <Route path="/Authentication" element={<Authentication />} />
        <Route path="/Scorecard" element={<Scorecard/>} />
      </Routes>
    </div>
  );
}

export default App;
