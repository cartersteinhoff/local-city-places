"use client";

import { Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmEmailStepProps {
  email: string;
  onNext: () => void;
}

export function ConfirmEmailStep({ email, onNext }: ConfirmEmailStepProps) {
  return (
    <div className="space-y-6">
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

      <Button onClick={onNext} className="w-full" size="lg">
        Continue
      </Button>
    </div>
  );
}
