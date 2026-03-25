import { useState, useEffect, useCallback } from "react";
import {
  isOnboardingComplete,
  completeOnboarding,
  getUserGoal,
  setUserGoal,
  setReferralCode,
} from "@/lib/storage";

type OnboardingStep = "splash" | "goal" | "social-proof" | "referral" | "auth";

const STEP_ORDER: OnboardingStep[] = [
  "splash",
  "goal",
  "social-proof",
  "referral",
  "auth",
];

export function useOnboarding() {
  const [isComplete, setIsComplete] = useState<boolean | null>(null);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("splash");
  const [goal, setGoal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [complete, savedGoal] = await Promise.all([
        isOnboardingComplete(),
        getUserGoal(),
      ]);
      setIsComplete(complete);
      setGoal(savedGoal);
      setIsLoading(false);
    })();
  }, []);

  const nextStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[currentIndex + 1]);
    }
  }, [currentStep]);

  const selectGoal = useCallback(async (selectedGoal: string) => {
    await setUserGoal(selectedGoal);
    setGoal(selectedGoal);
  }, []);

  const submitReferral = useCallback(async (code: string) => {
    if (code.trim()) {
      await setReferralCode(code.trim());
    }
  }, []);

  const finishOnboarding = useCallback(async () => {
    await completeOnboarding();
    setIsComplete(true);
  }, []);

  return {
    isComplete,
    isLoading,
    currentStep,
    goal,
    nextStep,
    selectGoal,
    submitReferral,
    finishOnboarding,
  };
}
