"use client";

import { ArrowRight, Clock3, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
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
    "idle" | "submitting" | "success" | "login-required" | "error"
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
      return (
        responseMessage ||
        "Check your email to finish account setup. Once you're in, submit a favorite merchant nomination to lock in your sweepstakes entry."
      );
    }

    if (status === "login-required") {
      return (
        responseMessage ||
        "This email already has an account. Log in from your member dashboard to submit a favorite merchant nomination."
      );
    }

    if (status === "error") {
      return (
        responseMessage ||
        "We couldn't create your member account. Please try again."
      );
    }

    if (status === "submitting") {
      return "Creating your member account and preparing your setup link...";
    }

    return "Start here to create your member account. Once you're in, your first favorite merchant nomination locks in your sweepstakes entry for the current cycle.";
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
              "This email already has an account. Log in from your member dashboard to submit a favorite merchant nomination.",
          );
          return;
        }

        setStatus("error");
        setResponseMessage(
          data.error ||
            "We couldn't create your member account. Please try again.",
        );
        return;
      }

      setStatus("success");
      setResponseMessage(
        data.message ||
          "Check your email to finish account setup. Once you're in, submit a favorite merchant nomination to lock in your sweepstakes entry.",
      );
    } catch (error) {
      console.error("Failed to submit sweepstakes entry:", error);
      setStatus("error");
      setResponseMessage(
        "We couldn't create your member account. Please try again.",
      );
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
        <div className="-mx-5 -mt-5 mb-6 overflow-hidden border-b border-[#efcfaa] sm:-mx-7 sm:-mt-7 sm:mb-7">
          <div className="bg-[#0e2c6b]">
            <Image
              src="/images/gas-grocery-gift-card.png"
              alt="$500 gas and grocery gift card prize"
              width={1368}
              height={865}
              className="h-auto w-full"
              priority
              sizes="(min-width: 1024px) 30rem, 100vw"
            />
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formValues.firstName}
                onChange={(event) =>
                  handleChange("firstName", event.target.value)
                }
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
                onChange={(event) =>
                  handleChange("lastName", event.target.value)
                }
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
                onChange={(event) =>
                  handleChange("referredBy", event.target.value)
                }
                placeholder="ABC123"
                className="h-11 rounded-xl border-[#e7ccb0] bg-white/90"
              />
            </div>
          </div>

          <div className="grid gap-3 border-y border-[#efd8bf] py-4 text-sm text-[#6d5443] sm:grid-cols-2">
            <div className="min-h-[32px]">
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-[#b86a1b]" />
                One-time member setup
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
              {status === "submitting"
                ? "Creating Account..."
                : "Create Your Member Account"}
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
