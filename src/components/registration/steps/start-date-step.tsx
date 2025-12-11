"use client";

import { useState } from "react";
import { Calendar, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StartDate } from "@/lib/validations/member";

interface StartDateStepProps {
  denomination: number;
  monthsRemaining: number;
  bonusMonth: boolean;
  onNext: (data: StartDate) => void;
  isLoading?: boolean;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function StartDateStep({
  denomination,
  monthsRemaining,
  bonusMonth,
  onNext,
  isLoading,
}: StartDateStepProps) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();
  const dayOfMonth = now.getDate();

  // Calculate next month
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

  const [selectedOption, setSelectedOption] = useState<"this" | "next">(
    dayOfMonth > 20 ? "next" : "this"
  );

  const totalMonths = monthsRemaining + (bonusMonth ? 1 : 0);
  const rebatePerMonth = 25;
  const totalRebates = totalMonths * rebatePerMonth;

  const daysLeftThisMonth = new Date(currentYear, currentMonth, 0).getDate() - dayOfMonth;

  const getWarningLevel = () => {
    if (dayOfMonth <= 10) return null;
    if (dayOfMonth <= 20) return "caution";
    return "warning";
  };

  const warningLevel = getWarningLevel();

  const handleSubmit = () => {
    if (selectedOption === "this") {
      onNext({ startMonth: currentMonth, startYear: currentYear });
    } else {
      onNext({ startMonth: nextMonth, startYear: nextYear });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">When Would You Like to Start?</h2>
        <p className="text-muted-foreground">
          Choose when to begin earning your ${totalRebates} in rebates.
        </p>
      </div>

      {/* GRC Summary */}
      <div className="bg-muted rounded-lg p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">GRC Value</span>
          <span className="font-medium">${denomination}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Duration</span>
          <span className="font-medium">
            {totalMonths} months
            {bonusMonth && (
              <span className="text-green-600 dark:text-green-400 text-sm ml-1">
                (+1 bonus)
              </span>
            )}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Rebates</span>
          <span className="font-medium text-primary">${totalRebates}</span>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        <label
          className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
            selectedOption === "this"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <input
            type="radio"
            name="startDate"
            value="this"
            checked={selectedOption === "this"}
            onChange={() => setSelectedOption("this")}
            className="mt-1"
            disabled={isLoading}
          />
          <div className="flex-1">
            <p className="font-medium">
              Start This Month ({MONTH_NAMES[currentMonth - 1]})
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              You have {daysLeftThisMonth} days left to submit $100 in receipts.
            </p>
            {warningLevel === "caution" && (
              <div className="flex items-center gap-2 mt-2 text-amber-600 dark:text-amber-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Make sure you can reach $100 in time</span>
              </div>
            )}
            {warningLevel === "warning" && (
              <div className="flex items-center gap-2 mt-2 text-orange-600 dark:text-orange-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Limited time! Consider starting next month</span>
              </div>
            )}
          </div>
        </label>

        <label
          className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
            selectedOption === "next"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <input
            type="radio"
            name="startDate"
            value="next"
            checked={selectedOption === "next"}
            onChange={() => setSelectedOption("next")}
            className="mt-1"
            disabled={isLoading}
          />
          <div className="flex-1">
            <p className="font-medium">
              Start Next Month ({MONTH_NAMES[nextMonth - 1]})
              {warningLevel === "warning" && (
                <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                  Recommended
                </span>
              )}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Full month to collect receipts. No rush!
            </p>
          </div>
        </label>
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full"
        size="lg"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Completing Registration...
          </>
        ) : (
          "Complete Registration"
        )}
      </Button>
    </div>
  );
}
