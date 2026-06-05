"use client";

import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { WizardProgress } from "./wizard-progress";

interface WizardContainerProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
  children: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  title?: string;
  description?: string;
}

export function WizardContainer({
  currentStep,
  totalSteps,
  steps,
  children,
  onBack,
  showBack = true,
  title,
  description,
}: WizardContainerProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/images/local-city-places-header-logo-v12.webp"
            alt="Local City Places"
            width={1592}
            height={713}
            className="h-auto w-[220px]"
            priority
          />
        </div>

        {/* Progress */}
        <WizardProgress
          currentStep={currentStep}
          totalSteps={totalSteps}
          steps={steps}
        />

        {/* Back button */}
        {showBack && currentStep > 1 && onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mt-6 -ml-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        )}

        {/* Content card */}
        <div className="mt-6 bg-card rounded-xl border p-6 sm:p-8 shadow-sm">
          {(title || description) && (
            <div className="mb-6">
              {title && (
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              )}
              {description && (
                <p className="mt-2 text-muted-foreground">{description}</p>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
