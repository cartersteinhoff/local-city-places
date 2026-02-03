"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, X, ChevronDown, Copy, Calendar } from "lucide-react";

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

const PRESETS = [
  { label: "9:00 AM - 5:00 PM", value: "9:00 AM - 5:00 PM" },
  { label: "10:00 AM - 6:00 PM", value: "10:00 AM - 6:00 PM" },
  { label: "10:00 AM - 9:00 PM", value: "10:00 AM - 9:00 PM" },
  { label: "8:00 AM - 8:00 PM", value: "8:00 AM - 8:00 PM" },
  { label: "24 Hours", value: "24 Hours" },
  { label: "Closed", value: "Closed" },
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

interface HoursSectionProps {
  value: Hours;
  onChange: (hours: Hours) => void;
}

export function HoursSection({ value, onChange }: HoursSectionProps) {
  const updateDay = (day: Day, hours: string) => {
    onChange({
      ...value,
      [day]: hours || undefined,
    });
  };

  const clearDay = (day: Day) => {
    const newValue = { ...value };
    delete newValue[day];
    onChange(newValue);
  };

  const applyToWeekdays = () => {
    const mondayHours = value.monday;
    if (!mondayHours) return;

    onChange({
      ...value,
      tuesday: mondayHours,
      wednesday: mondayHours,
      thursday: mondayHours,
      friday: mondayHours,
    });
  };

  const copyToAll = () => {
    const mondayHours = value.monday;
    if (!mondayHours) return;

    const newHours: Hours = {};
    DAYS.forEach((day) => {
      newHours[day] = mondayHours;
    });
    onChange(newHours);
  };

  const applyPreset = (preset: string) => {
    const newHours: Hours = {};
    DAYS.forEach((day) => {
      newHours[day] = preset;
    });
    onChange(newHours);
  };

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
                  key={preset.value}
                  onClick={() => applyPreset(preset.value)}
                >
                  {preset.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-3">
        {DAYS.map((day) => (
          <div key={day} className="flex items-center gap-3">
            <Label className="w-24 text-sm font-medium">{DAY_LABELS[day]}</Label>
            <div className="flex-1 flex gap-2">
              <Input
                value={value[day] || ""}
                onChange={(e) => updateDay(day, e.target.value)}
                placeholder="9:00 AM - 5:00 PM"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => clearDay(day)}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                disabled={!value[day]}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Leave blank for days the business is closed. Use &quot;Closed&quot; to explicitly show closed.
      </p>
    </div>
  );
}
