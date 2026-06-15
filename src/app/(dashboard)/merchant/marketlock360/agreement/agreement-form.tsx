"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  FileSignature,
  FileText,
  Loader2,
} from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface AgreementAcceptanceFormProps {
  agreementVersion: string;
  merchantName: string;
  monthlyPaymentLabel: string | null;
  servicePeriodLabel: string;
  typedName: string;
  onTypedNameChange: (value: string) => void;
}

interface AgreementSignedStatusPanelProps {
  acceptedAtIso: string;
  agreementAcceptanceId: string;
  agreementPdfUrl: string | null;
  agreementVersion: string;
  merchantName: string;
  servicePeriodLabel: string;
  typedName: string;
}

interface SignatureFormProps extends AgreementAcceptanceFormProps {
  accepted: boolean;
  canSubmit: boolean;
  disabledReason: string;
  error: string | null;
  idPrefix: string;
  isSubmitting: boolean;
  onAcceptedChange: (value: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  paymentDescription: string;
  submitLabel: string;
}

function formatAcceptedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AgreementSignedStatusPanel({
  acceptedAtIso,
  agreementAcceptanceId,
  agreementPdfUrl,
  agreementVersion,
  merchantName,
  servicePeriodLabel,
  typedName,
}: AgreementSignedStatusPanelProps) {
  const checkoutHref = `/merchant/marketlock360/checkout?agreementAcceptanceId=${encodeURIComponent(agreementAcceptanceId)}`;
  const acceptedAtLabel = formatAcceptedAt(acceptedAtIso);

  return (
    <>
      <Card
        id="agreement-signature"
        className="hidden gap-3 py-4 lg:sticky lg:top-6 lg:flex"
      >
        <CardHeader className="gap-2 px-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>Already signed</CardTitle>
              <CardDescription>
                This agreement is recorded for the current service period.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-5">
          <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm">
            <p className="font-semibold text-emerald-700 dark:text-emerald-300">
              Agreement signed and saved
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              The merchant does not need to sign again for this service period.
            </p>
          </div>

          <div className="space-y-4 rounded-lg border bg-background px-3 py-3 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Merchant
              </p>
              <p className="mt-1 truncate font-semibold" title={merchantName}>
                {merchantName}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Service period
              </p>
              <p className="mt-1 font-semibold">{servicePeriodLabel}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Electronic signature
              </p>
              <p className="mt-1 font-semibold">{typedName}</p>
              <p className="text-xs text-muted-foreground">{acceptedAtLabel}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Agreement version
              </p>
              <p className="mt-1 font-semibold">{agreementVersion}</p>
            </div>
          </div>

          <div className="grid gap-2">
            <Button
              asChild
              className="h-auto min-h-10 w-full whitespace-normal bg-orange-600 py-2 text-center leading-5 text-white hover:bg-orange-500"
            >
              <Link href={checkoutHref}>
                <ArrowRight className="h-4 w-4" />
                Continue to payment
              </Link>
            </Button>
            {agreementPdfUrl && (
              <Button asChild variant="outline" className="w-full">
                <Link href={agreementPdfUrl} target="_blank" rel="noreferrer">
                  <FileText className="h-4 w-4" />
                  View signed PDF
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link href="/merchant">
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 shadow-lg backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Agreement signed</p>
            <p className="truncate text-xs text-muted-foreground">
              {servicePeriodLabel}
            </p>
          </div>
          <Button
            asChild
            className="shrink-0 bg-orange-600 text-white hover:bg-orange-500"
          >
            <Link href={checkoutHref}>Payment</Link>
          </Button>
        </div>
      </div>
    </>
  );
}

function SignatureForm({
  accepted,
  agreementVersion,
  canSubmit,
  disabledReason,
  error,
  idPrefix,
  isSubmitting,
  merchantName,
  monthlyPaymentLabel,
  onAcceptedChange,
  onSubmit,
  onTypedNameChange,
  paymentDescription,
  servicePeriodLabel,
  submitLabel,
  typedName,
}: SignatureFormProps) {
  const signatureId = `${idPrefix}-signatureName`;
  const acceptedId = `${idPrefix}-agreementAccepted`;

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="rounded-lg border border-orange-500/35 bg-orange-500/10 px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white">
            <CreditCard className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-orange-600 dark:text-orange-300">
              One-time charge
            </p>
            <p className="mt-1 text-2xl font-bold leading-none text-foreground">
              {monthlyPaymentLabel || "Due after signing"}
            </p>
            <p className="mt-2 text-xs font-semibold leading-5 text-muted-foreground">
              Not a subscription. This payment covers only the current monthly
              service period.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-2 rounded-lg border bg-background px-3 py-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Merchant
          </p>
          <p className="truncate font-semibold" title={merchantName}>
            {merchantName}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Service period
          </p>
          <p className="font-semibold">{servicePeriodLabel}</p>
        </div>
      </div>

      <p className="rounded-lg border bg-background px-3 py-2 text-xs leading-5 text-muted-foreground">
        Signing records your name, timestamp, service period, agreement version
        {` ${agreementVersion}`}, and saved PDF copy.
      </p>

      <div>
        <Label htmlFor={signatureId}>Electronic Signature *</Label>
        <Input
          id={signatureId}
          value={typedName}
          onChange={(event) => onTypedNameChange(event.target.value)}
          placeholder="Full legal name"
          aria-invalid={!!error}
          disabled={isSubmitting}
        />
      </div>

      <div className="rounded-lg border bg-background px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Signature preview
        </p>
        <p
          className={
            typedName.trim()
              ? "mt-2 min-h-12 break-words border-b pb-1 text-3xl leading-tight text-foreground"
              : "mt-2 flex min-h-12 items-end border-b pb-2 text-sm italic text-muted-foreground"
          }
          style={
            typedName.trim()
              ? {
                  fontFamily:
                    '"Brush Script MT", "Segoe Script", "Lucida Handwriting", cursive',
                }
              : undefined
          }
        >
          {typedName.trim() || "Your signature appears here"}
        </p>
      </div>

      <div className="flex gap-3 rounded-lg border bg-background p-2.5 transition-colors focus-within:border-primary/60">
        <Checkbox
          id={acceptedId}
          checked={accepted}
          onCheckedChange={(value) => onAcceptedChange(value === true)}
          disabled={isSubmitting}
          className="mt-0.5"
        />
        <Label
          htmlFor={acceptedId}
          className="mb-0 cursor-pointer text-sm leading-5"
        >
          I agree to the MARKETLOCK360 monthly Merchant Services Agreement.
          <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">
            I understand a signed PDF will be saved and the next step is a{" "}
            {paymentDescription}.
          </span>
        </Label>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-2">
        {!canSubmit && !isSubmitting && (
          <p className="text-xs font-medium text-muted-foreground">
            {disabledReason}
          </p>
        )}
        <Button
          type="submit"
          disabled={!canSubmit}
          variant={canSubmit ? "default" : "outline"}
          className={
            canSubmit
              ? "h-auto min-h-10 w-full whitespace-normal bg-orange-600 py-2 text-center leading-5 text-white hover:bg-orange-500"
              : "h-auto min-h-10 w-full whitespace-normal border-border/80 bg-muted/30 py-2 text-center leading-5 text-muted-foreground"
          }
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          {submitLabel}
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/merchant">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>
    </form>
  );
}

export function AgreementAcceptanceForm({
  agreementVersion,
  merchantName,
  monthlyPaymentLabel,
  servicePeriodLabel,
  typedName,
  onTypedNameChange,
}: AgreementAcceptanceFormProps) {
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = accepted && typedName.trim().length >= 2 && !isSubmitting;
  const needsSignature = typedName.trim().length < 2;
  const disabledReason = needsSignature
    ? "Enter your full legal name to continue."
    : "Check the agreement box to continue.";
  const paymentDescription = monthlyPaymentLabel
    ? `${monthlyPaymentLabel} one-time payment`
    : "one-time payment";
  const submitLabel = monthlyPaymentLabel
    ? `Sign and continue to ${monthlyPaymentLabel} payment`
    : "Sign and continue to payment";

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
    <>
      <Card
        id="agreement-signature"
        className="hidden gap-3 py-4 lg:sticky lg:top-6 lg:flex"
      >
        <CardHeader className="gap-2 px-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
              <FileSignature className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>Sign monthly agreement</CardTitle>
              <CardDescription>
                Review, sign, then pay for this service period.
              </CardDescription>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/25 p-2">
            {[
              ["1", "Review"],
              ["2", "Sign"],
              ["3", "Pay"],
            ].map(([step, label], index) => (
              <div key={step} className="flex items-center gap-2">
                <span
                  className={
                    index < 2
                      ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white"
                      : "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-bold text-muted-foreground"
                  }
                >
                  {index === 0 ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    step
                  )}
                </span>
                <span className="min-w-0 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="px-5">
          <SignatureForm
            accepted={accepted}
            agreementVersion={agreementVersion}
            canSubmit={canSubmit}
            disabledReason={disabledReason}
            error={error}
            idPrefix="desktop"
            isSubmitting={isSubmitting}
            merchantName={merchantName}
            monthlyPaymentLabel={monthlyPaymentLabel}
            onAcceptedChange={setAccepted}
            onSubmit={handleSubmit}
            onTypedNameChange={onTypedNameChange}
            paymentDescription={paymentDescription}
            servicePeriodLabel={servicePeriodLabel}
            submitLabel={submitLabel}
            typedName={typedName}
          />
        </CardContent>
      </Card>

      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 shadow-lg backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-[1180px] items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{merchantName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {monthlyPaymentLabel
                  ? `${monthlyPaymentLabel} one-time payment`
                  : servicePeriodLabel}
              </p>
            </div>
            <SheetTrigger asChild>
              <Button
                type="button"
                className="shrink-0 bg-orange-600 text-white hover:bg-orange-500"
              >
                Sign and pay
              </Button>
            </SheetTrigger>
          </div>
        </div>
        <SheetContent
          title="Sign agreement"
          className="bg-card px-0 pb-0"
          showCloseButton={!isSubmitting}
        >
          <SheetHeader className="px-4 pb-3 text-left">
            <SheetTitle>Sign monthly agreement</SheetTitle>
            <SheetDescription>
              Then continue to the one-time payment for this service period.
            </SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto px-4 pb-4">
            <SignatureForm
              accepted={accepted}
              agreementVersion={agreementVersion}
              canSubmit={canSubmit}
              disabledReason={disabledReason}
              error={error}
              idPrefix="mobile"
              isSubmitting={isSubmitting}
              merchantName={merchantName}
              monthlyPaymentLabel={monthlyPaymentLabel}
              onAcceptedChange={setAccepted}
              onSubmit={handleSubmit}
              onTypedNameChange={onTypedNameChange}
              paymentDescription={paymentDescription}
              servicePeriodLabel={servicePeriodLabel}
              submitLabel={submitLabel}
              typedName={typedName}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
