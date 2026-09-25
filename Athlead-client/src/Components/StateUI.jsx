/**
 * Reusable UI state components for Loading, Empty, and Error states.
 * Apply these consistently across Events, Dashboard, Rankings, Score, and Announcements pages.
 */
import React from "react";
import { Loader2, AlertCircle, Inbox, RefreshCw } from "lucide-react";

/**
 * Loading state — full-area centered spinner with optional message.
 */
export function LoadingState({ message = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
      <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

/**
 * Empty state — icon + heading + optional description for zero-result lists.
 */
export function EmptyState({
  heading = "Nothing here yet",
  description,
  icon: Icon = Inbox,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-400">
      <Icon className="h-10 w-10 text-slate-300" />
      <p className="text-base font-semibold text-slate-500">{heading}</p>
      {description && (
        <p className="max-w-xs text-center text-sm">{description}</p>
      )}
    </div>
  );
}

/**
 * Error state — alert icon + message + optional retry button.
 */
export function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
      <AlertCircle className="h-8 w-8 text-red-400" />
      <p className="text-sm font-medium text-red-500">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </button>
      )}
    </div>
  );
}
