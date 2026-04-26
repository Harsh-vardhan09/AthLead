import React, { useState } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function Score() {
  const [formData, setFormData] = useState({
    sport: "cycling",
    age: "",
    gender: "M",
    training_years: "",
    vo2_max: "",
    hrv: "",
    lactate_threshold: "",
    stride_length: "",
    cadence: "",
    force_application: "",
    performance_score: "",
    adaptability_score: "",
  });

  const [score, setScore] = useState(null);
  const [radarData, setRadarData] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
  };

  const emptyRadarData = [
    { metric: "VO2 Max", value: 0 },
    { metric: "HRV", value: 0 },
    { metric: "Lactate Threshold", value: 0 },
    { metric: "Stride Length", value: 0 },
    { metric: "Cadence", value: 0 },
    { metric: "Force", value: 0 },
    { metric: "Performance", value: 0 },
    { metric: "Adaptability", value: 0 },
    { metric: "Final Score", value: 0 },
  ];

  return (
    <div className="min-h-screen dark-bg text-white p-6 md:p-10 flex flex-col items-center justify-center">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center md:text-left">
        Athlete Scorecard
      </h1>

      <div className="flex flex-col lg:flex-row gap-6 md:grid-cols-1 w-full lg:w-220 ">
        <form
          onSubmit={handleSubmit}
          className=" bg-linear-to-br from-[#0f2027] via-[#1a3a4a] to-[#811985] border border-[#1d9e75]/40 text-start flex-1 p-6 rounded-2xl shadow-lg"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-1 lg:grid-cols-2">
            <input
              type="text"
              name="sport"
              placeholder="Sport"
              value={formData.sport}
              onChange={handleChange}
              className="p-2 rounded bg-gray-700 text-white w-full"
            />

           

          
            {[
              "training_years",
              "vo2_max",
              "hrv",
              "lactate_threshold",
              "stride_length",
              "cadence",
              "force_application",
              "performance_score",
              "adaptability_score",
            ].map((field) => (
              <input
                key={field}
                type="number"
                name={field}
                placeholder={field.replace("_", " ")}
                value={formData[field]}
                onChange={handleChange}
                className="p-2 rounded bg-gray-700 text-white w-full"
              />
            ))}
          </div>
          <div className="p-6 flex items-center justify-center">
            <button
                type="submit"
                className="mt-4 w-full bg-linear-to-r from-teal-300 to-teal-800 hover:to-purple-700 py-2 px-4 rounded-lg text-white font-semibold"
            >
                Generate Score
            </button>
          </div>
        </form>


      </div>
    </div>
  );
}
