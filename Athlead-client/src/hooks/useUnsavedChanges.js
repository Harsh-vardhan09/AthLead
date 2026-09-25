import { useEffect, useCallback } from "react";
import { useBeforeUnload, unstable_useBlocker as useBlocker } from "react-router-dom";

/**
 * Warns the user before navigating away when there are unsaved form changes.
 *
 * @param {boolean} isDirty - true when the form has unsaved changes
 * @param {string} [message] - optional custom warning message
 *
 * Usage:
 *   const { resetDirty } = useUnsavedChanges(isDirty);
 *   // Call resetDirty() after a successful form submission
 */
export function useUnsavedChanges(
  isDirty,
  message = "You have unsaved changes. Are you sure you want to leave?",
) {
  // Browser tab close / refresh
  useBeforeUnload(
    useCallback(
      (event) => {
        if (isDirty) {
          event.preventDefault();
          event.returnValue = message;
        }
      },
      [isDirty, message],
    ),
  );

  // In-app navigation (React Router v6.4+ blocker)
  const blocker = useBlocker(
    useCallback(({ currentLocation, nextLocation }) => {
      return isDirty && currentLocation.pathname !== nextLocation.pathname;
    }, [isDirty]),
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      if (window.confirm(message)) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker, message]);
}
