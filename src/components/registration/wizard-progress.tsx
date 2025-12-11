"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export function WizardProgress({ currentStep, totalSteps, steps }: WizardProgressProps) {
  return (
    <div className="w-full">
      {/* Mobile: Simple progress bar */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-muted-foreground">
            {steps[currentStep - 1]}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: Step indicators */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                      isCompleted && "bg-primary text-primary-foreground",
                      isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                      !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs text-center max-w-[80px]",
                      isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                    )}
                  >
                    {step}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2 mt-[-24px]",
                      stepNumber < currentStep ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
