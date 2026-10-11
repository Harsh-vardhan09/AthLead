import React from "react";
import { Loader2 } from "lucide-react";

const LoadingState = ({
  message = "Loading...",
  description,
  size = "md",
  fullScreen = false,
  className = "",
}) => {
  const sizeMap = {
    sm: { icon: 20, text: "text-xs", desc: "text-[11px]" },
    md: { icon: 32, text: "text-sm", desc: "text-xs" },
    lg: { icon: 44, text: "text-base", desc: "text-sm" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center p-6 text-center ${
        fullScreen ? "min-h-[60vh] w-full" : "w-full"
      } ${className}`}
    >
      <Loader2
        size={currentSize.icon}
        className="animate-spin text-teal-400 mb-3"
      />
      {message && (
        <p className={`font-medium text-slate-200 ${currentSize.text}`}>
          {message}
        </p>
      )}
      {description && (
        <p className={`text-slate-400 mt-1 max-w-sm ${currentSize.desc}`}>
          {description}
        </p>
      )}
      <span className="sr-only">Loading</span>
    </div>
  );
};

export default LoadingState;
