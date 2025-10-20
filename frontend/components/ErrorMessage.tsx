import React from "react";
import { AlertCircle, XCircle, Info } from "lucide-react";
import { ApiError } from "@/lib/api";

interface ErrorMessageProps {
  error: string | ApiError | null;
  variant?: "error" | "warning" | "info";
  showRequestId?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  variant = "error",
  showRequestId = true,
  onDismiss,
  className = "",
}) => {
  if (!error) return null;

  const isApiError = typeof error === "object" && "detail" in error;
  const errorMessage = isApiError ? error.detail : error;
  const requestId = isApiError ? error.request_id : undefined;

  const getIcon = () => {
    switch (variant) {
      case "warning":
        return (
          <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
        );
      case "info":
        return <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />;
      default:
        return <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />;
    }
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "info":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-red-50 border-red-200";
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "warning":
        return "text-yellow-700";
      case "info":
        return "text-blue-700";
      default:
        return "text-red-700";
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 ${getBackgroundColor()} ${className}`}
    >
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${getTextColor()}`}>
            {errorMessage}
          </p>
          {requestId && showRequestId && (
            <p className="mt-1 text-xs text-gray-500">
              Request ID: {requestId}
            </p>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 ${getTextColor()} hover:opacity-75`}
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Inline error message for form fields
export const InlineError: React.FC<{
  error: string | null;
  className?: string;
}> = ({ error, className = "" }) => {
  if (!error) return null;

  return (
    <div className={`flex items-center space-x-2 mt-1 ${className}`}>
      <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
      <p className="text-sm text-red-600">{error}</p>
    </div>
  );
};

// Success message component
export const SuccessMessage: React.FC<{
  message: string | null;
  onDismiss?: () => void;
  className?: string;
}> = ({ message, onDismiss, className = "" }) => {
  if (!message) return null;

  return (
    <div
      className={`rounded-lg border bg-green-50 border-green-200 p-4 ${className}`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="h-5 w-5 text-green-500">✓</div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-green-700">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-green-700 hover:opacity-75"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
