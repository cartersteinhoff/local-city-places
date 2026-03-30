"use client";

import { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, ChevronDown, Copy, Calendar } from "lucide-react";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
type Day = typeof DAYS[number];

const DAY_LABELS: Record<Day, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const SHORT_DAY_LABELS: Record<Day, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

// Generate time options in 30-minute increments
function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h24 = hour.toString().padStart(2, "0");
      const m = minute.toString().padStart(2, "0");
      const value = `${h24}:${m}`;

      // Format for display (12-hour)
      const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const ampm = hour < 12 ? "AM" : "PM";
      const label = `${h12}:${m.padStart(2, "0")} ${ampm}`;

      options.push({ value, label });
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

// Common hour presets
const PRESETS = [
  { label: "9 AM - 5 PM", open: "09:00", close: "17:00" },
  { label: "10 AM - 6 PM", open: "10:00", close: "18:00" },
  { label: "10 AM - 9 PM", open: "10:00", close: "21:00" },
  { label: "8 AM - 8 PM", open: "08:00", close: "20:00" },
  { label: "8 AM - 5 PM", open: "08:00", close: "17:00" },
  { label: "7 AM - 7 PM", open: "07:00", close: "19:00" },
  { label: "24 Hours", open: "00:00", close: "23:59" },
];

export interface Hours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

// Parse stored format "HH:MM-HH:MM" or legacy "H:MM AM - H:MM PM"
function parseHours(value: string | undefined): { isOpen: boolean; open: string; close: string } {
  if (!value || value.toLowerCase() === "closed") {
    return { isOpen: false, open: "09:00", close: "17:00" };
  }

  // Handle "24 Hours"
  if (value.toLowerCase() === "24 hours") {
    return { isOpen: true, open: "00:00", close: "23:59" };
  }

  // Try parsing "HH:MM-HH:MM" format first
  const match24 = value.match(/^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/);
  if (match24) {
    return {
      isOpen: true,
      open: `${match24[1]}:${match24[2]}`,
      close: `${match24[3]}:${match24[4]}`,
    };
  }

  // Try parsing legacy "H:MM AM - H:MM PM" format
  const matchLegacy = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (matchLegacy) {
    const openHour = parseInt(matchLegacy[1]);
    const openMin = matchLegacy[2];
    const openAmpm = matchLegacy[3].toUpperCase();
    const closeHour = parseInt(matchLegacy[4]);
    const closeMin = matchLegacy[5];
    const closeAmpm = matchLegacy[6].toUpperCase();

    const open24 = openAmpm === "AM"
      ? (openHour === 12 ? 0 : openHour)
      : (openHour === 12 ? 12 : openHour + 12);
    const close24 = closeAmpm === "AM"
      ? (closeHour === 12 ? 0 : closeHour)
      : (closeHour === 12 ? 12 : closeHour + 12);

    return {
      isOpen: true,
      open: `${open24.toString().padStart(2, "0")}:${openMin}`,
      close: `${close24.toString().padStart(2, "0")}:${closeMin}`,
    };
  }

  // Default if parsing fails
  return { isOpen: true, open: "09:00", close: "17:00" };
}

// Format to storage format "HH:MM-HH:MM"
function formatHours(isOpen: boolean, open: string, close: string): string | undefined {
  if (!isOpen) return "Closed";
  if (open === "00:00" && close === "23:59") return "24 Hours";
  return `${open}-${close}`;
}

// Format for display "9:00 AM - 5:00 PM"
function formatDisplay(value: string | undefined): string {
  if (!value || value.toLowerCase() === "closed") return "Closed";
  if (value.toLowerCase() === "24 hours") return "24 Hours";

  const parsed = parseHours(value);
  if (!parsed.isOpen) return "Closed";

  const formatTime = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const ampm = h < 12 ? "AM" : "PM";
    return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  if (parsed.open === "00:00" && parsed.close === "23:59") return "24 Hours";
  return `${formatTime(parsed.open)} - ${formatTime(parsed.close)}`;
}

interface HoursSectionProps {
  value: Hours;
  onChange: (hours: Hours) => void;
}

export function HoursSection({ value, onChange }: HoursSectionProps) {
  const updateDay = useCallback((day: Day, isOpen: boolean, open: string, close: string) => {
    onChange({
      ...value,
      [day]: formatHours(isOpen, open, close),
    });
  }, [value, onChange]);

  const applyToWeekdays = useCallback(() => {
    const mondayValue = value.monday;
    if (!mondayValue) return;

    onChange({
      ...value,
      tuesday: mondayValue,
      wednesday: mondayValue,
      thursday: mondayValue,
      friday: mondayValue,
    });
  }, [value, onChange]);

  const copyToAll = useCallback(() => {
    const mondayValue = value.monday;
    if (!mondayValue) return;

    const newHours: Hours = {};
    DAYS.forEach((day) => {
      newHours[day] = mondayValue;
    });
    onChange(newHours);
  }, [value, onChange]);

  const applyPreset = useCallback((preset: typeof PRESETS[number]) => {
    const formatted = formatHours(true, preset.open, preset.close);
    const newHours: Hours = {};
    DAYS.forEach((day) => {
      newHours[day] = formatted;
    });
    onChange(newHours);
  }, [onChange]);

  const setAllClosed = useCallback(() => {
    const newHours: Hours = {};
    DAYS.forEach((day) => {
      newHours[day] = "Closed";
    });
    onChange(newHours);
  }, [onChange]);

  return (
    <div className="space-y-6 bg-card border rounded-lg p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Hours of Operation
        </h3>

        {/* Quick fill buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={applyToWeekdays}
            disabled={!value.monday}
            title="Copy Monday's hours to Tuesday through Friday"
          >
            <Calendar className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Apply to </span>Weekdays
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyToAll}
            disabled={!value.monday}
            title="Copy Monday's hours to all days"
          >
            <Copy className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Copy to </span>All
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                Presets
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {PRESETS.map((preset) => (
                <DropdownMenuItem
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                >
                  {preset.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={setAllClosed}>
                All Closed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-3">
        {DAYS.map((day) => {
          const parsed = parseHours(value[day]);

          return (
            <div key={day} className="flex items-center gap-3">
              {/* Day label */}
              <Label className="w-12 sm:w-24 text-sm font-medium">
                <span className="sm:hidden">{SHORT_DAY_LABELS[day]}</span>
                <span className="hidden sm:inline">{DAY_LABELS[day]}</span>
              </Label>

              {/* Open/Closed toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={parsed.isOpen}
                  onCheckedChange={(isOpen) => updateDay(day, isOpen, parsed.open, parsed.close)}
                />
                <span className="text-xs text-muted-foreground w-10">
                  {parsed.isOpen ? "Open" : "Closed"}
                </span>
              </div>

              {/* Time selectors */}
              {parsed.isOpen && (
                <div className="flex items-center gap-2 flex-1">
                  <Select
                    value={parsed.open}
                    onValueChange={(open) => updateDay(day, true, open, parsed.close)}
                  >
                    <SelectTrigger className="w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-muted-foreground">to</span>

                  <Select
                    value={parsed.close}
                    onValueChange={(close) => updateDay(day, true, parsed.open, close)}
                  >
                    <SelectTrigger className="w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Display summary on mobile when closed */}
              {!parsed.isOpen && (
                <span className="text-sm text-muted-foreground flex-1">—</span>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Toggle each day on/off and set opening hours. Use presets for quick setup.
      </p>
    </div>
  );
}

// Export display formatter for use in other components
export { formatDisplay as formatHoursDisplay };
