import React from "react";
import LoadingState from "./LoadingState";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";

export { LoadingState, EmptyState, ErrorState };

export const AsyncState = ({
  isLoading,
  error,
  isEmpty,
  onRetry,
  loadingComponent,
  errorComponent,
  emptyComponent,
  loadingMessage = "Loading...",
  loadingDescription,
  loadingSize = "md",
  errorTitle,
  errorMessage,
  emptyTitle,
  emptyDescription,
  emptyAction,
  emptyActionLabel,
  onEmptyAction,
  emptyIcon,
  fullScreen = false,
  className = "",
  children,
}) => {
  if (isLoading) {
    return (
      loadingComponent || (
        <LoadingState
          message={loadingMessage}
          description={loadingDescription}
          size={loadingSize}
          fullScreen={fullScreen}
          className={className}
        />
      )
    );
  }

  if (error) {
    return (
      errorComponent || (
        <ErrorState
          title={errorTitle}
          message={errorMessage}
          error={error}
          onRetry={onRetry}
          fullScreen={fullScreen}
          className={className}
        />
      )
    );
  }

  if (isEmpty) {
    return (
      emptyComponent || (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
          icon={emptyIcon}
          className={className}
        />
      )
    );
  }

  return children;
};

export default AsyncState;
