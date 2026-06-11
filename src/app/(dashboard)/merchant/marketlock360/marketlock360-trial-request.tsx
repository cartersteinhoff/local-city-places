"use client";

import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { MarketLockStatusBadge } from "@/components/market-lock-status-badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUser } from "@/hooks/use-user";
import {
  type MarketLockStatus,
  normalizeMarketLockStatus,
} from "@/lib/market-lock-status";
import { cn } from "@/lib/utils";

interface TrialRequestContextValue {
  error: string | null;
  isRequesting: boolean;
  marketLockStatus: MarketLockStatus;
  openTrialDialog: () => void;
}

const TrialRequestContext = createContext<TrialRequestContextValue | null>(
  null,
);

function useTrialRequest() {
  const context = useContext(TrialRequestContext);

  if (!context) {
    throw new Error(
      "useTrialRequest must be used within MarketLock360TrialRequestProvider",
    );
  }

  return context;
}

interface MarketLock360TrialRequestProviderProps {
  children: ReactNode;
  initialStatus: MarketLockStatus;
}

const trialIntroItems = [
  {
    title: "Category lock review",
    description:
      "We will confirm your city, category, and launch fit before anything goes live.",
  },
  {
    title: "Growth engine preview",
    description:
      "See how your merchant page, media exposure, direct mail, sweepstakes, AI staff, and search support work together.",
  },
  {
    title: "No credit card required",
    description:
      "Request the trial now. Our team will follow up within a few business days.",
  },
] as const;

