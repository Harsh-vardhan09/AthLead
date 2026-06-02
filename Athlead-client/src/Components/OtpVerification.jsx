import { useRef, useState, useEffect, useCallback } from "react";
import { api } from "../api/axios";
import toast from "react-hot-toast";

// localStorage key where the OTP session UUID is stored
export const OTP_SESSION_KEY = "athlead_otp_session";

/**
 * OtpVerification
 *
 * Props:
 *   maskedEmail  {string}    - display-only masked email e.g. "j***@gmail.com"
 *   onVerified   {function}  - called with no args when OTP is confirmed
 *   onBack       {function}  - called when user clicks "← Back"
 *
 * Reads  sessionId from localStorage[OTP_SESSION_KEY] — set by Signup.jsx after send-otp.
 * Never sends email to the backend — all calls use sessionId only.
 */
const OtpVerification = ({ maskedEmail, onVerified, onBack }) => {
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60); // seconds until resend is allowed
  const inputRefs = useRef([]);

  // ── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getSessionId = () => localStorage.getItem(OTP_SESSION_KEY);

  const clearDigits = () => {
    setOtpDigits(Array(6).fill(""));
    setTimeout(() => inputRefs.current[0]?.focus(), 0);
  };

  // ── Input handlers ─────────────────────────────────────────────────────────
  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value.slice(-1);
    setOtpDigits(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!digits) return;
    const next = Array(6).fill("");
    digits.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setOtpDigits(next);
    inputRefs.current[Math.min(digits.length, 5)]?.focus();
    e.preventDefault();
  };

  // ── Verify ─────────────────────────────────────────────────────────────────
  const handleVerify = async () => {
    const otp = otpDigits.join("");
    const sessionId = getSessionId();

    if (otp.length < 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }
    if (!sessionId) {
      toast.error("Session expired. Please go back and try again.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/auth/verify-otp", { sessionId, otp });

      if (res.data.success) {
        toast.success("Email verified!");
        onVerified();
      } else {
        toast.error(res.data.message || "Invalid OTP");
        clearDigits();

        // If the session was killed (expired / locked), send user back
        if (res.data.expired || res.data.locked) {
          localStorage.removeItem(OTP_SESSION_KEY);
          setTimeout(onBack, 1500);
        }
      }
    } catch (err) {
      const data = err?.response?.data ?? {};
      toast.error(data.message || "Verification failed");
      clearDigits();
      if (data.expired || data.locked) {
        localStorage.removeItem(OTP_SESSION_KEY);
        setTimeout(onBack, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Resend ─────────────────────────────────────────────────────────────────
  const handleResend = useCallback(async () => {
    if (cooldown > 0 || resendLoading) return;

    const sessionId = getSessionId();
    if (!sessionId) {
      toast.error("Session expired. Please go back and start over.");
      return;
    }

    setResendLoading(true);
    try {
      const res = await api.post("/api/auth/resend-otp", { sessionId });

      if (res.data.success) {
        toast.success("New OTP sent to your email!");
        setCooldown(60);
        clearDigits();
      } else {
        toast.error(res.data.message || "Could not resend OTP");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not resend OTP");
    } finally {
      setResendLoading(false);
    }
  }, [cooldown, resendLoading]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const allFilled = otpDigits.every(Boolean);

  return (
    <div className="flex flex-col items-center gap-6 px-5 py-8 w-full">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-white font-akkurat text-2xl font-extrabold">
          Verify Your Email
        </h3>
        <p className="text-sm text-white/50 mt-2 max-w-xs leading-relaxed">
          We sent a 6-digit code to{" "}
          <span className="text-teal-400 font-semibold">{maskedEmail}</span>.
          <br />
          It expires in <span className="text-white/70">5 minutes</span>.
        </p>
      </div>

      {/* OTP digit inputs */}
      <div className="flex gap-3" onPaste={handlePaste}>
        {otpDigits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            autoFocus={i === 0}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={[
              "w-11 h-13 text-center text-xl font-bold text-white rounded-xl border",
              "bg-white/5 focus:outline-none transition-all duration-150",
              digit ? "border-teal-400 bg-teal-400/10" : "border-white/20",
              "focus:border-teal-400 focus:bg-teal-400/10",
            ].join(" ")}
          />
        ))}
      </div>

      {/* Verify button */}
      <button
        onClick={handleVerify}
        disabled={loading || !allFilled}
        className="w-full border border-white/20 rounded-md h-9
          bg-linear-to-r from-teal-400 via-teal-800 to-blue-400
          cursor-pointer hover:from-teal-600 hover:to-blue-800
          hover:scale-105 transition-all hover:duration-200
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
          text-white font-medium text-sm"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Verifying…
          </span>
        ) : (
          "Verify OTP"
        )}
      </button>

      {/* Resend row */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm text-white/40">
          Didn&apos;t receive it?{" "}
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || resendLoading}
            className={[
              "font-medium transition-colors",
              cooldown > 0 || resendLoading
                ? "text-white/25 cursor-not-allowed"
                : "text-teal-400 cursor-pointer hover:text-teal-300 underline underline-offset-2",
            ].join(" ")}
          >
            {resendLoading
              ? "Sending…"
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend OTP"}
          </button>
        </p>
        {cooldown > 0 && (
          <div className="w-40 h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-400/60 transition-all duration-1000"
              style={{ width: `${((60 - cooldown) / 60) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Back link */}
      <button
        onClick={() => {
          localStorage.removeItem(OTP_SESSION_KEY);
          onBack();
        }}
        className="text-xs text-white/30 hover:text-white/60 transition-colors cursor-pointer mt-1"
      >
        ← Back to signup
      </button>
    </div>
  );
};

export default OtpVerification;
