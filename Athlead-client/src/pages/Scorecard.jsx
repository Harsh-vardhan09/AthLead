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

export default function Scorecard() {
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
    try {
      const response = await fetch("http://127.0.0.1:8000/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("API Error");
      const result = await response.json();
      setScore(result.predicted_potential_score);

      setRadarData([
        { metric: "VO2 Max", value: Number(formData.vo2_max) || 0 },
        { metric: "HRV", value: Number(formData.hrv) || 0 },
        {
          metric: "Lactate Threshold",
          value: Number(formData.lactate_threshold) || 0,
        },
        { metric: "Stride Length", value: Number(formData.stride_length) || 0 },
        { metric: "Cadence", value: Number(formData.cadence) || 0 },
        { metric: "Force", value: Number(formData.force_application) || 0 },
        {
          metric: "Performance",
          value: Number(formData.performance_score) || 0,
        },
        {
          metric: "Adaptability",
          value: Number(formData.adaptability_score) || 0,
        },
        { metric: "Final Score", value: result.predicted_potential_score },
      ]);
    } catch (error) {
      console.error("Error:", error);
    }
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
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center md:text-left">
        Athlete Scorecard
      </h1>

      <div className="flex flex-col lg:flex-row gap-6 md:grid-cols-1">
        <form
          onSubmit={handleSubmit}
          className="bg-gray-800 flex-1 p-6 rounded-2xl shadow-lg"
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

            <input
              type="number"
              name="age"
              placeholder="Age"
              value={formData.age}
              onChange={handleChange}
              className="p-2 rounded bg-gray-700 text-white w-full"
            />

            <div className="flex items-center space-x-4 col-span-1 md:col-span-1 lg:col-span-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="M"
                  checked={formData.gender === "M"}
                  onChange={handleChange}
                />
                <span className="ml-2">Male</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="F"
                  checked={formData.gender === "F"}
                  onChange={handleChange}
                />
                <span className="ml-2">Female</span>
              </label>
            </div>

          
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
          <button
            type="submit"
            className="mt-4 col-span-2 bg-purple-600 hover:bg-purple-700 py-2 px-4 rounded-lg text-white font-semibold"
          >
            Generate Score
          </button>
        </form>

      
        <div className="bg-gray-800 flex-1 p-6 rounded-2xl shadow-lg">
          <h2 className="text-lg md:text-xl font-bold mb-4">
            Predicted Potential Score
          </h2>

          {score !== null && (
            <p className="text-2xl font-bold text-green-400 text-center mb-6">
              {score.toFixed(2)}
            </p>
          )}

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="80%"
                data={score !== null ? radarData : emptyRadarData}
              >
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" stroke="#ccc" />
                <PolarRadiusAxis stroke="#ccc" />
                <Radar
                  name="Metrics"
                  dataKey="value"
                  stroke={score !== null ? "#8884d8" : "#444"}
                  fill={score !== null ? "#8884d8" : "#444"}
                  fillOpacity={0.6}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
