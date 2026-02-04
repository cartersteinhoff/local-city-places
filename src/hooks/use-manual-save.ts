"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type SaveStatus = "clean" | "dirty" | "saving" | "saved" | "error";

interface UseManualSaveOptions<T> {
  data: T;
  originalData: T;
  onSave: (data: T) => Promise<void>;
  enabled?: boolean;
}

interface UseManualSaveReturn {
  status: SaveStatus;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
  save: () => Promise<void>;
  retry: () => Promise<void>;
}

export function useManualSave<T>({
  data,
  originalData,
  onSave,
  enabled = true,
}: UseManualSaveOptions<T>): UseManualSaveReturn {
  const [status, setStatus] = useState<SaveStatus>("clean");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dataRef = useRef<T>(data);
  const isSavingRef = useRef(false);

  // Update ref when data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Check if data has changed from original (only if enabled)
  const isDirty = enabled && JSON.stringify(data) !== JSON.stringify(originalData);

  // Update status based on dirty state
  useEffect(() => {
    if (status === "clean" || status === "saved") {
      if (isDirty) {
        setStatus("dirty");
      }
    } else if (status === "dirty" && !isDirty) {
      setStatus("clean");
    }
  }, [isDirty, status]);

  // Perform the save
  const save = useCallback(async () => {
    if (isSavingRef.current) return;
    if (!isDirty) return;

    isSavingRef.current = true;
    setStatus("saving");
    setError(null);

    try {
      await onSave(dataRef.current);
      setLastSaved(new Date());
      setStatus("saved");

      // Transition to clean after brief "saved" display
      setTimeout(() => {
        setStatus((prev) => (prev === "saved" ? "clean" : prev));
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setStatus("error");
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, isDirty]);

  // Retry after error
  const retry = useCallback(async () => {
    if (status === "error") {
      await save();
    }
  }, [status, save]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, enabled]);

  return {
    status,
    isDirty,
    isSaving: status === "saving",
    lastSaved,
    error,
    save,
    retry,
  };
}
