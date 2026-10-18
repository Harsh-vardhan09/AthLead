import React, { useEffect, useState } from "react";
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

  const [eventState, setEventState] = useState({
    status: "loading",
    event: null,
  });

  useEffect(() => {
    let cancelled = false;
    const loadEvent = async () => {
      if (!eventId) {
        if (!cancelled) setEventState({ status: "not-found", event: null });
        return;
      }
      if (!cancelled) setEventState({ status: "loading", event: null });
      try {
        const limit = 100;
        let page = 1;
        let found = null;
        for (let attempt = 0; attempt < 20; attempt++) {
          const res = await eventService.getAll({ limit, page });
          const list = res.data?.events ?? res.data?.message ?? [];
          if (Array.isArray(list)) {
            found = list.find((e) => String(e._id) === String(eventId)) ?? null;
          }
          if (found) break;
          const pagination = res.data?.pagination;
          if (!pagination?.hasMore) break;
          page = (pagination.page ?? page) + 1;
        }
        if (!cancelled) {
          if (!found) {
            setEventState({ status: "not-found", event: null });
            return;
          }
          const isPast = found.date
            ? new Date(found.date).getTime() < new Date().setHours(0, 0, 0, 0)
            : false;
          const isFull =
            found.capacity != null &&
            (found.registeredCount || 0) >= found.capacity;
          if (isPast) setEventState({ status: "closed", event: found });
          else if (isFull) setEventState({ status: "full", event: found });
          else setEventState({ status: "open", event: found });
        }
      } catch {
        if (!cancelled) setEventState({ status: "unavailable", event: null });
      }
    };
    loadEvent();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const onSubmit = async (data) => {
    if (eventState.status !== "open") {
      toast.error("Registration is not available for this event.");
      return;
    }
    try {
      const digits = String(data.phone ?? "").replace(/\D/g, "");
      const res = await eventService.register(eventId, {
        ...data,
        phone: digits,
      });

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

  const badgeText =
    eventState.status === "loading"
      ? "Checking event…"
      : eventState.status === "not-found"
        ? "Event not found"
        : eventState.status === "closed"
          ? "Registration closed"
          : eventState.status === "full"
            ? "Event full"
            : eventState.status === "unavailable"
              ? "Event unavailable"
              : "Registration open";

  const formDisabled =
    isSubmitting ||
    eventState.status === "loading" ||
    eventState.status === "not-found" ||
    eventState.status === "closed" ||
    eventState.status === "full" ||
    eventState.status === "unavailable";

  return (
    <section className="dark-bg relative max-w-screen min-h-screen flex items-center justify-center">
      <div className="h-2/3 max-w-180 w-full bg-linear-to-br from-[#0f2027] via-[#1a3a4a] to-[#0f2027] border border-[#1d9e75]/40 text-start text-white rounded-2xl shadow-xl">
        <div className="text-center pt-6 pb-2 px-8">
          <span className="inline-flex items-center gap-1.5 bg-[#1d9e75]/15 border border-[#1d9e75]/40 text-[#5dcaa5] text-xs font-medium px-3 py-1 rounded-full mb-3">
            ● {badgeText}
          </span>
          {eventState.event?.title && (
            <h1 className="text-xl font-bold text-white mt-1">
              {eventState.event?.title}
            </h1>
          )}
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3 px-8 pb-8"
        >
          {/* Full Name */}
          <div>
            <label
              htmlFor="fullname"
              className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5"
            >
              Full Name
            </label>
            <input
              id="fullname"
              type="text"
              placeholder="John Doe..."
              aria-invalid={errors.fullname ? "true" : "false"}
              aria-describedby={errors.fullname ? "fullname-error" : undefined}
              {...register("fullname", {
                required: "Full name is required",
                minLength: {
                  value: 3,
                  message: "Full name must be at least 3 characters",
                },
              })}
              className={`w-full bg-white/7 border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:bg-[#1d9e75]/8 transition-all ${
                errors.fullname ? "border-red-500/80" : "border-white/12"
              }`}
            />
            {errors.fullname && (
              <p id="fullname-error" className="text-xs text-red-400 mt-1">
                {errors.fullname.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@email.com"
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\$/,
                  message: "Wrong email format",
                },
              })}
              className={`w-full bg-white/7 border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:bg-[#1d9e75]/8 transition-all ${
                errors.email ? "border-red-500/80" : "border-white/12"
              }`}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-red-400 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label
                htmlFor="phone"
                className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5"
              >
                Phone
              </label>
              <div className="flex gap-2">
                <span className="bg-white/7 border border-white/12 rounded-xl px-3 py-2.5 text-sm text-white/50 whitespace-nowrap">
                  +91
                </span>
                <input
                  id="phone"
                  type="tel"
                  placeholder="9876543210"
                  aria-invalid={errors.phone ? "true" : "false"}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                  {...register("phone", {
                    required: "Phone number is required",
                    pattern: {
                      value: /^[6-9]\d{9}\$/,
                      message:
                        "Enter a valid 10-digit phone number starting with 6-9",
                    },
                  })}
                  className={`flex-1 max-w-full bg-white/7 border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:bg-[#1d9e75]/8 transition-all ${
                    errors.phone ? "border-red-500/80" : "border-white/12"
                  }`}
                />
              </div>
              {errors.phone && (
                <p id="phone-error" className="text-xs text-red-400 mt-1">
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
                    aria-invalid={errors.gender ? "true" : "false"}
                    aria-describedby={
                      errors.gender ? "gender-error" : undefined
                    }
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
              <p id="gender-error" className="text-xs text-red-400 mt-1">
                {errors.gender.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={formDisabled}
            className="w-full mt-1 py-3.5 rounded-xl bg-gradient-to-r from-[#1d9e75] to-[#378add] text-white text-sm font-semibold tracking-wide cursor-pointer hover:opacity-90 active:scale-99 transition-all disabled:opacity-50"
          >
            {eventState.status === "loading"
              ? "Loading event…"
              : isSubmitting
                ? "Registering…"
                : "Register Now"}
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
