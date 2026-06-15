"use client";

import { ArrowLeft, ArrowRight, FileSignature, Loader2 } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AgreementAcceptanceFormProps {
  agreementVersion: string;
  merchantName: string;
}

export function AgreementAcceptanceForm({
  agreementVersion,
  merchantName,
}: AgreementAcceptanceFormProps) {
  const [accepted, setAccepted] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = accepted && typedName.trim().length >= 2 && !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/merchant/marketlock360/agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accepted,
          typedName,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        redirectUrl?: string;
      };

      if (!response.ok || !data.redirectUrl) {
        throw new Error(data.error || "Unable to accept agreement");
      }

      window.location.assign(data.redirectUrl);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to accept agreement",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="lg:sticky lg:top-6">
      <CardHeader>
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileSignature className="h-5 w-5" />
        </div>
        <div>
          <CardTitle>Electronic Acceptance</CardTitle>
          <CardDescription>
            Agreement version {agreementVersion}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Merchant
            </p>
            <p
              className="mt-1 truncate text-sm font-semibold"
              title={merchantName}
            >
              {merchantName}
            </p>
          </div>

          <div>
            <Label htmlFor="signatureName">Electronic Signature *</Label>
            <Input
              id="signatureName"
              value={typedName}
              onChange={(event) => setTypedName(event.target.value)}
              placeholder="Full legal name"
              aria-invalid={!!error}
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Type your full legal name as your electronic signature.
            </p>
          </div>

          <div className="flex gap-3 rounded-lg border bg-background p-3">
            <Checkbox
              id="agreementAccepted"
              checked={accepted}
              onCheckedChange={(value) => setAccepted(value === true)}
              disabled={isSubmitting}
              className="mt-0.5"
            />
            <Label
              htmlFor="agreementAccepted"
              className="mb-0 cursor-pointer text-sm leading-6"
            >
              I have read and agree to the MARKETLOCK360 monthly Merchant
              Services Agreement.
            </Label>
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="grid gap-2">
            <Button type="submit" disabled={!canSubmit} className="w-full">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Agree and continue to payment
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/merchant">
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
