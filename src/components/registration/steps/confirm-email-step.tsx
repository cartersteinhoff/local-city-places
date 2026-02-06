"use client";

import { Mail, CheckCircle2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmEmailStepProps {
  email: string;
  onNext: () => void;
  grcDetails?: {
    merchantName: string;
    denomination: number;
    monthsRemaining: number;
  } | null;
}

export function ConfirmEmailStep({ email, onNext, grcDetails }: ConfirmEmailStepProps) {
  return (
    <div className="space-y-6">
      {grcDetails ? (
        <>
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
              <Gift className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">You&apos;ve Received a Grocery Rebate Certificate!</h2>
            <p className="text-muted-foreground">
              From <strong>{grcDetails.merchantName}</strong>
            </p>
          </div>

          <div className="bg-card rounded-xl border p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Certificate Value</span>
              <span className="text-2xl font-bold">${grcDetails.denomination}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Duration</span>
              <span className="font-medium">{grcDetails.monthsRemaining} months</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Total Rebates</span>
                <span className="text-xl font-bold text-primary">
                  ${grcDetails.monthsRemaining * 25}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 py-2 px-4 bg-muted rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm">{email}</span>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Complete a quick registration to activate your GRC and start earning rebates.
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Email Confirmed</h2>
            <p className="text-muted-foreground">
              You&apos;re signed in as
            </p>
            <div className="flex items-center justify-center gap-2 py-3 px-4 bg-muted rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="font-medium">{email}</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Let&apos;s set up your account so you can start earning grocery rebates.
          </p>
        </>
      )}

      <Button onClick={onNext} className="w-full" size="lg">
        Get Started
      </Button>
    </div>
  );
}
