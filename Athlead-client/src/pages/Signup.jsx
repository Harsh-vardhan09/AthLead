import { Eye, EyeClosed, Calendar } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../api/axios";
import CalendarPicker from "../Components/CalendarPicker";
import OtpVerification, {
  OTP_SESSION_KEY,
} from "../Components/OtpVerification.jsx";

// ── Step constants ────────────────────────────────────────────────────────────
const STEP_FORM = "form";
const STEP_OTP = "otp";
const STEP_SUBMITTING = "submitting";

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Masks "john.doe@gmail.com" → "j***@gmail.com" for display-only privacy. */
const maskEmail = (email) => {
  const [local, domain] = email.split("@");
  return `${local[0]}***@${domain}`;
};

// ─────────────────────────────────────────────────────────────────────────────
const Signup = () => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm();

  const [show, setShow] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [step, setStep] = useState(STEP_FORM);
  const [maskedEmail, setMaskedEmail] = useState(""); // display only
  const [sendingOtp, setSendingOtp] = useState(false);

  const navigate = useNavigate();

  // ── Step 1: submit form → call send-otp → save sessionId → show OTP screen ──
  const onSubmitForm = async (data) => {
    setSendingOtp(true);
    try {
      console.log("BASE URL:", import.meta.env.VITE_BASE_URL);
      const res = await api.post("/api/auth/send-otp", { email: data.email });

      if (res.data.success) {
        // Store the UUID in localStorage — OtpVerification reads it from there.
        // We never put email in localStorage; the UUID maps to email server-side.
        localStorage.setItem(OTP_SESSION_KEY, res.data.sessionId);
        setMaskedEmail(maskEmail(data.email));
        toast.success("OTP sent to your email!");
        setStep(STEP_OTP);
      } else {
        toast.error(res.data.message || "Could not send OTP");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  // ── Step 2: OTP verified → POST signup with sessionId (no email in body) ────
  const onOtpVerified = async () => {
    const data = getValues();

    // Format DOB from DD/MM/YYYY → YYYY-MM-DD for the backend
    const formattedData = { ...data };
    if (data.DOB) {
      const [day, month, year] = data.DOB.split("/");
      formattedData.DOB = `${year}-${month}-${day}`;
    }

    // Remove email from the payload — the backend reads it from the OTP session.
    // This prevents a client-side email substitution after verification.
    delete formattedData.email;

    const sessionId = localStorage.getItem(OTP_SESSION_KEY);
    if (!sessionId) {
      toast.error("Session lost. Please start over.");
      setStep(STEP_FORM);
      return;
    }

    setStep(STEP_SUBMITTING);
    try {
      const res = await api.post("/api/auth/signup", {
        ...formattedData,
        sessionId, // backend looks up email via this UUID
      });

      if (res.data.success) {
        localStorage.removeItem(OTP_SESSION_KEY); // clean up
        toast.success(res.data.message);
        navigate("/login");
      } else {
        toast.error(res.data.message || "Signup failed. Please try again.");
        setStep(STEP_OTP);
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Signup failed. Please try again.",
      );
      setStep(STEP_OTP);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section className="dark-bg relative max-w-screen min-h-screen flex items-center justify-center bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[60px_60px] bg-repeat overflow-hidden">
      <Toaster />
      <div className="h-2/3 max-w-96 w-full bg-[#08325b]/30 border border-[#47a2bf]/60 text-start text-white rounded-xl">
        {/* ── OTP screen (shown during otp + submitting steps) ──── */}
        {(step === STEP_OTP || step === STEP_SUBMITTING) && (
          <OtpVerification
            maskedEmail={maskedEmail}
            onVerified={onOtpVerified}
            onBack={() => {
              localStorage.removeItem(OTP_SESSION_KEY);
              setStep(STEP_FORM);
            }}
          />
        )}

        {/* ── Signup form ───────────────────────────────────────── */}
        {step === STEP_FORM && (
          <>
            <div className="px-5">
              <h3 className="text-white font-akkurat text-2xl font-extrabold pt-5">
                Create Account
              </h3>
              <p className="basic text-sm pt-2">
                Already Registered?{" "}
                <span
                  className="text-lg bg-linear-to-r from-teal-400 to-blue-200 bg-clip-text text-transparent cursor-pointer"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </span>
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmitForm)}
              className="flex flex-col gap-3 p-8"
            >
              {/* Full Name */}
              <div className="w-full">
                <label className="label">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe..."
                  {...register("fullname", {
                    required: true,
                    maxLength: { value: 20, message: "Must be < 20 letters" },
                  })}
                  className={`input mb-4 ${errors.fullname ? "border-red-500/80" : "border-white/30"}`}
                />
                {errors.fullname && (
                  <p className="text-sm text-red-700">
                    {errors.fullname.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  placeholder="XXX@ABC.com"
                  {...register("email", {
                    required: true,
                    pattern: {
                      value:
                        /^[a-zA-Z0-9._%+-]+[@][a-zA-Z0-9.-]+[.][a-zA-Z]{2,}$/,
                      message: "Wrong email format",
                    },
                  })}
                  className={`input mb-4 ${errors.email ? "border-red-500/80" : "border-white/30"}`}
                />
                {errors.email && (
                  <p className="text-sm text-red-700">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="label">Phone</label>
                <input
                  type="number"
                  placeholder="+91 XXX XXX"
                  {...register("phone")}
                  className={`input mb-4 ${errors.phone ? "border-red-500/80" : "border-white/30"}`}
                />
              </div>

              {/* Date of Birth */}
              <div className="w-full relative">
                <label className="label">Date of Birth</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    {...register("DOB", {
                      required: "Date of Birth is Required",
                      pattern: {
                        value:
                          /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
                        message: "Use DD/MM/YYYY Format",
                      },
                      validate: {
                        notFuture: (value) => {
                          const [day, month, year] = value
                            .split("/")
                            .map(Number);
                          const dob = new Date(year, month - 1, day);
                          const minDate = new Date();
                          minDate.setHours(0, 0, 0, 0);
                          return (
                            dob < minDate ||
                            "Date of Birth should not be today or later"
                          );
                        },
                      },
                    })}
                    className={`input mb-4 pr-10 ${errors.DOB ? "border-red-500/80" : "border-white/30"}`}
                    readOnly
                  />
                  <Calendar
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-full cursor-pointer hover:text-[#5dcaa5] transition-colors"
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  />
                  {isCalendarOpen && (
                    <CalendarPicker
                      selectedDate={watch("DOB")}
                      onSelect={(formatted) => {
                        setValue("DOB", formatted);
                      }}
                      onClose={() => setIsCalendarOpen(false)}
                    />
                  )}
                </div>
                {errors.DOB && (
                  <p className="text-sm text-red-700">{errors.DOB.message}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <div className="flex gap-2.5">
                  {["male", "female"].map((g) => (
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
                      {g === "male" ? "♂" : "♀"}{" "}
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

              {/* Password */}
              <div>
                <fieldset
                  className={`input mb-4 ${errors.password ? "border-red-500/80" : "border-white/30"}`}
                >
                  <input
                    type={show ? "text" : "password"}
                    placeholder="Enter Password"
                    {...register("password", {
                      required: true,
                      pattern: {
                        value: /[a-zA-z0-9_\-.@$]{7,16}/i,
                        message: "Need 7-16 chars, special characters allowed",
                      },
                    })}
                    className="transparent w-full h-full focus:outline-none focus:ring-0"
                  />
                  <div
                    onClick={() => setShow((e) => !e)}
                    className="cursor-pointer"
                  >
                    {show ? <Eye /> : <EyeClosed />}
                  </div>
                </fieldset>
                {errors.password && (
                  <p className="text-sm text-red-700">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={sendingOtp}
                className="w-full border border-white/20 rounded-md h-9 bg-linear-to-r from-teal-400 via-teal-800 to-blue-400 cursor-pointer hover:from-teal-600 hover:to-blue-800 hover:scale-105 transition-all hover:duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {sendingOtp ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending OTP…
                  </span>
                ) : (
                  "Continue →"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
};

export default Signup;
