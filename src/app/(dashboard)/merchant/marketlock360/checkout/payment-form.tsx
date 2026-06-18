"use client";

import {
  CheckoutElementsProvider,
  PaymentElement,
  useCheckoutElements,
} from "@stripe/react-stripe-js/checkout";
import { loadStripe } from "@stripe/stripe-js";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey
  ? loadStripe(publishableKey)
  : Promise.resolve(null);

interface MarketLockPaymentFormProps {
  agreementAcceptanceId: string;
  amountLabel: string;
  merchantName: string;
  servicePeriodLabel: string;
}

interface CheckoutSecretResponse {
  checkoutSessionId?: string;
  clientSecret?: string;
  error?: string;
}

interface CheckoutFieldsProps {
  amountLabel: string;
  checkoutSessionId: string;
  merchantName: string;
  servicePeriodLabel: string;
}

function CheckoutFields({
  amountLabel,
  checkoutSessionId,
  merchantName,
  servicePeriodLabel,
}: CheckoutFieldsProps) {
  const checkoutState = useCheckoutElements();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (checkoutState.type !== "success") {
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    const returnUrl = `${window.location.origin}/merchant/marketlock360/checkout/return?session_id=${encodeURIComponent(checkoutState.checkout.id || checkoutSessionId)}`;
    const result = await checkoutState.checkout.confirm({
      redirect: "if_required",
      returnUrl,
    });

    if (result.type === "error") {
      setSubmitError(result.error.message || "Payment could not be completed.");
      setIsSubmitting(false);
      return;
    }

    window.location.assign(
      `/merchant/marketlock360/checkout/return?session_id=${encodeURIComponent(result.session.id)}`,
    );
  }

  if (checkoutState.type === "loading") {
    return (
      <div className="grid min-h-[360px] place-items-center rounded-lg border bg-muted/35 p-6 dark:border-[#21475d] dark:bg-[#061c29]">
        <div className="text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-orange-500" />
          <p className="mt-3 text-sm font-semibold text-foreground dark:text-slate-100">
            Loading secure fields
          </p>
          <p className="mt-1 text-xs text-muted-foreground dark:text-slate-400">
            Stripe is preparing the payment form.
          </p>
        </div>
      </div>
    );
  }

  if (checkoutState.type === "error") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-100">
        {checkoutState.error.message || "Unable to load payment fields."}
      </div>
    );
  }

  const canConfirm = checkoutState.checkout.canConfirm && !isSubmitting;

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="rounded-lg border bg-card p-4 shadow-sm dark:border-[#24516b] dark:bg-[#061d2b] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <PaymentElement
          options={{
            layout: {
              defaultCollapsed: false,
              type: "tabs",
            },
          }}
        />
      </div>

      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-100">
          {submitError}
        </div>
      )}

      <div className="rounded-lg border bg-muted/35 px-4 py-3 dark:border-[#21475d] dark:bg-[#082433]">
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-400">
              Merchant
            </p>
            <p
              className="mt-1 truncate font-semibold text-foreground dark:text-slate-100"
              title={merchantName}
            >
              {merchantName}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-400">
              Service period
            </p>
            <p className="mt-1 font-semibold text-foreground dark:text-slate-100">
              {servicePeriodLabel}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-400">
              Due now
            </p>
            <p className="mt-1 font-semibold text-orange-600 dark:text-orange-400">
              {amountLabel}
            </p>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!canConfirm}
        className="h-auto min-h-11 w-full whitespace-normal border border-orange-500/30 bg-orange-600 py-2 text-base text-white shadow-[0_12px_30px_rgba(234,88,12,0.18)] hover:bg-orange-500 disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none dark:shadow-[0_12px_30px_rgba(234,88,12,0.24)] dark:disabled:border-[#2a5368] dark:disabled:bg-[#0a2a3c] dark:disabled:text-slate-500"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="h-4 w-4" />
        )}
        Pay {amountLabel}
      </Button>

      {!checkoutState.checkout.canConfirm && !isSubmitting && (
        <p className="text-center text-xs text-muted-foreground dark:text-slate-400">
          Enter payment details to continue.
        </p>
      )}

      <p className="text-center text-xs leading-5 text-muted-foreground dark:text-slate-400">
        Payment details are encrypted and processed by Stripe. LOCAL City Places
        does not store card numbers.
      </p>
    </form>
  );
}

