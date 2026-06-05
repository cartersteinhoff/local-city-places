"use client";

import { AlertCircle, CheckCircle, Loader2, LogIn, Radio } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { AnimatedFoodBackground } from "@/components/animated-food-background";
import { Footer } from "@/components/footer";
import { HomeHeader } from "@/components/home-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginRole = "member" | "merchant";
type Status = "idle" | "loading" | "success" | "error";

interface RoleLoginPageProps {
  loginRole: LoginRole;
}

const roleContent = {
  member: {
    title: "Member Login",
    eyebrow: "Member Access",
    description: "Sign in to manage your rebates, receipts, and sweepstakes.",
    defaultCallbackUrl: "/member",
    alternateHref: "/merchant-login",
    alternateLabel: "Merchant Login",
  },
  merchant: {
    title: "Merchant Login",
    eyebrow: "Merchant Access",
    description: "Sign in to manage your merchant dashboard and GRC activity.",
    defaultCallbackUrl: "/merchant",
    alternateHref: "/member-login",
    alternateLabel: "Member Login",
  },
} as const;

function isValidLocalRedirect(value: string | null): value is string {
  return !!value && value.startsWith("/") && !value.startsWith("//");
}

function RoleLoginPageContent({ loginRole }: RoleLoginPageProps) {
  const searchParams = useSearchParams();
  const content = roleContent[loginRole];
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const callbackUrl = useMemo(() => {
    const redirect = searchParams.get("redirect");
    return isValidLocalRedirect(redirect)
      ? redirect
      : content.defaultCallbackUrl;
  }, [content.defaultCallbackUrl, searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callbackUrl }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send magic link");
      }

      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong",
      );
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <AnimatedFoodBackground />
      <HomeHeader />

      <main className="relative z-10 flex flex-1 items-center px-4 py-10 sm:px-6">
        <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[0.94fr_1.06fr] lg:items-center">
          <section>
            <div className="mb-6 inline-flex items-center gap-2 rounded bg-[#052843] px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-white shadow-[5px_6px_0_rgba(0,0,0,0.26)]">
              <LogIn className="h-4 w-4 text-orange-400" />
              {content.eyebrow}
            </div>
            <h1 className="max-w-xl text-4xl font-black uppercase leading-none text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.3)] sm:text-6xl">
              {content.title}
            </h1>
            <p className="mt-6 max-w-lg text-lg font-semibold leading-8 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
              {content.description}
            </p>
            <Button
              variant="outline"
              className="mt-7 border-white/70 bg-white/10 font-black text-white backdrop-blur-sm hover:bg-white hover:text-[#052843]"
              asChild
            >
              <Link href={content.alternateHref}>{content.alternateLabel}</Link>
            </Button>
          </section>

          <section className="rounded-lg border border-white/50 bg-white p-5 shadow-[0_22px_70px_rgba(0,0,0,0.28)] sm:p-7">
            {status === "success" ? (
              <div className="py-8 text-center">
                <CheckCircle className="mx-auto mb-5 h-14 w-14 text-green-600" />
                <h2 className="text-2xl font-black text-zinc-950">
                  Check your email
                </h2>
                <p className="mx-auto mt-3 max-w-sm text-sm font-medium leading-6 text-zinc-600">
                  If an account exists for <strong>{email}</strong>, the sign-in
                  link will take you to the right dashboard.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h2 className="text-2xl font-black text-zinc-950">
                    Send a magic link
                  </h2>
                  <p className="mt-2 text-sm font-medium leading-6 text-zinc-600">
                    No password needed. Enter the email connected to your{" "}
                    {loginRole} account.
                  </p>
                </div>

                <div>
                  <Label htmlFor={`${loginRole}-email`}>Email *</Label>
                  <Input
                    id={`${loginRole}-email`}
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={status === "loading"}
                    required
                    className="h-12"
                  />
                </div>

                {status === "error" && (
                  <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="h-12 w-full bg-orange-500 text-base font-black text-white hover:bg-orange-600"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Radio className="h-4 w-4" />
                      Send Magic Link
                    </>
                  )}
                </Button>
              </form>
            )}
          </section>
        </div>
      </main>

      <Footer variant="dark" />
    </div>
  );
}

export function RoleLoginPage({ loginRole }: RoleLoginPageProps) {
  return (
    <Suspense fallback={null}>
      <RoleLoginPageContent loginRole={loginRole} />
    </Suspense>
  );
}
