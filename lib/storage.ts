import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  ONBOARDING_COMPLETE: "peakd_onboarding_complete",
  USER_GOAL: "peakd_user_goal",
  REFERRAL_CODE: "peakd_referral_code",
  SCAN_HISTORY: "peakd_scan_history",
  SCAN_RESULT: "scan_result",
  SCAN_IMAGE_URI: "peakd_scan_image_uri",
  AUTH_TOKEN: "peakd_auth_token",
  DAILY_STREAK: "peakd_daily_streak",
  IS_PRO: "peakd_is_pro",
  HAS_COMPLETED_PURCHASE: "peakd_has_completed_purchase",
  USER_NAME: "peakd_user_name",
  USER_AGE: "peakd_user_age",
  USER_HEIGHT: "peakd_user_height",
  USER_WEIGHT: "peakd_user_weight",
  USER_GLOW_LEVEL: "peakd_user_glow_level",
  USER_AESTHETIC: "peakd_user_aesthetic",
} as const;

export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail in production; log in dev
    if (__DEV__) console.warn(`Failed to save ${key}`);
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    if (__DEV__) console.warn(`Failed to remove ${key}`);
  }
}

export async function isOnboardingComplete(): Promise<boolean> {
  return (await getItem<boolean>(KEYS.ONBOARDING_COMPLETE)) ?? false;
}

export async function completeOnboarding(): Promise<void> {
  await setItem(KEYS.ONBOARDING_COMPLETE, true);
}

export async function getUserGoal(): Promise<string | null> {
  return getItem<string>(KEYS.USER_GOAL);
}

export async function setUserGoal(goal: string): Promise<void> {
  await setItem(KEYS.USER_GOAL, goal);
}

export async function setReferralCode(code: string): Promise<void> {
  await setItem(KEYS.REFERRAL_CODE, code);
}

export async function getReferralCode(): Promise<string | null> {
  return getItem<string>(KEYS.REFERRAL_CODE);
}

// --- Quiz profile data ---

export async function getUserName(): Promise<string | null> {
  return getItem<string>(KEYS.USER_NAME);
}

export async function setUserName(name: string): Promise<void> {
  await setItem(KEYS.USER_NAME, name);
}

export async function getUserAge(): Promise<string | null> {
  return getItem<string>(KEYS.USER_AGE);
}

export async function setUserAge(age: string): Promise<void> {
  await setItem(KEYS.USER_AGE, age);
}

export async function getUserHeight(): Promise<string | null> {
  return getItem<string>(KEYS.USER_HEIGHT);
}

export async function setUserHeight(height: string): Promise<void> {
  await setItem(KEYS.USER_HEIGHT, height);
}

export async function getUserWeight(): Promise<string | null> {
  return getItem<string>(KEYS.USER_WEIGHT);
}

export async function setUserWeight(weight: string): Promise<void> {
  await setItem(KEYS.USER_WEIGHT, weight);
}

export async function getUserGlowLevel(): Promise<string | null> {
  return getItem<string>(KEYS.USER_GLOW_LEVEL);
}

export async function setUserGlowLevel(level: string): Promise<void> {
  await setItem(KEYS.USER_GLOW_LEVEL, level);
}

export async function getUserAesthetic(): Promise<string | null> {
  return getItem<string>(KEYS.USER_AESTHETIC);
}

export async function setUserAesthetic(aesthetic: string): Promise<void> {
  await setItem(KEYS.USER_AESTHETIC, aesthetic);
}

// --- Daily Tasks ---

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function dailyCompletedKey(date: string): string {
  return `peakd_daily_completed_${date}`;
}

interface StreakData {
  count: number;
  lastDate: string;
}

export async function getDailyCompleted(): Promise<string[]> {
  const key = dailyCompletedKey(getTodayKey());
  return (await getItem<string[]>(key)) ?? [];
}

export async function setDailyCompleted(taskIds: string[]): Promise<void> {
  const key = dailyCompletedKey(getTodayKey());
  await setItem(key, taskIds);
}

export async function getDailyStreak(): Promise<number> {
  const data = await getItem<StreakData>(KEYS.DAILY_STREAK);
  if (!data) return 0;

  const today = getTodayKey();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (data.lastDate === today || data.lastDate === yesterday) {
    return data.count;
  }
  return 0;
}

export async function incrementDailyStreak(): Promise<number> {
  const data = await getItem<StreakData>(KEYS.DAILY_STREAK);
  const today = getTodayKey();

  if (data?.lastDate === today) return data.count;

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const wasYesterday = data?.lastDate === yesterday;
  const newCount = wasYesterday ? (data?.count ?? 0) + 1 : 1;

  await setItem(KEYS.DAILY_STREAK, { count: newCount, lastDate: today });
  return newCount;
}

export async function getIsPro(): Promise<boolean> {
  return (await getItem<boolean>(KEYS.IS_PRO)) ?? false;
}

export async function hasCompletedPurchase(): Promise<boolean> {
  return (await getItem<boolean>(KEYS.HAS_COMPLETED_PURCHASE)) ?? false;
}

export async function setCompletedPurchase(): Promise<void> {
  await setItem(KEYS.HAS_COMPLETED_PURCHASE, true);
}

export { KEYS };