export function MarketLockPaymentForm({
  agreementAcceptanceId,
  amountLabel,
  merchantName,
  servicePeriodLabel,
}: MarketLockPaymentFormProps) {
  const { resolvedTheme } = useTheme();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const loadCheckoutSession = useCallback(
    async (_requestKey: number) => {
      setIsLoading(true);
      setLoadError(null);
      setClientSecret(null);
      setCheckoutSessionId(null);

      const response = await fetch(
        "/api/merchant/marketlock360/checkout-session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agreementAcceptanceId }),
        },
      );
      const data = (await response
        .json()
        .catch(() => ({}))) as CheckoutSecretResponse;

      if (!response.ok || !data.clientSecret || !data.checkoutSessionId) {
        throw new Error(data.error || "Unable to load payment.");
      }

      setClientSecret(data.clientSecret);
      setCheckoutSessionId(data.checkoutSessionId);
    },
    [agreementAcceptanceId],
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        await loadCheckoutSession(reloadKey);
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "Unable to load payment.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [loadCheckoutSession, reloadKey]);

  const checkoutOptions = useMemo(() => {
    if (!clientSecret) {
      return null;
    }

    const isDark = resolvedTheme === "dark";

    return {
      clientSecret,
      defaultValues: {
        email: undefined,
      },
      elementsOptions: {
        appearance: {
          theme: isDark ? ("night" as const) : ("stripe" as const),
          variables: {
            borderRadius: "10px",
            colorBackground: isDark ? "#061d2b" : "#ffffff",
            colorDanger: isDark ? "#fb7185" : "#dc2626",
            colorIcon: isDark ? "#fb923c" : "#ea580c",
            colorPrimary: "#f97316",
            colorText: isDark ? "#f8fafc" : "#0f172a",
            colorTextSecondary: isDark ? "#cbd5e1" : "#475569",
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            spacingUnit: "4px",
          },
          rules: {
            ".AccordionItem": {
              backgroundColor: isDark ? "#0a2a3c" : "#ffffff",
              border: isDark ? "1px solid #24516b" : "1px solid #e2e8f0",
              boxShadow: isDark ? "none" : "0 1px 2px rgba(15, 23, 42, 0.04)",
            },
            ".AccordionItem:hover": {
              backgroundColor: isDark ? "#0c3045" : "#f8fafc",
              borderColor: isDark ? "#2f6680" : "#cbd5e1",
            },
            ".AccordionItem--selected": {
              backgroundColor: isDark ? "#0b3044" : "#fff7ed",
              borderColor: "#f97316",
            },
            ".Input": {
              backgroundColor: isDark ? "#061c29" : "#ffffff",
              border: isDark ? "1px solid #2a5368" : "1px solid #cbd5e1",
              color: isDark ? "#f8fafc" : "#0f172a",
            },
            ".Input:focus": {
              borderColor: "#f97316",
              boxShadow: "0 0 0 1px #f97316",
            },
            ".Label": {
              color: isDark ? "#dbeafe" : "#334155",
            },
            ".Tab": {
              backgroundColor: isDark ? "#0a2a3c" : "#ffffff",
              border: isDark ? "1px solid #24516b" : "1px solid #e2e8f0",
              color: isDark ? "#e2e8f0" : "#334155",
            },
            ".Tab--selected": {
              backgroundColor: isDark ? "#0b3044" : "#fff7ed",
              borderColor: "#f97316",
              color: isDark ? "#ffffff" : "#0f172a",
            },
          },
        },
      },
    };
  }, [clientSecret, resolvedTheme]);

  if (!publishableKey) {
    return (
      <section className="rounded-lg border bg-card p-5">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <h2 className="font-semibold">
              Stripe payment form is not configured
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY before loading the secure
              payment fields.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm dark:border-[#21475d] dark:bg-[#08283a] dark:text-slate-100 dark:shadow-[0_20px_70px_rgba(0,0,0,0.24)]">
      <div className="border-b bg-muted/25 px-4 py-5 sm:px-6 dark:border-[#21475d] dark:bg-[#092f44]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 ring-1 ring-orange-200 dark:bg-orange-500/12 dark:text-orange-400 dark:ring-orange-400/20">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Payment details
              </h2>
              <p className="mt-1 text-sm leading-5 text-muted-foreground dark:text-slate-300">
                Complete this one-time MarketLock360 payment in the LOCAL
                dashboard.
              </p>
            </div>
          </div>
          <div className="shrink-0 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-left sm:text-right dark:border-orange-400/30 dark:bg-orange-500/10">
            <p className="text-xs font-bold uppercase tracking-wide text-orange-700 dark:text-orange-300">
              Due today
            </p>
            <p className="mt-1 text-3xl font-bold leading-none text-orange-600 dark:text-orange-400">
              {amountLabel}
            </p>
            <p className="mt-1 text-xs font-medium text-orange-700/75 dark:text-orange-200/80">
              Current monthly period
            </p>
          </div>
        </div>
      </div>

      <div className="grid border-b bg-muted/35 text-xs font-semibold text-muted-foreground sm:grid-cols-3 dark:border-[#21475d] dark:bg-[#061f2e] dark:text-slate-300">
        <div className="flex items-center gap-2 px-4 py-3 sm:border-r sm:px-6 dark:border-[#21475d]">
          <CheckCircle2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          One-time payment
        </div>
        <div className="flex items-center gap-2 px-4 py-3 sm:border-r sm:px-6 dark:border-[#21475d]">
          <FileCheck2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          Agreement signed
        </div>
        <div className="flex items-center gap-2 px-4 py-3 sm:px-6">
          <ShieldCheck className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          Stripe-secured fields
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="mb-5 rounded-lg border bg-muted/35 px-4 py-3 dark:border-[#21475d] dark:bg-[#061f2e]">
          <div className="grid gap-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground dark:text-slate-400">
                Payment for
              </p>
              <p className="mt-1 truncate font-semibold text-foreground dark:text-slate-100">
                {merchantName}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground dark:text-slate-400">
                Service period
              </p>
              <p className="mt-1 font-semibold text-foreground dark:text-slate-100">
                {servicePeriodLabel}
              </p>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="grid min-h-[360px] place-items-center rounded-lg border bg-muted/35 p-6 dark:border-[#21475d] dark:bg-[#061c29]">
            <div className="text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-orange-500" />
              <p className="mt-3 text-sm font-semibold text-foreground dark:text-slate-100">
                Preparing checkout
              </p>
              <p className="mt-1 text-xs text-muted-foreground dark:text-slate-400">
                Creating the secure payment session.
              </p>
            </div>
          </div>
        )}

        {!isLoading && loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-950/30">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-200" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-red-700 dark:text-red-100">
                  Unable to load payment
                </p>
                <p className="mt-1 text-sm text-red-700/90 dark:text-red-100/80">
                  {loadError}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  onClick={() => setReloadKey((key) => key + 1)}
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </Button>
              </div>
            </div>
          </div>
        )}

        {!isLoading && checkoutOptions && checkoutSessionId && (
          <CheckoutElementsProvider
            key={`${clientSecret}-${resolvedTheme}`}
            stripe={stripePromise}
            options={checkoutOptions}
          >
            <CheckoutFields
              amountLabel={amountLabel}
              checkoutSessionId={checkoutSessionId}
              merchantName={merchantName}
              servicePeriodLabel={servicePeriodLabel}
            />
          </CheckoutElementsProvider>
        )}
      </div>
    </section>
  );
}
