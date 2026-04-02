"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Clock3, MailCheck, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPhoneNumber } from "@/lib/utils";

interface SweepstakesEntryFormProps {
  className?: string;
  onRequireLogin?: (email: string) => void;
}

export function SweepstakesEntryForm({
  className,
  onRequireLogin,
}: SweepstakesEntryFormProps) {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref") ?? "";

  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "already-entered" | "login-required" | "error"
  >("idle");
  const [responseMessage, setResponseMessage] = useState("");
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    referredBy: referralCode,
  });

  const helperText = useMemo(() => {
    if (status === "success") {
      return responseMessage || "Check your email to confirm today's sweepstakes entry.";
    }

    if (status === "already-entered") {
      return responseMessage || "You've already confirmed today's entry. Check your email for your sign-in link.";
    }

    if (status === "login-required") {
      return (
        responseMessage ||
        "This email already has an account. Log in to continue from your member dashboard."
      );
    }

    if (status === "error") {
      return responseMessage || "We couldn't submit your entry. Please try again.";
    }

    if (status === "submitting") {
      return "Submitting your entry and preparing your confirmation link...";
    }

    return "One confirmed entry per day. Runs monthly and closes at 11:59 PM Arizona time on the last day of the month.";
  }, [responseMessage, status]);

  function handleChange(field: keyof typeof formValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setResponseMessage("");

    try {
      const response = await fetch("/api/sweepstakes/enter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formValues),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 && data.code === "login_required") {
          setStatus("login-required");
          setResponseMessage(
            data.error ||
              "This email already has an account. Log in to continue from your member dashboard."
          );
          return;
        }

        setStatus("error");
        setResponseMessage(data.error || "We couldn't submit your entry. Please try again.");
        return;
      }

      setStatus(data.alreadyEnteredToday ? "already-entered" : "success");
      setResponseMessage(
        data.message || "Check your email to confirm today's sweepstakes entry."
      );
    } catch (error) {
      console.error("Failed to submit sweepstakes entry:", error);
      setStatus("error");
      setResponseMessage("We couldn't submit your entry. Please try again.");
    }
  }

  return (
    <div
      id="entry-form"
      className={[
        "relative overflow-hidden rounded-[2rem] border border-[#ffc57a]/28 bg-[#fff8ef] p-5 text-[#21130d] shadow-[0_24px_90px_rgba(0,0,0,0.18)] sm:p-7",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,168,65,0.24),transparent_42%)]" />
      <div className="relative">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#ffedd2] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[#8f4d12]">
              <Sparkles className="h-3.5 w-3.5" />
              Daily Entry Form
            </span>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-[2rem]">
                Enter today. Bring your people with you.
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#6d5443]">
                Confirm with a magic link, unlock your member dashboard, and start building matching-prize referrals.
              </p>
            </div>
          </div>

          <div className="min-h-[32px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#efcfaa] bg-white/80 px-3 py-1 text-xs font-medium text-[#7a5738]">
              <MailCheck className="h-3.5 w-3.5" />
              Magic link confirmation
            </span>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formValues.firstName}
                onChange={(event) => handleChange("firstName", event.target.value)}
                placeholder="Carter"
                required
                className="h-11 rounded-xl border-[#e7ccb0] bg-white/90"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formValues.lastName}
                onChange={(event) => handleChange("lastName", event.target.value)}
                placeholder="Steinhoff"
                required
                className="h-11 rounded-xl border-[#e7ccb0] bg-white/90"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formValues.email}
              onChange={(event) => handleChange("email", event.target.value)}
              placeholder="you@example.com"
              required
              className="h-11 rounded-xl border-[#e7ccb0] bg-white/90"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formValues.phone}
                onChange={(event) =>
                  handleChange("phone", formatPhoneNumber(event.target.value))
                }
                placeholder="(425) 451-8599"
                className="h-11 rounded-xl border-[#e7ccb0] bg-white/90"
              />
            </div>
            <div>
              <Label htmlFor="referredBy">Referral Code</Label>
              <Input
                id="referredBy"
                value={formValues.referredBy}
                onChange={(event) => handleChange("referredBy", event.target.value)}
                placeholder="ABC123"
                className="h-11 rounded-xl border-[#e7ccb0] bg-white/90"
              />
            </div>
          </div>

          <div className="grid gap-3 border-y border-[#efd8bf] py-4 text-sm text-[#6d5443] sm:grid-cols-2">
            <div className="min-h-[32px]">
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-[#b86a1b]" />
                One confirmed entry per day
              </span>
            </div>
            <div className="min-h-[32px]">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#b86a1b]" />
                No purchase necessary
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-full bg-[#21130d] text-white hover:bg-[#3b2418]"
              disabled={status === "submitting"}
            >
              {status === "submitting" ? "Submitting Entry..." : "Enter the Sweepstakes"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            {status === "login-required" && (
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-full border-[#d6b792] bg-white/90 text-[#4a3020] hover:bg-white"
                onClick={() => onRequireLogin?.(formValues.email.trim())}
              >
                Log In To Continue
              </Button>
            )}
            <p
              className={[
                "min-h-[40px] text-sm leading-6",
                status === "error"
                  ? "text-red-700"
                  : status === "login-required"
                    ? "text-amber-800"
                    : "text-[#6d5443]",
              ].join(" ")}
            >
              {helperText}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
