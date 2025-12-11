"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { GroceryStoreStep } from "@/components/registration/steps/grocery-store-step";
import { SurveyStep } from "@/components/registration/steps/survey-step";
import { StartDateStep } from "@/components/registration/steps/start-date-step";
import type { GroceryStore, SurveyAnswers, StartDate } from "@/lib/validations/member";
import {
  DollarSign,
  Receipt,
  CheckCircle,
  Gift,
  Loader2,
  ArrowLeft,
  ChevronRight,
  Store,
  Calendar,
  ClipboardList,
} from "lucide-react";
import { memberNavItems } from "./nav";

interface AuthData {
  user: { email: string; role: string; profilePhotoUrl?: string | null };
  member?: { firstName: string; lastName: string };
}

interface GRCDetails {
  id: string;
  merchantId: string;
  merchantName: string;
  denomination: number;
  monthsRemaining: number;
  status: string;
  survey?: {
    id: string;
    title: string;
    questions: Array<{
      id: string;
      type: "text" | "multiple_choice" | "single_choice";
      question: string;
      options?: string[];
      required?: boolean;
    }>;
  } | null;
}

interface ActiveGRC {
  id: string;
  merchantName: string;
  denomination: number;
  monthsRemaining: number;
  groceryStore: string | null;
  startMonth: number | null;
  startYear: number | null;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function MemberDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const grcId = searchParams.get("grc");

  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [loading, setLoading] = useState(true);

  // GRC onboarding state
  const [grcDetails, setGrcDetails] = useState<GRCDetails | null>(null);
  const [grcLoading, setGrcLoading] = useState(false);
  const [grcError, setGrcError] = useState<string | null>(null);
  const [onboardingStep, setOnboardingStep] = useState<"store" | "survey" | "start">("store");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Onboarding form data
  const [groceryData, setGroceryData] = useState<GroceryStore | null>(null);
  const [surveyData, setSurveyData] = useState<SurveyAnswers>({});

  // Dashboard data
  const [activeGrc, setActiveGrc] = useState<ActiveGRC | null>(null);
  const [pendingGrcCount, setPendingGrcCount] = useState(0);

