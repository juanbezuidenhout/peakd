import { incrementReferralCount, setItem, getItem } from "./storage";

export const PENDING_REFERRER_KEY = "peakd_pending_referrer";

/**
 * Generates a deep link for inviting new users.
 * @param userId - The referrer's user ID
 * @returns A deep link URL with the referrer ID as a query parameter
 */
export function generateReferralLink(userId: string): string {
  return `peakd://invite?ref=${encodeURIComponent(userId)}`;
}

/**
 * Handles scan completion for a new user.
 * If a referrerId is provided (or stored pending), increments the referral count.
 * @param referrerId - Optional referrer ID to credit for this signup
 * @returns The new referral count if incremented, null otherwise
 */
export async function handleScanCompletion(
  referrerId?: string
): Promise<number | null> {
  const pendingReferrer = referrerId ?? (await getPendingReferrer());

  if (pendingReferrer) {
    const newCount = await incrementReferralCount();
    await clearPendingReferrer();
    return newCount;
  }

  return null;
}

/**
 * Stores a pending referrer ID in AsyncStorage for later processing.
 * This is called when the app opens from a deep link.
 * @param referrerId - The referrer's user ID
 */
export async function setPendingReferrer(referrerId: string): Promise<void> {
  await setItem(PENDING_REFERRER_KEY, referrerId);
}

/**
 * Retrieves the pending referrer ID from AsyncStorage.
 * @returns The pending referrer ID, or null if none exists
 */
export async function getPendingReferrer(): Promise<string | null> {
  return getItem<string>(PENDING_REFERRER_KEY);
}

/**
 * Clears the pending referrer from AsyncStorage.
 * Called after scan completion to prevent duplicate counting.
 */
export async function clearPendingReferrer(): Promise<void> {
  await setItem(PENDING_REFERRER_KEY, null);
}

/**
 * Parses a deep link URL to extract the referrer ID.
 * @param url - The deep link URL
 * @returns The referrer ID, or null if not found
 */
export function extractReferrerFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const ref = urlObj.searchParams.get("ref");
    return ref;
  } catch {
    // If URL parsing fails, try simple regex fallback
    const match = url.match(/[?&]ref=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
}
