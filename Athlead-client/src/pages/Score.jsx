import React, { useState } from "react";
import toast from "react-hot-toast";
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

  // Track validation errors locally to display inline messages
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const fieldMetadata = {
    sport: {
      label: "Sport",
      placeholder: "e.g. cycling, running, swimming",
      helper: "Primary sport or athletic discipline.",
      required: true,
    },
    training_years: {
      label: "Training Years (0–40)",
      placeholder: "e.g. 5",
      helper: "Total years of structured athletic training.",
      min: 0,
      max: 40,
      required: true,
    },
    vo2_max: {
      label: "VO₂ Max (10–90)",
      placeholder: "e.g. 45",
      helper: "Maximum oxygen uptake in ml/kg/min.",
      min: 10,
      max: 90,
      required: true,
    },
    hrv: {
      label: "HRV (0–200)",
      placeholder: "e.g. 65",
      helper: "Heart Rate Variability measured in milliseconds (ms).",
      min: 0,
      max: 200,
      required: true,
    },
    lactate_threshold: {
      label: "Lactate Threshold (1–30)",
      placeholder: "e.g. 8",
      helper: "Lactate threshold in mmol/L.",
      min: 1,
      max: 30,
      required: true,
    },
    stride_length: {
      label: "Stride Length (0.5–3.5)",
      placeholder: "e.g. 1.4",
      helper: "Average distance covered per step in meters.",
      min: 0.5,
      max: 3.5,
      required: true,
    },
    cadence: {
      label: "Cadence (50–220)",
      placeholder: "e.g. 180",
      helper: "Number of steps per minute during movement.",
      min: 50,
      max: 220,
      required: true,
    },
    force_application: {
      label: "Force Application (1–500)",
      placeholder: "e.g. 250",
      helper: "Estimated force generated during movement in Newtons (N).",
      min: 1,
      max: 500,
      required: true,
    },
    performance_score: {
      label: "Performance Score (0–100)",
      placeholder: "e.g. 75",
      helper: "Overall performance assessment score.",
      min: 0,
      max: 100,
      required: true,
    },
    adaptability_score: {
      label: "Adaptability Score (0–100)",
      placeholder: "e.g. 80",
      helper: "Ability to adapt to training and recovery demands.",
      min: 0,
      max: 100,
      required: true,
    },
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field specific error when user changes value
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    for (const key of Object.keys(fieldMetadata)) {
      const meta = fieldMetadata[key];
      const val = formData[key];

      if (meta.required && (!val || val.trim() === "")) {
        newErrors[key] = "This field is required.";
        isValid = false;
        continue;
      }

      if (key !== "sport") {
        const numVal = parseFloat(val);
        if (isNaN(numVal)) {
          newErrors[key] = "Must be a valid number.";
          isValid = false;
        } else {
          if (meta.min !== undefined && numVal < meta.min) {
            newErrors[key] = `Value must be at least ${meta.min}.`;
            isValid = false;
          }
          if (meta.max !== undefined && numVal > meta.max) {
            newErrors[key] = `Value cannot exceed ${meta.max}.`;
            isValid = false;
          }
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting.");
      return;
    }

    try {
      const res = await api.post("/api/score", formData);
      if (res.data.success) {
        toast.success(res.data.message);
        navigate("/dashboard");
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong.");
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
          noValidate // Let custom state validation handle it uniformly
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-1 lg:grid-cols-2">
            <div>
              <label
                htmlFor="sport"
                className="block text-sm font-semibold mb-1"
              >
                {fieldMetadata.sport.label}
              </label>
              <input
                id="sport"
                type="text"
                name="sport"
                placeholder={fieldMetadata.sport.placeholder}
                value={formData.sport}
                onChange={handleChange}
                className={`p-2 rounded bg-gray-700 text-white w-full focus:outline-none focus:ring-2 transition ${
                  errors.sport
                    ? "border border-red-500 focus:ring-red-500"
                    : "focus:ring-teal-500"
                }`}
              />
              {errors.sport ? (
                <p className="text-xs text-red-400 mt-1 font-medium">
                  {errors.sport}
                </p>
              ) : (
                <p id="sport-helper" className="text-xs text-gray-400 mt-1">
                  {fieldMetadata.sport.helper}
                </p>
              )}
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
                <label
                  htmlFor={field}
                  className="block text-sm font-semibold mb-1"
                >
                  {fieldMetadata[field].label}
                </label>
                <input
                  id={field}
                  type="number"
                  name={field}
                  step="any"
                  min={fieldMetadata[field].min}
                  max={fieldMetadata[field].max}
                  placeholder={fieldMetadata[field].placeholder}
                  value={formData[field]}
                  onChange={handleChange}
                  className={`p-2 rounded bg-gray-700 text-white w-full focus:outline-none focus:ring-2 transition ${
                    errors[field]
                      ? "border border-red-500 focus:ring-red-500"
                      : "focus:ring-teal-500"
                  }`}
                />
                {errors[field] ? (
                  <p className="text-xs text-red-400 mt-1 font-medium">
                    {errors[field]}
                  </p>
                ) : (
                  <p
                    id={`${field}-helper`}
                    className="text-xs text-gray-400 mt-1"
                  >
                    {fieldMetadata[field].helper}
                  </p>
                )}
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