  // Fetch auth data
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user?.role !== "member" && data?.user?.role !== "admin") {
          router.push("/");
          return;
        }
        setAuthData(data);
        setLoading(false);
      })
      .catch(() => router.push("/"));
  }, [router]);

  // Fetch GRC details if grcId is present
  useEffect(() => {
    if (!grcId) return;

    async function fetchGRC() {
      setGrcLoading(true);
      setGrcError(null);

      try {
        const res = await fetch(`/api/grc/${grcId}`);
        if (!res.ok) {
          const errorData = await res.json();
          setGrcError(errorData.error || "Failed to load GRC");
          return;
        }
        const data = await res.json();
        setGrcDetails(data);
      } catch {
        setGrcError("Failed to load GRC details");
      } finally {
        setGrcLoading(false);
      }
    }

    fetchGRC();
  }, [grcId]);

  // Fetch dashboard GRC data (active GRC + pending count)
  useEffect(() => {
    if (loading || grcId) return;

    async function fetchDashboardData() {
      try {
        const res = await fetch("/api/member/grcs");
        if (res.ok) {
          const data = await res.json();
          if (data.active && data.active.length > 0) {
            setActiveGrc(data.active[0]);
          }
          setPendingGrcCount(data.pending?.length || 0);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard GRC data:", err);
      }
    }

    fetchDashboardData();
  }, [loading, grcId]);

  const handleGroceryStoreNext = (data: GroceryStore) => {
    setGroceryData(data);
    // Skip survey step if no survey
    if (grcDetails?.survey && grcDetails.survey.questions.length > 0) {
      setOnboardingStep("survey");
    } else {
      setOnboardingStep("start");
    }
  };

  const handleSurveyNext = (data: SurveyAnswers) => {
    setSurveyData(data);
    setOnboardingStep("start");
  };

  const handleStartDateNext = async (data: StartDate) => {
    if (!groceryData || !grcDetails) return;

    setIsSubmitting(true);

    try {
      // Submit survey response if there was a survey
      if (grcDetails.survey && Object.keys(surveyData).length > 0) {
        await fetch("/api/survey/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            surveyId: grcDetails.survey.id,
            grcId: grcDetails.id,
            answers: surveyData,
          }),
        });
      }

      // Register the GRC
      const res = await fetch("/api/member/register-grc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grcId: grcDetails.id,
          groceryStore: groceryData.groceryStore,
          groceryStorePlaceId: groceryData.groceryStorePlaceId,
          startMonth: data.startMonth,
          startYear: data.startYear,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to register GRC");
      }

      // Clear the GRC param and reload dashboard
      router.push("/member");
      router.refresh();
    } catch (err) {
      console.error("Error registering GRC:", err);
      setGrcError(err instanceof Error ? err.message : "Failed to register GRC");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackStep = () => {
    if (onboardingStep === "survey") {
      setOnboardingStep("store");
    } else if (onboardingStep === "start") {
      if (grcDetails?.survey && grcDetails.survey.questions.length > 0) {
        setOnboardingStep("survey");
      } else {
        setOnboardingStep("store");
      }
    }
  };

  const handleCancelOnboarding = () => {
    router.push("/member");
  };

  const userName = authData?.member
    ? `${authData.member.firstName} ${authData.member.lastName}`
    : undefined;

  // Show GRC onboarding flow if grcId is present
  if (grcId && !loading) {
    // Loading GRC details
    if (grcLoading) {
      return (
        <DashboardLayout
          navItems={memberNavItems}
          userEmail={authData?.user.email}
          userName={userName}
          userRole={authData?.user.role as "admin" | "merchant" | "member"}
          profilePhotoUrl={authData?.user.profilePhotoUrl}
        >
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      );
    }

    // GRC error
    if (grcError) {
      return (
        <DashboardLayout
          navItems={memberNavItems}
          userEmail={authData?.user.email}
          userName={userName}
          userRole={authData?.user.role as "admin" | "merchant" | "member"}
          profilePhotoUrl={authData?.user.profilePhotoUrl}
        >
          <div className="max-w-md mx-auto text-center space-y-6 py-12">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Gift className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">GRC Not Available</h1>
              <p className="text-muted-foreground">{grcError}</p>
            </div>
            <Button onClick={handleCancelOnboarding} variant="outline">
              Return to Dashboard
            </Button>
          </div>
        </DashboardLayout>
      );
    }

    // GRC onboarding steps
    if (grcDetails) {
      const steps = [
        { id: "store", label: "Grocery Store" },
        ...(grcDetails.survey?.questions?.length ? [{ id: "survey", label: "Survey" }] : []),
        { id: "start", label: "Start Date" },
      ];
      const currentStepIndex = steps.findIndex((s) => s.id === onboardingStep);

      return (
        <DashboardLayout
          navItems={memberNavItems}
          userEmail={authData?.user.email}
          userName={userName}
          userRole={authData?.user.role as "admin" | "merchant" | "member"}
          profilePhotoUrl={authData?.user.profilePhotoUrl}
        >
          <div className="max-w-2xl mx-auto">
            {/* GRC Header Card */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white mb-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Gift className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-bold mb-1">Activate Your GRC</h1>
                  <p className="text-white/90 text-sm">
                    ${grcDetails.denomination} certificate from {grcDetails.merchantName}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span className="bg-white/20 px-3 py-1 rounded-full">
                      {grcDetails.monthsRemaining} months
                    </span>
                    <span className="bg-white/20 px-3 py-1 rounded-full">
                      ${grcDetails.monthsRemaining * 25} in rebates
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index < currentStepIndex
                        ? "bg-primary text-primary-foreground"
                        : index === currentStepIndex
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`ml-2 text-sm hidden sm:inline ${
                      index === currentStepIndex
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>

            {/* Back Button */}
            {onboardingStep !== "store" && (
              <button
                onClick={handleBackStep}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}

            {/* Step Content */}
            <div className="bg-card rounded-xl border p-6">
              {onboardingStep === "store" && (
                <GroceryStoreStep
                  data={groceryData || {}}
                  onNext={handleGroceryStoreNext}
                  isLoading={isSubmitting}
                />
              )}

              {onboardingStep === "survey" && grcDetails.survey && (
                <SurveyStep
                  merchantName={grcDetails.merchantName}
                  questions={grcDetails.survey.questions}
                  data={surveyData}
                  onNext={handleSurveyNext}
                  isLoading={isSubmitting}
                />
              )}

              {onboardingStep === "start" && (
                <StartDateStep
                  denomination={grcDetails.denomination}
                  monthsRemaining={grcDetails.monthsRemaining}
                  bonusMonth={false}
                  onNext={handleStartDateNext}
                  isLoading={isSubmitting}
                />
              )}
            </div>

            {/* Cancel Link */}
            <div className="text-center mt-6">
              <button
                onClick={handleCancelOnboarding}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel and return to dashboard
              </button>
            </div>
          </div>
        </DashboardLayout>
      );
    }
  }

  // Normal dashboard view
  return (
    <DashboardLayout
      navItems={memberNavItems}
      userEmail={authData?.user.email}
      userName={userName}
      userRole={(authData?.user.role as "admin" | "merchant" | "member") ?? "member"}
      profilePhotoUrl={authData?.user.profilePhotoUrl}
    >
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
      <PageHeader
        title="Member Dashboard"
        description="Track your progress and earn grocery rebates"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="This Month's Receipts"
          value="$0.00"
          icon={Receipt}
        />
        <StatCard
          label="Amount Remaining"
          value="$100.00"
          icon={DollarSign}
        />
        <StatCard
          label="Total Earned"
          value="$0.00"
          icon={DollarSign}
        />
        <StatCard
          label="Months Qualified"
          value="0"
          icon={CheckCircle}
        />
      </div>

      {/* Monthly Checklist */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Monthly Checklist</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Receipt className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Submit $100 in Receipts</p>
                <p className="text-sm text-muted-foreground">$0 / $100 submitted</p>
              </div>
            </div>
            <a
              href="/member/upload"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Upload Receipt
            </a>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Complete Monthly Survey</p>
                <p className="text-sm text-muted-foreground">Not completed</p>
              </div>
            </div>
            <a
              href="/member/survey"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Take Survey
            </a>
          </div>
        </div>
      </div>

      {/* Active GRC */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-green-500" />
          Active GRC
        </h2>
        {activeGrc ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{activeGrc.merchantName}</h3>
                  <p className="text-sm text-muted-foreground">
                    ${activeGrc.denomination} &middot; {activeGrc.monthsRemaining} months remaining
                  </p>
                </div>
              </div>
            </div>
            {(activeGrc.groceryStore || (activeGrc.startMonth && activeGrc.startYear)) && (
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t text-sm text-muted-foreground">
                {activeGrc.groceryStore && (
                  <div className="flex items-center gap-1.5">
                    <Store className="w-4 h-4" />
                    <span>{activeGrc.groceryStore}</span>
                  </div>
                )}
                {activeGrc.startMonth && activeGrc.startYear && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>Started {MONTH_NAMES[activeGrc.startMonth - 1]} {activeGrc.startYear}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Gift className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No active GRC</p>
            {pendingGrcCount > 0 ? (
              <p className="text-sm text-muted-foreground mt-1">
                You have{" "}
                <a href="/member/grcs" className="text-primary hover:underline">
                  {pendingGrcCount} pending GRC{pendingGrcCount > 1 ? "s" : ""}
                </a>{" "}
                to activate
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                When a merchant sends you a GRC, it will appear here
              </p>
            )}
          </div>
        )}
      </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default function MemberDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <MemberDashboardContent />
    </Suspense>
  );
}
