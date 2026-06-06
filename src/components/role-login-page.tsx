"use client";

import {
  AlertCircle,
  CheckCircle,
  CircleHelp,
  Loader2,
  LogIn,
  Radio,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { AnimatedFoodBackground } from "@/components/animated-food-background";
import { Footer } from "@/components/footer";
import { HomeHeader } from "@/components/home-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type LoginRole = "member" | "merchant";
type Status = "idle" | "loading" | "success" | "error";

interface RoleLoginPageProps {
  loginRole: LoginRole;
}

const roleContent = {
  member: {
    title: "Member Login",
    eyebrow: "Member Access",
    description:
      "Sign in to manage your profile, sweepstakes, and local favorites.",
    defaultCallbackUrl: "/member",
    formDescription:
      "We'll email you a secure one-time sign-in link. Open it to access your member account; no password is needed.",
  },
  merchant: {
    title: "Merchant Login",
    eyebrow: "Merchant Access",
    description:
      "Sign in to manage your merchant dashboard and local visibility.",
    defaultCallbackUrl: "/merchant",
    formDescription:
      "We'll email you a secure one-time sign-in link. Open it to access your merchant dashboard; no password is needed.",
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[linear-gradient(135deg,#04131f_0%,#01233f_54%,#063860_100%)] text-white">
      <AnimatedFoodBackground
        includeGradient={false}
        iconClassName="text-white/35"
      />
      <HomeHeader />

      <main className="relative z-10 flex flex-1 items-center px-4 py-10 sm:px-6">
        <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[0.94fr_1.06fr] lg:items-center">
          <section>
            <div className="mb-6 inline-flex items-center gap-2 rounded bg-sky-300/12 px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-100 ring-1 ring-sky-200/20">
              <LogIn className="h-4 w-4 text-orange-300" />
              {content.eyebrow}
            </div>
            <h1 className="max-w-xl text-4xl font-black uppercase leading-none text-white sm:text-6xl">
              {content.title}
            </h1>
            <p className="mt-6 max-w-lg text-lg font-semibold leading-8 text-sky-50/82">
              {content.description}
            </p>
          </section>

          <section className="rounded-lg border border-sky-100/18 bg-[#06243d]/92 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.42)] ring-1 ring-sky-200/10 sm:p-7">
            {status === "success" ? (
              <div className="py-8 text-center">
                <CheckCircle className="mx-auto mb-5 h-14 w-14 text-sky-300" />
                <h2 className="text-2xl font-black text-white">
                  Check your email
                </h2>
                <p className="mx-auto mt-3 max-w-sm text-sm font-medium leading-6 text-sky-50/74">
                  If an account exists for <strong>{email}</strong>, the sign-in
                  link will take you to the right dashboard.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <TooltipProvider>
                    <Tooltip>
                      <h2 className="text-2xl font-black text-white">
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="group inline-flex items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/45"
                          >
                            Send a magic link
                            <CircleHelp
                              className="h-4 w-4 text-sky-100/46 transition group-hover:text-sky-50"
                              strokeWidth={2.25}
                            />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          sideOffset={8}
                          className="max-w-[260px] rounded-md border border-sky-100/16 bg-[#031720]/96 px-3 py-2 text-[13px] font-semibold leading-5 text-sky-50 shadow-[0_14px_34px_rgba(0,0,0,0.34)] [&_svg]:bg-[#031720] [&_svg]:fill-[#031720]"
                        >
                          Magic links are single-use email links that expire
                          after 3 days.
                        </TooltipContent>
                      </h2>
                    </Tooltip>
                  </TooltipProvider>
                  <p className="mt-2 text-sm font-medium leading-6 text-sky-50/74">
                    {content.formDescription}
                  </p>
                </div>

                <div>
                  <Label htmlFor={`${loginRole}-email`} className="text-sky-50">
                    Email *
                  </Label>
                  <Input
                    id={`${loginRole}-email`}
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={status === "loading"}
                    required
                    className="h-12 border-sky-100/18 bg-[#031720]/74 text-white placeholder:text-sky-100/42 focus-visible:ring-orange-300/60"
                  />
                </div>

                {status === "error" && (
                  <div className="flex items-center gap-2 rounded-md border border-red-300/20 bg-red-950/30 px-3 py-2 text-sm font-medium text-red-100">
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
