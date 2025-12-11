"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { WizardContainer } from "@/components/registration";
import {
  ConfirmEmailStep,
  PersonalInfoStep,
  GroceryStoreStep,
  SurveyStep,
  ReviewOfferStep,
  StartDateStep,
} from "@/components/registration/steps";
import type {
  PersonalInfo,
  GroceryStore,
  SurveyAnswers,
  StartDate,
} from "@/lib/validations/member";

interface GRCDetails {
  id: string;
  merchantId: string;
  merchantName: string;
  denomination: number;
  monthsRemaining: number;
  survey: {
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

interface WizardData {
  personalInfo: Partial<PersonalInfo>;
  groceryStore: Partial<GroceryStore>;
  surveyAnswers: SurveyAnswers;
  reviewContent?: string;
  startDate: Partial<StartDate>;
}

const STEPS = [
  "Confirm Email",
  "Personal Info",
  "Grocery Store",
  "Survey",
  "Review Offer",
  "Start Date",
];

function MemberRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const grcId = searchParams.get("grc");

  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [grcDetails, setGrcDetails] = useState<GRCDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bonusMonth, setBonusMonth] = useState(false);

  const [wizardData, setWizardData] = useState<WizardData>({
    personalInfo: {},
    groceryStore: {},
    surveyAnswers: {},
    reviewContent: undefined,
    startDate: {},
  });

  // Fetch user and GRC details
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user
        const userRes = await fetch("/api/auth/me");
        if (!userRes.ok) {
          router.push("/");
          return;
        }
        const userData = await userRes.json();

        // Check if user already has a member profile
        if (userData.member) {
          // Already registered, redirect to dashboard or onboarding
          if (grcId) {
            router.push(`/member/grc-onboarding/${grcId}`);
          } else {
            router.push("/member");
          }
          return;
        }

        setUser(userData.user);

        // Fetch GRC details if grcId is provided
        if (grcId) {
          const grcRes = await fetch(`/api/grc/${grcId}`);
          if (grcRes.ok) {
            const grcData = await grcRes.json();
            setGrcDetails(grcData);
          } else {
            const grcError = await grcRes.json();
            setError(grcError.error || "Failed to load GRC details");
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load registration data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router, grcId]);

  // Update URL with current step
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("step", String(currentStep));
    window.history.replaceState({}, "", url.toString());
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleConfirmEmail = useCallback(() => {
    setCurrentStep(2);
  }, []);

  const handlePersonalInfo = useCallback(async (data: PersonalInfo) => {
    setIsSubmitting(true);
    try {
      // Save member profile
      const res = await fetch("/api/member/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save profile");
      }

      setWizardData((prev) => ({ ...prev, personalInfo: data }));
      setCurrentStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const handleGroceryStore = useCallback((data: GroceryStore) => {
    setWizardData((prev) => ({ ...prev, groceryStore: data }));
    setCurrentStep(4);
  }, []);

  const handleSurvey = useCallback((data: SurveyAnswers) => {
    setWizardData((prev) => ({ ...prev, surveyAnswers: data }));
    setCurrentStep(5);
  }, []);

  const handleReview = useCallback((reviewContent: string | undefined) => {
    setWizardData((prev) => ({ ...prev, reviewContent }));
    setBonusMonth(!!reviewContent);
    setCurrentStep(6);
  }, []);

  const handleStartDate = useCallback(async (data: StartDate) => {
    if (!grcId || !grcDetails) {
      // No GRC - just redirect to dashboard
      router.push("/member");
      return;
    }

    setIsSubmitting(true);
    try {
      // Register GRC with all collected data
      const res = await fetch("/api/member/register-grc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grcId,
          groceryStore: wizardData.groceryStore.groceryStore,
          groceryStorePlaceId: wizardData.groceryStore.groceryStorePlaceId,
          surveyAnswers: Object.keys(wizardData.surveyAnswers).length > 0
            ? wizardData.surveyAnswers
            : undefined,
          reviewContent: wizardData.reviewContent,
          startMonth: data.startMonth,
          startYear: data.startYear,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to complete registration");
      }

      // Success - redirect to member dashboard
      router.push("/member?registered=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete registration");
      setIsSubmitting(false);
    }
  }, [grcId, grcDetails, wizardData, router]);

  // Loading state
  if (loading) {
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
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="text-primary underline"
          >
            Return home
          </button>
        </div>
      </div>
    );
  }

  // No user
  if (!user) {
    return null;
  }

  // Determine step titles based on context
  const stepTitle = () => {
    switch (currentStep) {
      case 1:
        return { title: "Welcome!", description: "Let's get your account set up." };
      case 2:
        return { title: "Personal Information", description: "Tell us a bit about yourself." };
      case 3:
        return { title: "Select Your Store", description: undefined };
      case 4:
        return { title: "Quick Survey", description: undefined };
      case 5:
        return { title: "Bonus Opportunity", description: undefined };
      case 6:
        return { title: "Choose Start Date", description: undefined };
      default:
        return { title: undefined, description: undefined };
    }
  };

  const { title, description } = stepTitle();

  // If no GRC, adjust steps (skip survey if no merchant survey)
  const effectiveSteps = grcDetails?.survey ? STEPS : STEPS.filter(s => s !== "Survey");
  const totalSteps = effectiveSteps.length;

  // Adjust current step for display if survey is skipped
  const displayStep = !grcDetails?.survey && currentStep > 3 ? currentStep - 1 : currentStep;

  return (
    <WizardContainer
      currentStep={displayStep}
      totalSteps={totalSteps}
      steps={effectiveSteps}
      onBack={handleBack}
      showBack={currentStep > 1}
      title={title}
      description={description}
    >
      {currentStep === 1 && (
        <ConfirmEmailStep email={user.email} onNext={handleConfirmEmail} />
      )}

      {currentStep === 2 && (
        <PersonalInfoStep
          data={wizardData.personalInfo}
          onNext={handlePersonalInfo}
          isLoading={isSubmitting}
        />
      )}

      {currentStep === 3 && (
        <GroceryStoreStep
          data={wizardData.groceryStore}
          onNext={handleGroceryStore}
          isLoading={isSubmitting}
        />
      )}

      {currentStep === 4 && (
        <SurveyStep
          merchantName={grcDetails?.merchantName || "the merchant"}
          questions={grcDetails?.survey?.questions || []}
          data={wizardData.surveyAnswers}
          onNext={handleSurvey}
          isLoading={isSubmitting}
        />
      )}

      {currentStep === 5 && (
        <ReviewOfferStep
          merchantName={grcDetails?.merchantName || "the merchant"}
          onNext={handleReview}
          isLoading={isSubmitting}
        />
      )}

      {currentStep === 6 && (
        <StartDateStep
          denomination={grcDetails?.denomination || 100}
          monthsRemaining={grcDetails?.monthsRemaining || 4}
          bonusMonth={bonusMonth}
          onNext={handleStartDate}
          isLoading={isSubmitting}
        />
      )}
    </WizardContainer>
  );
}

export default function MemberRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <MemberRegisterContent />
    </Suspense>
  );
}
