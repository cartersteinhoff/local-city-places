import { CheckCircle2, CreditCard, FileSignature } from "lucide-react";
import Link from "next/link";

type MarketLock360FlowStep = "agreement" | "payment";

interface MarketLock360FlowStepsProps {
  agreementCompleted?: boolean;
  agreementHref?: string;
  amountLabel: string | null;
  currentStep: MarketLock360FlowStep;
  merchantName: string;
  servicePeriodLabel: string;
}

const stepContent = {
  agreement: {
    eyebrow: "Step 1 of 2",
    title: "Review and sign agreement",
    description:
      "Execute the monthly service agreement before moving to payment.",
  },
  payment: {
    eyebrow: "Step 2 of 2",
    title: "Complete payment",
    description:
      "Finish the one-time charge to activate this monthly service period.",
  },
} as const;

export function MarketLock360FlowSteps({
  agreementCompleted = false,
  agreementHref,
  amountLabel,
  currentStep,
  merchantName,
  servicePeriodLabel,
}: MarketLock360FlowStepsProps) {
  const isPaymentStep = currentStep === "payment";
  const agreementIsSigned = isPaymentStep || agreementCompleted;
  const current =
    agreementCompleted && !isPaymentStep
      ? {
          eyebrow: "Agreement signed",
          title: "Agreement already signed",
          description:
            "The signed agreement is recorded. Continue to payment for this service period.",
        }
      : stepContent[currentStep];
  const canReviewAgreement = isPaymentStep && agreementHref;
  const agreementStepBody = (
    <>
      <span
        className={
          agreementIsSigned
            ? "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-300/25"
            : "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 text-white ring-1 ring-orange-600 dark:bg-orange-500 dark:ring-orange-400/45"
        }
      >
        {agreementIsSigned ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <FileSignature className="h-4 w-4" />
        )}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">Agreement</p>
          <span
            className={
              agreementIsSigned
                ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                : "rounded-full bg-orange-600 px-2 py-0.5 text-xs font-bold text-white"
            }
          >
            {agreementIsSigned ? "Signed" : "Current"}
          </span>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground dark:text-slate-300">
          {agreementIsSigned
            ? canReviewAgreement
              ? "Signed agreement is complete. Select to review it before paying."
              : "Signed agreement is complete for this service period."
            : "Sign the current monthly service agreement and save the PDF copy."}
        </p>
      </div>
    </>
  );

  return (
    <section
      aria-label="MarketLock360 activation progress"
      className="mb-6 overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm dark:border-sky-300/20 dark:bg-[#061f33] dark:text-slate-50 dark:shadow-[0_18px_54px_rgba(0,0,0,0.22)]"
    >
      <div className="grid gap-4 px-4 py-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-600 dark:text-orange-300">
            {current.eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">
            {current.title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground dark:text-slate-300">
            {current.description}
          </p>
        </div>

        <div className="grid gap-3 rounded-lg border bg-muted/35 px-4 py-3 text-sm sm:grid-cols-2 md:min-w-[360px] dark:border-sky-300/15 dark:bg-[#041827]">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground dark:text-slate-400">
              Merchant
            </p>
            <p className="mt-1 truncate font-semibold" title={merchantName}>
              {merchantName}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground dark:text-slate-400">
              Service period
            </p>
            <p
              className="mt-1 truncate font-semibold"
              title={servicePeriodLabel}
            >
              {servicePeriodLabel}
            </p>
          </div>
        </div>
      </div>

      <ol className="grid border-t bg-muted/25 text-sm md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] dark:border-sky-300/15 dark:bg-[#041827]">
        <li
          className={
            agreementIsSigned
              ? "border-b px-4 py-4 md:border-r md:border-b-0 sm:px-5 dark:border-sky-300/15"
              : "border-b border-orange-200 bg-orange-50 px-4 py-4 md:border-r md:border-b-0 sm:px-5 dark:border-orange-400/25 dark:bg-orange-500/10"
          }
        >
          {canReviewAgreement ? (
            <Link
              aria-label="Back to signed agreement"
              className="group flex items-start gap-3 rounded-md outline-none transition-colors hover:text-orange-700 focus-visible:ring-2 focus-visible:ring-orange-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:hover:text-orange-200"
              href={agreementHref}
            >
              {agreementStepBody}
            </Link>
          ) : (
            <div className="flex items-start gap-3">{agreementStepBody}</div>
          )}
        </li>

        <li
          className={
            isPaymentStep
              ? "bg-orange-50 px-4 py-4 sm:px-5 dark:bg-orange-500/10"
              : "px-4 py-4 sm:px-5"
          }
        >
          <div className="flex items-start gap-3">
            <span
              className={
                isPaymentStep
                  ? "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 text-white ring-1 ring-orange-600 dark:bg-orange-500 dark:ring-orange-400/45"
                  : "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border dark:bg-sky-300/10 dark:text-slate-300 dark:ring-sky-300/20"
              }
            >
              <CreditCard className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">Payment</p>
                <span
                  className={
                    isPaymentStep
                      ? "rounded-full bg-orange-600 px-2 py-0.5 text-xs font-bold text-white"
                      : "rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground ring-1 ring-border dark:bg-sky-300/10 dark:text-slate-300 dark:ring-sky-300/20"
                  }
                >
                  {isPaymentStep ? "Current" : "Next"}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground dark:text-slate-300">
                {amountLabel
                  ? `${amountLabel} one-time charge for this service period.`
                  : "One-time charge for this service period."}
              </p>
            </div>
          </div>
        </li>
      </ol>
    </section>
  );
}
