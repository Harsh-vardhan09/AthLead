import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { eventService } from "../api";
import toast from "react-hot-toast";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";

const EventSignup = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    mode: "onBlur", // Immediate inline feedback as users interact with fields
  });

  const navigate = useNavigate();
  const { eventId } = useParams();
  const { allowNavigation } = useUnsavedChanges(isDirty);

  const onSubmit = async (data) => {
    try {
      const res = await eventService.register(eventId, data);

      if (res.data.success) {
        reset(data);
        allowNavigation();
        toast.success(res.data.message);
        navigate("/events");
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not register for event",
      );
    }
  };

  return (
    <section className="dark-bg relative max-w-screen min-h-screen flex items-center justify-center ">
      <div className="h-2/3 max-w-180 w-full bg-linear-to-br from-[#0f2027] via-[#1a3a4a] to-[#0f2027] border border-[#1d9e75]/40 text-start text-white rounded-2xl shadow-xl">
        <div className="text-center pt-6 pb-2 px-8">
          <span className="inline-flex items-center gap-1.5 bg-[#1d9e75]/15 border border-[#1d9e75]/40 text-[#5dcaa5] text-xs font-medium px-3 py-1 rounded-full mb-3">
            ● Registration open
          </span>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3 px-8 pb-8"
        >
          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              placeholder="John Doe..."
              {...register("fullname", {
                required: "Full name is required",
                maxLength: { value: 20, message: "Must be < 20 letters" },
              })}
              className={`w-full bg-white/7 border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:bg-[#1d9e75]/8 transition-all ${
                errors.fullname ? "border-red-500/80" : "border-white/12"
              }`}
            />
            {errors.fullname && (
              <p className="text-xs text-red-400 mt-1">
                {errors.fullname.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5">
              Email
            </label>
            <input
              type="email"
              placeholder="you@email.com"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+[@][a-zA-Z0-9.-]+[.][a-zA-Z]{2,}\$/,
                  message: "Wrong email format",
                },
              })}
              className={`w-full bg-white/7 border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:bg-[#1d9e75]/8 transition-all ${
                errors.email ? "border-red-500/80" : "border-white/12"
              }`}
            />
            {errors.email && (
              <p className="text-xs text-red-400 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5">
                Phone
              </label>
              <div className="flex gap-2">
                <span className="bg-white/7 border border-white/12 rounded-xl px-3 py-2.5 text-sm text-white/50 whitespace-nowrap">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="9876543210"
                  {...register("phone", {
                    required: "Phone number is required",
                    pattern: {
                      value: /^[6-9]\d{9}\$/,
                      message: "Please enter a valid 10-digit mobile number",
                    },
                  })}
                  className={`flex-1 max-w-full bg-white/7 border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:bg-[#1d9e75]/8 transition-all ${
                    errors.phone ? "border-red-500/80" : "border-white/12"
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5">
              Gender
            </label>
            <div className="flex gap-2.5">
              {["male", "female", "other"].map((g) => (
                <label
                  key={g}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/12 bg-white/5 text-sm text-white/50 cursor-pointer has-checked:border-[#1d9e75] has-checked:bg-[#1d9e75]/15 has-checked:text-[#5dcaa5] has-checked:font-medium transition-all"
                >
                  <input
                    type="radio"
                    value={g}
                    {...register("gender", {
                      required: "Please select a gender",
                    })}
                    className="hidden"
                  />
                  {g === "male" ? "♂" : g === "female" ? "♀" : "⚧"}{" "}
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </label>
              ))}
            </div>
            {errors.gender && (
              <p className="text-xs text-red-400 mt-1">
                {errors.gender.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-1 py-3.5 rounded-xl bg-gradient-to-r from-[#1d9e75] to-[#378add] text-white text-sm font-semibold tracking-wide cursor-pointer hover:opacity-90 active:scale-99 transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Registering…" : "Register Now"}
          </button>

          <p className="text-center text-[11px] text-white/25 mt-1">
            Your data is safe with us · No spam, ever
          </p>
        </form>
      </div>
    </section>
  );
};

export default EventSignup;
