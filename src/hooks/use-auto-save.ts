"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type AutoSaveStatus = "clean" | "dirty" | "saving" | "saved" | "error";

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  debounceMs?: number;
  maxUndoHistory?: number;
  enabled?: boolean;
}

interface UseAutoSaveReturn<T> {
  status: AutoSaveStatus;
  lastSaved: Date | null;
  error: string | null;
  canUndo: boolean;
  undo: () => T | null;
  saveNow: () => Promise<void>;
  retry: () => Promise<void>;
  markDirty: () => void;
}

export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 3000,
  maxUndoHistory = 5,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const [status, setStatus] = useState<AutoSaveStatus>("clean");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [undoHistory, setUndoHistory] = useState<T[]>([]);

  const dataRef = useRef<T>(data);
  const lastSavedDataRef = useRef<T>(data);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  // Update ref when data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Check if data has changed from last saved
  const hasChanges = useCallback(() => {
    return JSON.stringify(dataRef.current) !== JSON.stringify(lastSavedDataRef.current);
  }, []);

  // Perform the save
  const performSave = useCallback(async () => {
    if (isSavingRef.current) return;
    if (!hasChanges()) {
      setStatus("clean");
      return;
    }

    isSavingRef.current = true;
    setStatus("saving");
    setError(null);

    const dataToSave = dataRef.current;

    try {
      await onSave(dataToSave);

      // Push to undo history (only keep last N states)
      setUndoHistory((prev) => {
        const newHistory = [...prev, lastSavedDataRef.current];
        return newHistory.slice(-maxUndoHistory);
      });

      lastSavedDataRef.current = dataToSave;
      setLastSaved(new Date());
      setStatus("saved");

      // After a moment, check if still clean
      setTimeout(() => {
        if (!hasChanges()) {
          setStatus("clean");
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setStatus("error");
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, hasChanges, maxUndoHistory]);

  // Debounced save trigger
  useEffect(() => {
    if (!enabled) return;

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Check if we have changes
    if (hasChanges() && status !== "saving") {
      setStatus("dirty");

      // Set new timer
      timerRef.current = setTimeout(() => {
        performSave();
      }, debounceMs);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, enabled, debounceMs, hasChanges, performSave, status]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status === "dirty" || status === "saving") {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [status]);

  // Undo to previous state
  const undo = useCallback((): T | null => {
    if (undoHistory.length === 0) return null;

    const previousState = undoHistory[undoHistory.length - 1];
    setUndoHistory((prev) => prev.slice(0, -1));
    lastSavedDataRef.current = previousState;
    setStatus("clean");

    return previousState;
  }, [undoHistory]);

  // Manual save
  const saveNow = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    await performSave();
  }, [performSave]);

  // Retry after error
  const retry = useCallback(async () => {
    if (status === "error") {
      await performSave();
    }
  }, [status, performSave]);

  // Mark as dirty (for external changes)
  const markDirty = useCallback(() => {
    if (status === "clean" || status === "saved") {
      setStatus("dirty");
    }
  }, [status]);

  return {
    status,
    lastSaved,
    error,
    canUndo: undoHistory.length > 0,
    undo,
    saveNow,
    retry,
    markDirty,
  };
}