export function MarketLock360TrialRequestProvider({
  children,
  initialStatus,
}: MarketLock360TrialRequestProviderProps) {
  const { mutate } = useUser();
  const [marketLockStatus, setMarketLockStatus] = useState<MarketLockStatus>(
    normalizeMarketLockStatus(initialStatus),
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogState, setDialogState] = useState<"intro" | "success" | "error">(
    "intro",
  );
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openTrialDialog = useCallback(() => {
    if (marketLockStatus === "pro") {
      return;
    }

    setError(null);
    setDialogState(marketLockStatus === "trial" ? "success" : "intro");
    setDialogOpen(true);
  }, [marketLockStatus]);

  const requestTrial = useCallback(async () => {
    if (marketLockStatus === "pro") {
      return;
    }

    setIsRequesting(true);
    setError(null);

    try {
      const res = await fetch("/api/merchant/marketlock360/trial-request", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start trial");
      }

      setMarketLockStatus(normalizeMarketLockStatus(data.marketLockStatus));
      await mutate();
      setDialogState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start trial");
      setDialogState("error");
    } finally {
      setIsRequesting(false);
    }
  }, [marketLockStatus, mutate]);

  const value = useMemo(
    () => ({
      error,
      isRequesting,
      marketLockStatus,
      openTrialDialog,
    }),
    [error, isRequesting, marketLockStatus, openTrialDialog],
  );

  return (
    <TrialRequestContext.Provider value={value}>
      {children}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="gap-0 overflow-hidden border-emerald-300/25 bg-[#061b2d] p-0 text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:max-w-[500px] [&_[data-slot=dialog-close]]:text-white/70 [&_[data-slot=dialog-close]]:hover:text-white">
          {dialogState === "error" ? (
            <div className="space-y-5 p-5 sm:p-6">
              <DialogHeader className="gap-3 pr-8 text-left">
                <span className="w-fit rounded-full border border-orange-300/25 bg-orange-400/10 px-2.5 py-1 text-xs font-black uppercase text-orange-100">
                  Needs attention
                </span>
                <DialogTitle className="text-2xl font-black leading-tight">
                  Trial could not be started
                </DialogTitle>
                <DialogDescription className="text-sm leading-6 text-white/68">
                  {error}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-end">
                <DialogClose className="inline-flex h-10 items-center justify-center rounded-md border border-white/16 bg-white/8 px-4 text-sm font-black uppercase text-white transition hover:bg-white/14">
                  Close
                </DialogClose>
              </DialogFooter>
            </div>
          ) : dialogState === "success" ? (
            <div className="space-y-5 p-5 sm:p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-300/12 text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <DialogHeader className="gap-3 pr-8 text-left">
                <DialogTitle className="text-2xl font-black leading-tight">
                  Your trial has been requested
                </DialogTitle>
                <DialogDescription className="text-sm leading-6 text-white/68">
                  We'll reach out within a few business days to contact you.
                </DialogDescription>
              </DialogHeader>
              <div className="border-y border-white/10 py-3">
                <p className="text-sm font-semibold leading-6 text-white/78">
                  Your MarketLOCK360 trial request is in.
                </p>
              </div>
              <DialogFooter className="sm:justify-end">
                <DialogClose className="inline-flex h-10 items-center justify-center rounded-md bg-orange-500 px-4 text-sm font-black uppercase text-white shadow-[0_12px_24px_rgba(249,115,22,0.24)] transition hover:bg-orange-400">
                  Done
                </DialogClose>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-5 p-5 sm:p-6">
                <DialogHeader className="gap-3 pr-8 text-left">
                  <span className="w-fit rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-xs font-black uppercase text-emerald-100">
                    14-day trial
                  </span>
                  <DialogTitle className="text-[1.7rem] font-black leading-tight sm:text-3xl">
                    Start your MarketLOCK360 trial
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-6 text-white/68">
                    See how Local City Places can help your business become the
                    featured local choice before you commit.
                  </DialogDescription>
                </DialogHeader>

                <div className="divide-y divide-white/10 border-y border-white/10">
                  {trialIntroItems.map((item) => (
                    <div key={item.title} className="flex gap-3 py-3">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-300/10 text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm leading-5 text-white/58">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="grid grid-cols-2 gap-3 border-t border-white/10 bg-black/14 px-5 py-4 sm:flex sm:justify-end sm:px-6">
                <DialogClose className="inline-flex h-10 items-center justify-center rounded-md border border-white/16 bg-white/8 px-4 text-sm font-black uppercase text-white transition hover:bg-white/14">
                  Cancel
                </DialogClose>
                <button
                  type="button"
                  onClick={requestTrial}
                  disabled={isRequesting}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-orange-500 px-4 text-sm font-black uppercase text-white shadow-[0_12px_24px_rgba(249,115,22,0.24)] transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-orange-500/65"
                >
                  {isRequesting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Start Trial
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </TrialRequestContext.Provider>
  );
}

export function TrialRequestedBanner() {
  const { marketLockStatus } = useTrialRequest();

  if (marketLockStatus !== "trial") {
    return null;
  }

  return (
    <div
      id="marketlock-trial-status"
      className="border-b border-emerald-300/25 bg-emerald-400/12 px-6 py-3 text-white sm:px-8"
    >
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
        <p className="text-sm font-black uppercase tracking-wide">
          Trial has been requested.
        </p>
        <MarketLockStatusBadge
          status={marketLockStatus}
          className="border-emerald-300/40 bg-emerald-300/12 text-emerald-100"
        />
      </div>
    </div>
  );
}

interface StartTrialButtonProps {
  className?: string;
  variant?: "primary" | "secondary";
}

export function StartTrialButton({
  className,
  variant = "primary",
}: StartTrialButtonProps) {
  const { isRequesting, marketLockStatus, openTrialDialog } = useTrialRequest();
  const isPro = marketLockStatus === "pro";
  const isTrial = marketLockStatus === "trial";
  const isDisabled = isRequesting || isPro || isTrial;
  const buttonLabel = isPro
    ? "Pro active"
    : isTrial
      ? "Trial started"
      : isRequesting
        ? "Starting..."
        : "Start Trial";

  return (
    <button
      type="button"
      onClick={openTrialDialog}
      disabled={isDisabled}
      className={cn(
        "inline-flex h-12 items-center justify-center rounded-lg px-5 text-sm font-black uppercase tracking-wide transition",
        variant === "primary"
          ? "bg-orange-500 text-white shadow-[0_14px_30px_rgba(249,115,22,0.28)] hover:bg-orange-400"
          : "border border-white/20 bg-white/10 text-white hover:bg-white/16",
        isDisabled &&
          (variant === "primary"
            ? "cursor-not-allowed bg-orange-500/65 hover:bg-orange-500/65"
            : "cursor-not-allowed border-white/12 bg-white/6 text-white/55 hover:bg-white/6"),
        className,
      )}
    >
      {isRequesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {buttonLabel}
      {!isRequesting && !isPro && !isTrial ? (
        <ArrowRight className="ml-2 h-4 w-4" />
      ) : null}
    </button>
  );
}
