"use client";

import { Loader2, Check, AlertCircle, RefreshCw } from "lucide-react";
import { AutoSaveStatus } from "@/hooks/use-auto-save";

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  lastSaved: Date | null;
  error: string | null;
  onRetry?: () => void;
  className?: string;
}

export function AutoSaveIndicator({
  status,
  lastSaved,
  error,
  onRetry,
  className,
}: AutoSaveIndicatorProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className={className}>
      {status === "clean" && (
        <span className="text-sm text-muted-foreground">All changes saved</span>
      )}
      {status === "dirty" && (
        <span className="text-sm text-yellow-600">Unsaved changes</span>
      )}
      {status === "saving" && (
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Saving...
        </span>
      )}
      {status === "saved" && lastSaved && (
        <span className="text-sm text-green-600 flex items-center gap-1">
          <Check className="w-3 h-3" />
          Saved at {formatTime(lastSaved)}
        </span>
      )}
      {status === "error" && (
        <span className="text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="w-3 h-3" />
          {error || "Error saving"}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          )}
        </span>
      )}
    </div>
  );
}
