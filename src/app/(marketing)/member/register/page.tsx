"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { WizardContainer } from "@/components/registration";
import {
  ConfirmEmailStep,
  PersonalInfoStep,
} from "@/components/registration/steps";
import type { PersonalInfo } from "@/lib/validations/member";

const STEPS = ["Confirm Email", "Personal Info"];

function MemberRegisterContent() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; role: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [personalInfo, setPersonalInfo] = useState<Partial<PersonalInfo>>({});

  useEffect(() => {
    async function fetchUser() {
      try {
        const userRes = await fetch("/api/auth/me", { cache: "no-store" });
        if (!userRes.ok) {
          router.push("/");
          return;
        }

        const userData = await userRes.json();
        if (userData.member) {
          router.push("/member");
          return;
        }

        setUser(userData.user);
      } catch (err) {
        console.error("Error fetching registration user:", err);
        setError("Failed to load registration data");
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [router]);

  const handlePersonalInfo = useCallback(
    async (data: PersonalInfo) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const res = await fetch("/api/member/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to save profile");
        }

        setPersonalInfo(data);
        router.push("/member");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save profile");
        setIsSubmitting(false);
      }
    },
    [router],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !user) {
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

  if (!user) {
    return null;
  }

  return (
    <WizardContainer
      currentStep={currentStep}
      totalSteps={STEPS.length}
      steps={STEPS}
      onBack={() => setCurrentStep(1)}
      showBack={currentStep > 1}
      title={currentStep === 1 ? "Welcome" : "Personal Information"}
      description={
        currentStep === 1
          ? "Let's get your account set up."
          : "Tell us a bit about yourself."
      }
    >
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {currentStep === 1 ? (
        <ConfirmEmailStep email={user.email} onNext={() => setCurrentStep(2)} />
      ) : (
        <PersonalInfoStep
          data={personalInfo}
          onNext={handlePersonalInfo}
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
