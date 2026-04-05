/**
 * lib/anthropic.ts
 * Replaces lib/openai.ts — all AI analysis now goes through the Supabase Edge Function
 * which calls Claude Opus server-side. No API keys on the client.
 */
 
import { Platform } from 'react-native';
import { getItem, KEYS } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
 
// ── Types ──────────────────────────────────────────────────────────────────
 
export interface FeatureScore {
  score: number;
  summary: string;
}
 
export interface FeatureScores {
  skinQuality: FeatureScore;
  facialStructure: FeatureScore;
  eyes: FeatureScore;
  nose: FeatureScore;
  lipsAndMouth: FeatureScore;
  eyebrows: FeatureScore;
  hair: FeatureScore;
  overallHarmony: FeatureScore;
}
 
export interface Archetype {
  name: string;
  description: string;
}
 
export interface FeatureHighlight {
  feature: string;
  insight: string;
}
 
export interface Recommendation {
  title: string;
  feature: string;
  currentScore: number;
  potentialGain: string;
  action: string;
  category: 'natural' | 'soft-maxxing' | 'hard-maxxing' | 'experimental';
  timeframe: string;
}
 
export interface FaceAnalysisResult {
  glowScore: number;
  featureScores: FeatureScores;
  archetype: Archetype;
  topStrength: FeatureHighlight;
  topOpportunity: FeatureHighlight;
  recommendations: Recommendation[];
  personalNote: string;
  uniqueDetail: string;
  first_observation?: string;
  eyes_insight?: string;
  skin_insight?: string;
  structure_insight?: string;
  strongest_feature?: string;
  strongest_feature_insight?: string;
}
 
export interface AnalysisResponse {
  success: boolean;
  scanId: string | null;
  analysis: FaceAnalysisResult;
}
 
// ── Kept for backward compat with results.tsx during migration ─────────
// Remove once all references to the old shape are gone.
export interface AnalysisResult extends FaceAnalysisResult {}
 
// ── Config ─────────────────────────────────────────────────────────────────
 
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/analyze-face`;
 
// ── Helpers ────────────────────────────────────────────────────────────────
 
async function imageToBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
 
async function loadUserContext(): Promise<Record<string, any>> {
  const [name, age, height, weight, glowLevels, aesthetic] = await Promise.all([
    getItem<string>(KEYS.USER_NAME),
    getItem<string>(KEYS.USER_AGE),
    getItem<string>(KEYS.USER_HEIGHT),
    getItem<string>(KEYS.USER_WEIGHT),
    getItem<string[]>(KEYS.USER_GLOW_LEVEL),
    getItem<string>(KEYS.USER_AESTHETIC),
  ]);
 
  return {
    userName: name ?? undefined,
    userAge: age ?? undefined,
    userHeight: height ?? undefined,
    userWeight: weight ?? undefined,
    glowLevels: Array.isArray(glowLevels) ? glowLevels : glowLevels ? [glowLevels] : undefined,
    aesthetic: aesthetic ?? undefined,
  };
}
 
// ── Main Analysis Function ─────────────────────────────────────────────────
 
export type ProgressStage =
  | 'preparing'
  | 'uploading'
  | 'analyzing'
  | 'scoring'
  | 'finalizing'
  | 'complete';
 
export async function analyzeFace(
  imageUri: string,
  onProgress?: (stage: ProgressStage) => void,
  sideImageUri?: string | null,
  preloadedBase64?: string | null,
  preloadedSideBase64?: string | null,
): Promise<AnalysisResponse> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables not configured.');
  }
 
  onProgress?.('preparing');
  const base64 = preloadedBase64 ?? await imageToBase64(imageUri);

  let sideBase64: string | undefined;
  if (preloadedSideBase64) {
    sideBase64 = preloadedSideBase64;
  } else if (sideImageUri) {
    sideBase64 = await imageToBase64(sideImageUri);
  }

  onProgress?.('uploading');
  const userContext = await loadUserContext();

  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY!,
  };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  onProgress?.('analyzing');
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      imageBase64: base64,
      mediaType: 'image/jpeg',
      sideImageBase64: sideBase64,
      sideMediaType: sideBase64 ? 'image/jpeg' : undefined,
      ...userContext,
    }),
  });
 
  onProgress?.('scoring');
 
  if (!response.ok) {
    const errorBody = await response.text();
    let detail = `Server error (${response.status})`;
    try {
      const parsed = JSON.parse(errorBody);
      detail = parsed.detail || parsed.error || detail;
    } catch {}
    throw new Error(detail);
  }
 
  const data: AnalysisResponse = await response.json();
 
  if (!data.success || !data.analysis) {
    throw new Error('Analysis returned an invalid response.');
  }
 
  onProgress?.('complete');
  return data;
}
 
// ── Retry Wrapper ──────────────────────────────────────────────────────────
 
export async function analyzeFaceWithRetry(
  imageUri: string,
  onProgress?: (stage: ProgressStage) => void,
  maxRetries = 2,
  sideImageUri?: string | null,
  preloadedBase64?: string | null,
  preloadedSideBase64?: string | null,
): Promise<AnalysisResponse> {
  let lastError: Error | null = null;
 
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await analyzeFace(imageUri, onProgress, sideImageUri, preloadedBase64, preloadedSideBase64);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
        onProgress?.('preparing'); // Reset progress on retry
      }
    }
  }
 
  throw lastError!;
}

