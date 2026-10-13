import React from "react";
import { Inbox } from "lucide-react";

const EmptyState = ({
  title = "No data available",
  description,
  icon,
  action,
  actionLabel,
  onAction,
  className = "",
}) => {
  const Icon = icon || Inbox;
  return (
    <div
      role="region"
      aria-label={title}
      className={`flex flex-col items-center justify-center p-8 text-center text-slate-300 w-full ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
        <Icon size={26} className="text-teal-400/80" />
      </div>

      <h3 className="text-base sm:text-lg font-semibold text-slate-200">
        {title}
      </h3>

      {description && (
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mt-1 mb-4">
          {description}
        </p>
      )}

      {action ? (
        action
      ) : onAction && actionLabel ? (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/30 hover:bg-teal-500/20 transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
};

export default EmptyState;
