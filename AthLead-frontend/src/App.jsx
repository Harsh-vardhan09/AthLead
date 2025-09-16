import "./App.css";
import Dashboard from "./Dynamic/Dashboard";
import Home from "./Components/Home.jsx";
// import Authentication from './User/Authentication'
// import Nav from './Components/NavBar.jsx'

import { Routes, Route } from "react-router-dom";
import Navbar from "./Components/NavBar.jsx";
import Program from "./Components/Program";
import Events from "./Components/Events";
import About from "./Components/About";
import Authentication from "./User/Authentication";
import Scorecard from "./Dynamic/Scorecard.jsx";

function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/program" element={<Program/>} />
        <Route path="/events" element={<Events />} />
        <Route path="/about" element={<About />} /> 
        <Route path="/Authentication" element={<Authentication />} />
        <Route path="/Scorecard" element={<Scorecard/>} />
      </Routes>
    </div>
  );
}

export default App;
