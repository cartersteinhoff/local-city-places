"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Gift, AlertCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GRCDetails {
  id: string;
  merchantName: string;
  denomination: number;
  monthsRemaining: number;
}

export default function ClaimGRCPage({ params }: { params: Promise<{ grcId: string }> }) {
  const { grcId } = use(params);
  const router = useRouter();

  const [grcDetails, setGrcDetails] = useState<GRCDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<"checking" | "logged_in" | "logged_out">("checking");
  const [hasMemberProfile, setHasMemberProfile] = useState(false);

  // Magic link form state
  const [email, setEmail] = useState("");
  const [magicLinkStatus, setMagicLinkStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [magicLinkError, setMagicLinkError] = useState("");

  // Fetch GRC details and auth status
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch GRC details
        const grcRes = await fetch(`/api/grc/${grcId}`);
        if (!grcRes.ok) {
          const grcError = await grcRes.json();
          setError(grcError.error || "This GRC is not available");
          setLoading(false);
          return;
        }
        const grcData = await grcRes.json();
        setGrcDetails(grcData);

        // Check auth status
        const authRes = await fetch("/api/auth/me", { cache: "no-store" });
        if (authRes.ok) {
          const authData = await authRes.json();
          setAuthStatus("logged_in");
          setHasMemberProfile(!!authData.member);

          // Store GRC ID for after redirect
          sessionStorage.setItem("pending_grc_claim", grcId);

          // Redirect based on profile status
          if (authData.member) {
            // Has profile - go to dashboard with GRC param
            router.push(`/member?grc=${grcId}`);
          } else {
            // No profile - go to registration
            router.push(`/member/register?grc=${grcId}`);
          }
        } else {
          setAuthStatus("logged_out");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load GRC details");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [grcId, router]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setMagicLinkStatus("loading");
    setMagicLinkError("");

    try {
      // Store GRC ID for after verification
      sessionStorage.setItem("pending_grc_claim", grcId);

      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send magic link");
      }

      setMagicLinkStatus("success");
    } catch (err) {
      setMagicLinkStatus("error");
      setMagicLinkError(err instanceof Error ? err.message : "Failed to send magic link");
    }
  };

  // Loading state
  if (loading || authStatus === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">GRC Not Available</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button onClick={() => router.push("/")} variant="outline">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  // Logged in - waiting for redirect
  if (authStatus === "logged_in") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Logged out - show claim page with magic link form
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* GRC Info */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mx-auto shadow-lg">
            <Gift className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">You&apos;ve Received a GRC!</h1>
            <p className="text-muted-foreground">
              {grcDetails?.merchantName} has sent you a Grocery Rebate Certificate
            </p>
          </div>
        </div>

        {/* GRC Details Card */}
        <div className="bg-card rounded-xl border p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Certificate Value</span>
            <span className="text-2xl font-bold">${grcDetails?.denomination}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium">{grcDetails?.monthsRemaining} months</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Rebate per Month</span>
            <span className="font-medium text-green-600 dark:text-green-400">$25</span>
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Rebates</span>
              <span className="text-xl font-bold text-primary">
                ${(grcDetails?.monthsRemaining || 0) * 25}
              </span>
            </div>
          </div>
        </div>

        {/* Magic Link Form */}
        <div className="bg-card rounded-xl border p-6 space-y-4">
          {magicLinkStatus === "success" ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Check Your Email</h2>
                <p className="text-sm text-muted-foreground">
                  We&apos;ve sent a login link to <strong>{email}</strong>.
                  Click the link to claim your GRC.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center space-y-1">
                <h2 className="text-lg font-semibold">Enter Your Email to Claim</h2>
                <p className="text-sm text-muted-foreground">
                  We&apos;ll send you a secure login link
                </p>
              </div>

              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={magicLinkStatus === "loading"}
                    required
                  />
                </div>

                {magicLinkStatus === "error" && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{magicLinkError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={magicLinkStatus === "loading"}
                >
                  {magicLinkStatus === "loading" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
