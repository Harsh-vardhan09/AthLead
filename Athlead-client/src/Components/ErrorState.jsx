import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

const ErrorState = ({
  title = "Something went wrong",
  message = "Failed to load data. Please try again.",
  error,
  onRetry,
  retryLabel = "Try Again",
  icon,
  fullScreen = false,
  className = "",
}) => {
  const Icon = icon || AlertCircle;
  const displayMessage =
    (typeof error === "string" && error) ||
    error?.response?.data?.message ||
    error?.message ||
    message;

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center p-6 text-center ${
        fullScreen ? "min-h-[60vh] w-full" : "w-full"
      } ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-3 shadow-inner">
        <Icon size={26} />
      </div>

      <h3 className="text-base sm:text-lg font-semibold text-white">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-300 max-w-md mt-1 mb-4">
        {displayMessage}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-linear-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <RotateCcw size={14} className="shrink-0" />
          <span>{retryLabel}</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
