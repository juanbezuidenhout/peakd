/**
 * lib/review.ts
 *
 * Centralised helper for triggering the native App Store / Play Store
 * in-app review prompt via expo-store-review.
 *
 * Platform behaviour
 * ──────────────────
 * iOS  : Shows the native SKStoreReviewController modal (star-rating sheet).
 *        Apple throttles this to a maximum of 3 times per 365 days per user,
 *        so the OS may silently suppress the prompt even when we call it.
 * Android : Shows the Google Play In-App Review bottom-sheet.
 *
 * Guard logic
 * ───────────
 * We persist a flag in AsyncStorage so we never attempt to show the prompt
 * more than once per install.  This is a best-effort guard on top of the
 * OS-level throttling.
 */

import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HAS_PROMPTED_REVIEW_KEY = 'peakd_has_prompted_review';

/**
 * Request the native in-app review prompt.
 *
 * @param force  Set to `true` to bypass the once-per-install guard (useful
 *               for testing).  Defaults to `false`.
 */
export async function requestNativeReview(force = false): Promise<void> {
  try {
    // ── Once-per-install guard ──────────────────────────────────────────────
    if (!force) {
      const already = await AsyncStorage.getItem(HAS_PROMPTED_REVIEW_KEY);
      if (already === 'true') return;
    }

    // ── Check platform capability ───────────────────────────────────────────
    const available = await StoreReview.isAvailableAsync();
    if (!available) {
      // Native review not supported on this device/OS version — silently skip.
      return;
    }

    // ── Trigger the native prompt ───────────────────────────────────────────
    await StoreReview.requestReview();

    // ── Mark as prompted so we don't show it again ──────────────────────────
    await AsyncStorage.setItem(HAS_PROMPTED_REVIEW_KEY, 'true');
  } catch {
    // Never let review errors bubble up and interrupt the user flow.
  }
}
