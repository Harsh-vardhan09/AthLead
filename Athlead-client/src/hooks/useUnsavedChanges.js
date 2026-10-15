import { useCallback, useEffect, useRef } from "react";
import { useBeforeUnload, useBlocker } from "react-router-dom";

const UNSAVED_CHANGES_MESSAGE =
  "You have unsaved changes. Are you sure you want to leave?";

export const useUnsavedChanges = (isDirty) => {
  const allowNavigationRef = useRef(false);

  const shouldBlockNavigation = useCallback(
    () => isDirty && !allowNavigationRef.current,
    [isDirty],
  );

  const blocker = useBlocker(shouldBlockNavigation);

  useBeforeUnload(
    useCallback(
      (event) => {
        if (!isDirty || allowNavigationRef.current) {
          return;
        }

        event.preventDefault();
        event.returnValue = "";
      },
      [isDirty],
    ),
  );

  useEffect(() => {
    if (blocker.state !== "blocked") {
      return;
    }

    if (window.confirm(UNSAVED_CHANGES_MESSAGE)) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker]);

  const confirmDiscard = useCallback(
    (onDiscard) => {
      if (!isDirty || window.confirm(UNSAVED_CHANGES_MESSAGE)) {
        onDiscard();
      }
    },
    [isDirty],
  );

  const allowNavigation = useCallback(() => {
    allowNavigationRef.current = true;
  }, []);

  return { allowNavigation, confirmDiscard };
};
