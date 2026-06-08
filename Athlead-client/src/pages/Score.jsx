import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { api } from "../api/axios";
import { useNavigate } from "react-router";

export default function Score() {
  const [formData, setFormData] = useState({
    sport: "cycling",
    age: "20",
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

  const navigate = useNavigate();

  const fieldMetadata = {
    sport: {
      label: "Sport",
      placeholder: "e.g. cycling, running, swimming",
      helper: "Primary sport or athletic discipline. Enter the sport name.",
    },
    training_years: {
      label: "Training Years",
      placeholder: "e.g. 5",
      helper: "Total years of structured athletic training. Typical range: 0–40 years.",
    },
    vo2_max: {
      label: "VO₂ Max",
      placeholder: "e.g. 45",
      helper: "Maximum oxygen uptake in ml/kg/min. Typical range: 20–85.",
    },
    hrv: {
      label: "HRV",
      placeholder: "e.g. 65",
      helper: "Heart Rate Variability measured in milliseconds (ms). Typical range: 20–120.",
    },
    lactate_threshold: {
      label: "Lactate Threshold",
      placeholder: "e.g. 8",
      helper: "Lactate threshold in mmol/L (blood lactate concentration). Typical range: 1–15 mmol/L.",
    },
    stride_length: {
      label: "Stride Length",
      placeholder: "e.g. 1.4",
      helper: "Average distance covered per step in meters. Typical range: 0.5–3.5 m.",
    },
    cadence: {
      label: "Cadence",
      placeholder: "e.g. 180",
      helper: "Number of steps per minute during movement. Typical range: 50–220 spm.",
    },
    force_application: {
      label: "Force Application",
      placeholder: "e.g. 250",
      helper: "Estimated force generated during movement in Newtons (N). Typical range: 100–500 N.",
    },
    performance_score: {
      label: "Performance Score",
      placeholder: "e.g. 75",
      helper: "Overall performance assessment score from 0–100.",
    },
    adaptability_score: {
      label: "Adaptability Score",
      placeholder: "e.g. 80",
      helper: "Ability to adapt to training and recovery demands. Range: 0–100.",
    },
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(formData);

    const res = await api.post("/api/score", formData);
    console.log(res);

    if (res.data.success) {
      toast.success(res.data.message);
      navigate("/dashboard");
    } else {
      toast.error(res.data.message);
    }
  };

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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-1 lg:grid-cols-2">
            <div>
              <label htmlFor="sport" className="block text-sm font-semibold mb-1">
                {fieldMetadata.sport.label}
              </label>
              <input
                id="sport"
                type="text"
                name="sport"
                placeholder={fieldMetadata.sport.placeholder}
                value={formData.sport}
                onChange={handleChange}
                aria-describedby="sport-helper"
                className="p-2 rounded bg-gray-700 text-white w-full focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              />
              <p id="sport-helper" className="text-xs text-gray-400 mt-1">
                {fieldMetadata.sport.helper}
              </p>
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
              <div key={field}>
                <label htmlFor={field} className="block text-sm font-semibold mb-1">
                  {fieldMetadata[field].label}
                </label>
                <input
                  id={field}
                  type="number"
                  name={field}
                  placeholder={fieldMetadata[field].placeholder}
                  value={formData[field]}
                  onChange={handleChange}
                  aria-describedby={`${field}-helper`}
                  className="p-2 rounded bg-gray-700 text-white w-full focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                />
                <p id={`${field}-helper`} className="text-xs text-gray-400 mt-1">
                  {fieldMetadata[field].helper}
                </p>
              </div>
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
