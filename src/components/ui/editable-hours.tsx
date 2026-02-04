"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Clock, X } from "lucide-react";

type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

interface Hours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

interface EditableHoursProps {
  value: Hours;
  onChange: (hours: Hours) => void;
  className?: string;
  dayClassName?: string;
  renderDay?: (
    day: DayKey,
    label: string,
    hours: string | undefined,
    setHours: (value: string | undefined) => void,
    isEditing: boolean,
    setIsEditing: (editing: boolean) => void
  ) => React.ReactNode;
}

const DAYS: { key: DayKey; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const TIME_OPTIONS = [
  "Closed",
  "24 Hours",
  "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM",
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
  "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM",
  "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM",
];

function parseHours(value: string | undefined): { open: string; close: string } | "Closed" | "24 Hours" | null {
  if (!value) return null;
  if (value.toLowerCase() === "closed") return "Closed";
  if (value === "24 Hours" || value === "00:00-23:59") return "24 Hours";

  // Try to parse HH:MM-HH:MM format
  const match = value.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
  if (match) {
    const [, openH, openM, closeH, closeM] = match;
    const formatTime = (h: string, m: string) => {
      const hour = parseInt(h);
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${m} ${period}`;
    };
    return { open: formatTime(openH, openM), close: formatTime(closeH, closeM) };
  }

  // Try existing display format
  const displayMatch = value.match(/^(.+?)\s*-\s*(.+)$/);
  if (displayMatch) {
    return { open: displayMatch[1].trim(), close: displayMatch[2].trim() };
  }

  return null;
}

function formatForStorage(open: string, close: string): string {
  if (open === "Closed") return "Closed";
  if (open === "24 Hours") return "24 Hours";

  const parseTime = (t: string): string => {
    const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return t;
    let [, h, m, period] = match;
    let hour = parseInt(h);
    if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (period.toUpperCase() === "AM" && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, "0")}:${m}`;
  };

  return `${parseTime(open)}-${parseTime(close)}`;
}

export function EditableHours({
  value,
  onChange,
  className,
  dayClassName,
  renderDay,
}: EditableHoursProps) {
  const [editingDay, setEditingDay] = useState<DayKey | null>(null);

  const updateDay = (day: DayKey, newValue: string | undefined) => {
    onChange({
      ...value,
      [day]: newValue,
    });
  };

  return (
    <div className={cn("space-y-2", className)}>
      {DAYS.map(({ key, label }) => {
        const hours = value[key];
        const parsed = parseHours(hours);
        const isEditing = editingDay === key;

        if (renderDay) {
          return renderDay(key, label, hours, (v) => updateDay(key, v), isEditing, (e) => setEditingDay(e ? key : null));
        }

        return (
          <div
            key={key}
            onClick={() => !isEditing && setEditingDay(key)}
            className={cn(
              "flex items-center justify-between p-2 rounded cursor-pointer",
              "hover:bg-white/10 transition-colors group",
              isEditing && "bg-white/10",
              dayClassName
            )}
          >
            <span className="font-medium min-w-[100px]">{label}</span>

            {isEditing ? (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <select
                  value={parsed === "Closed" ? "Closed" : parsed === "24 Hours" ? "24 Hours" : (parsed?.open || "9:00 AM")}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "Closed") {
                      updateDay(key, "Closed");
                    } else if (val === "24 Hours") {
                      updateDay(key, "24 Hours");
                    } else {
                      const close = parsed && typeof parsed === "object" ? parsed.close : "5:00 PM";
                      updateDay(key, formatForStorage(val, close));
                    }
                  }}
                  className="bg-black/50 border rounded px-2 py-1 text-sm"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                {parsed !== "Closed" && parsed !== "24 Hours" && (
                  <>
                    <span>-</span>
                    <select
                      value={parsed && typeof parsed === "object" ? parsed.close : "5:00 PM"}
                      onChange={(e) => {
                        const open = parsed && typeof parsed === "object" ? parsed.open : "9:00 AM";
                        updateDay(key, formatForStorage(open, e.target.value));
                      }}
                      className="bg-black/50 border rounded px-2 py-1 text-sm"
                    >
                      {TIME_OPTIONS.filter(t => t !== "Closed" && t !== "24 Hours").map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </>
                )}

                <button
                  onClick={() => setEditingDay(null)}
                  className="p-1 hover:bg-white/20 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <span className={cn("text-sm", !hours && "opacity-50 italic")}>
                {hours ? (
                  parsed === "Closed" ? "Closed" :
                  parsed === "24 Hours" ? "24 Hours" :
                  parsed ? `${parsed.open} - ${parsed.close}` :
                  hours
                ) : (
                  "Click to set"
                )}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
