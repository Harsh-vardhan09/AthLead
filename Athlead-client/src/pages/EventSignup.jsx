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
  } = useForm();

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
      try {
        const res = await eventService.getAll({ limit: 100 });
        const list = res.data?.events ?? res.data?.message ?? [];
        const found = Array.isArray(list)
          ? list.find((e) => String(e._id) === String(eventId))
          : null;
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
        // If the list cannot be loaded we still allow signup so a
        // transient listing failure does not block registration.
        if (!cancelled) setEventState({ status: "open", event: null });
      }
    };
    loadEvent();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

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

  const badgeText =
    eventState.status === "loading"
      ? "Checking event…"
      : eventState.status === "not-found"
        ? "Event not found"
        : eventState.status === "closed"
          ? "Registration closed"
          : eventState.status === "full"
            ? "Event full"
            : "Registration open";

  const formDisabled =
    isSubmitting ||
    eventState.status === "loading" ||
    eventState.status === "not-found" ||
    eventState.status === "closed" ||
    eventState.status === "full";

  const spotsLeft =
    eventState.event?.capacity != null
      ? Math.max(
          0,
          eventState.event.capacity - (eventState.event.registeredCount || 0),
        )
      : null;

  return (
    <section className="dark-bg relative max-w-screen min-h-screen flex items-center justify-center ">
      <div className="h-2/3 max-w-180 w-full bg-linear-to-br from-[#0f2027] via-[#1a3a4a] to-[#0f2027] border border-[#1d9e75]/40 text-start text-white rounded-2xl shadow-xl">
        <div className="text-center pt-6 pb-2 px-8">
          <span className="inline-flex items-center gap-1.5 bg-[#1d9e75]/15 border border-[#1d9e75]/40 text-[#5dcaa5] text-xs font-medium px-3 py-1 rounded-full mb-3">
            ● {badgeText}
          </span>
          {eventState.event && (
            <p className="text-sm text-white/70">
              {eventState.event.title}
              {spotsLeft !== null ? ` · ${spotsLeft} spots left` : ""}
            </p>
          )}
          {eventState.status === "not-found" && (
            <p className="text-sm text-red-300 mt-2">
              This event could not be found. Check the link or browse other
              events.
            </p>
          )}
          {(eventState.status === "closed" ||
            eventState.status === "full") && (
            <p className="text-sm text-amber-200 mt-2">
              {eventState.status === "closed"
                ? "This event has ended or is no longer accepting registrations."
                : "This event has reached maximum capacity."}
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3 px-8 pb-8"
        >
          <div>
            <label className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              placeholder="John Doe..."
              {...register("fullname", {
                required: "Full name is required",
                minLength: { value: 2, message: "Enter your full name" },
                maxLength: { value: 50, message: "Must be under 50 letters" },
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
                  value: /^[a-zA-Z0-9._%+-]+[@][a-zA-Z0-9.-]+[.][a-zA-Z]{2,}$/,
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

          <div className="grid grid-cols-1 gap-3 ">
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
                  inputMode="numeric"
                  placeholder="98765 43210"
                  {...register("phone", {
                    required: "Phone number is required",
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: "Enter a 10-digit mobile number",
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
                      required: { value: true, message: "Required" },
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
