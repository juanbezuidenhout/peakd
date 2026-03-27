import { useState, useEffect, useCallback } from "react";
import {
  isOnboardingComplete,
  completeOnboarding,
  getUserGoal,
  setUserGoal,
  setReferralCode,
  getUserName,
  setUserName as storeUserName,
  getUserAge,
  setUserAge as storeUserAge,
  getUserHeight,
  setUserHeight as storeUserHeight,
  getUserWeight,
  setUserWeight as storeUserWeight,
  getUserGlowLevel,
  setUserGlowLevel as storeUserGlowLevel,
  getUserAesthetic,
  setUserAesthetic as storeUserAesthetic,
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
  const [name, setName] = useState<string | null>(null);
  const [age, setAge] = useState<string | null>(null);
  const [height, setHeight] = useState<string | null>(null);
  const [weight, setWeight] = useState<string | null>(null);
  const [glowLevel, setGlowLevel] = useState<string | null>(null);
  const [aesthetic, setAesthetic] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [complete, savedGoal, savedName, savedAge, savedHeight, savedWeight, savedGlow, savedAesthetic] =
        await Promise.all([
          isOnboardingComplete(),
          getUserGoal(),
          getUserName(),
          getUserAge(),
          getUserHeight(),
          getUserWeight(),
          getUserGlowLevel(),
          getUserAesthetic(),
        ]);
      setIsComplete(complete);
      setGoal(savedGoal);
      setName(savedName);
      setAge(savedAge);
      setHeight(savedHeight);
      setWeight(savedWeight);
      setGlowLevel(savedGlow);
      setAesthetic(savedAesthetic);
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

  const updateName = useCallback(async (value: string) => {
    await storeUserName(value);
    setName(value);
  }, []);

  const updateAge = useCallback(async (value: string) => {
    await storeUserAge(value);
    setAge(value);
  }, []);

  const updateHeight = useCallback(async (value: string) => {
    await storeUserHeight(value);
    setHeight(value);
  }, []);

  const updateWeight = useCallback(async (value: string) => {
    await storeUserWeight(value);
    setWeight(value);
  }, []);

  const updateGlowLevel = useCallback(async (value: string) => {
    await storeUserGlowLevel(value);
    setGlowLevel(value);
  }, []);

  const updateAesthetic = useCallback(async (value: string) => {
    await storeUserAesthetic(value);
    setAesthetic(value);
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
    name,
    age,
    height,
    weight,
    glowLevel,
    aesthetic,
    nextStep,
    selectGoal,
    submitReferral,
    updateName,
    updateAge,
    updateHeight,
    updateWeight,
    updateGlowLevel,
    updateAesthetic,
    finishOnboarding,
  };
}
