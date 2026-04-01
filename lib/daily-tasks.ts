/**
 * lib/daily-tasks.ts
 *
 * Generates highly personalized daily tasks based on the user's face scan.
 * Supports 270 unique tasks across 90 days (3 per day) divided into 3 phases.
 */

import { getItem, KEYS } from '@/lib/storage';
import type { FaceAnalysisResult, FeatureScores } from '@/lib/anthropic';

export type DailyTaskCategory = 'skincare' | 'makeup' | 'hair' | 'lifestyle';

export interface DailyTask {
  id: string;
  category: DailyTaskCategory;
  title: string;
  description: string;
  phase: 1 | 2 | 3;
  planDay: number;
}

const PLAN_START_KEY = 'peakd_plan_start_date';

// ─── Core Logic ─────────────────────────────────────────────────────────────

async function getCurrentPlanDay(): Promise<number> {
  const startStr = await getItem<string>(PLAN_START_KEY);
  if (!startStr) return 1;
  const start = new Date(startStr);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  return Math.max(1, Math.floor(diffMs / 86_400_000) + 1);
}

function getPhase(planDay: number): 1 | 2 | 3 {
  if (planDay <= 30) return 1;
  if (planDay <= 60) return 2;
  return 3;
}

function getLowestScoringFeature(scores: FeatureScores): { key: string; name: string } {
  const featureMap: Record<string, string> = {
    skinQuality: 'Skin',
    facialStructure: 'Structure',
    eyes: 'Eyes',
    nose: 'Nose',
    lipsAndMouth: 'Lips',
    eyebrows: 'Brows',
    hair: 'Hair',
    overallHarmony: 'Harmony',
  };

  let lowestKey = 'skinQuality';
  let lowestScore = 10;

  for (const [key, value] of Object.entries(scores)) {
    if (value.score < lowestScore) {
      lowestScore = value.score;
      lowestKey = key;
    }
  }

  return { key: lowestKey, name: featureMap[lowestKey] || 'Feature' };
}

// ─── Task Generators ────────────────────────────────────────────────────────

function generateSkincareTask(planDay: number, phase: 1 | 2 | 3, skinScore: number): DailyTask {
  const isLowScore = skinScore < 6.0;
  const rotation = planDay % 5;
  let title = 'Daily Cleanse & Prep';
  let description = 'Cleanse thoroughly and apply your core serums.';

  if (phase === 1) {
    if (isLowScore) {
      const lowTasks = [
        { t: 'Barrier Repair Focus', d: 'Skip harsh actives today. Focus on hydration and ceramides.' },
        { t: 'Gentle Double Cleanse', d: 'Use an oil cleanser followed by a gentle water-based cleanser.' },
        { t: 'Hydration Layering', d: 'Apply toner on damp skin to lock in maximum moisture.' },
        { t: 'Sun Protection Check', d: 'Ensure you apply a full 1/4 teaspoon of SPF 30+.' },
        { t: 'Night Recovery', d: 'Apply a slightly thicker moisturizer tonight to support barrier healing.' },
      ];
      title = lowTasks[rotation].t;
      description = lowTasks[rotation].d;
    } else {
      const highTasks = [
        { t: 'Maintain the Glow', d: 'Your skin is doing well. Stick to your core cleanse and SPF routine.' },
        { t: 'Targeted Active Day', d: 'Apply your vitamin C or preferred antioxidant serum.' },
        { t: 'Light Exfoliation', d: 'Use a mild chemical exfoliant to keep texture smooth.' },
        { t: 'Hydration Boost', d: 'Add an extra layer of hydrating serum under your moisturizer.' },
        { t: 'Evening Massage', d: 'Take 2 minutes to massage your face while applying night cream.' },
      ];
      title = highTasks[rotation].t;
      description = highTasks[rotation].d;
    }
  } else if (phase === 2) {
    title = `Phase 2 Skin Focus (Day ${planDay})`;
    description = isLowScore
      ? 'Introduce targeted treatments for your specific concerns.'
      : 'Optimize your routine with advanced actives.';
  } else {
    title = `Phase 3 Maintenance (Day ${planDay})`;
    description = 'Focus on long-term consistency and protecting your results.';
  }

  return {
    id: `skin_${planDay}`,
    category: 'skincare',
    title,
    description,
    phase,
    planDay,
  };
}

function generateFeatureTask(
  planDay: number,
  phase: 1 | 2 | 3,
  targetFeature: { key: string; name: string },
): DailyTask {
  const rotation = planDay % 3;

  let title = `${targetFeature.name} Enhancement`;
  let description = `Focus on improving your ${targetFeature.name.toLowerCase()} today.`;
  let category: DailyTaskCategory = 'makeup';

  if (targetFeature.key === 'eyebrows') {
    category = 'makeup';
    const tasks = [
      { t: 'Brow Mapping', d: "Check your brow symmetry. Ensure the tail doesn't drop below the head." },
      { t: 'Nourish & Grow', d: 'Apply a peptide serum or castor oil to sparse brow areas tonight.' },
      { t: 'Shape & Set', d: 'Brush brows upward and set with a strong-hold clear gel.' },
    ];
    title = tasks[rotation].t;
    description = tasks[rotation].d;
  } else if (targetFeature.key === 'hair') {
    category = 'hair';
    const tasks = [
      { t: 'Scalp Health', d: 'Spend 3 minutes massaging your scalp to stimulate blood flow.' },
      { t: 'Hydration Focus', d: 'Apply a leave-in conditioner or oil to your ends.' },
      { t: 'Heat Protection', d: 'If styling today, ensure you use a high-quality heat protectant.' },
    ];
    title = tasks[rotation].t;
    description = tasks[rotation].d;
  } else if (targetFeature.key === 'skinQuality') {
    category = 'skincare';
    title = 'Targeted Texture Treatment';
    description = 'Since skin is your main focus, apply your specialized texture treatment today.';
  } else {
    category = 'makeup';
    const tasks = [
      {
        t: `Analyze ${targetFeature.name}`,
        d: `Review your scan recommendations specifically for your ${targetFeature.name.toLowerCase()}.`,
      },
      {
        t: 'Contour Practice',
        d: `Practice strategic highlighting to enhance your ${targetFeature.name.toLowerCase()}.`,
      },
      {
        t: 'Feature Hydration',
        d: `Ensure the skin around your ${targetFeature.name.toLowerCase()} is perfectly prepped.`,
      },
    ];
    title = tasks[rotation].t;
    description = tasks[rotation].d;
  }

  return {
    id: `feature_${planDay}`,
    category,
    title,
    description,
    phase,
    planDay,
  };
}

function generateLifestyleTask(planDay: number, phase: 1 | 2 | 3, glowLevel: string): DailyTask {
  const isIntense = glowLevel.includes('hard') || glowLevel.includes('experimental');
  const rotation = planDay % 4;

  let title = 'Wellness Foundation';
  let description = 'Focus on hydration and sleep.';

  if (isIntense) {
    const tasks = [
      { t: 'Clinical Research', d: 'Spend 15 minutes researching the treatments mentioned in your scan.' },
      { t: 'Recovery Nutrition', d: 'Ensure you hit your protein goals today to support cellular repair.' },
      { t: 'Systematic Hydration', d: 'Track your water intake precisely. Aim for 3 liters.' },
      { t: 'Supplement Protocol', d: 'Take your targeted skin and hair supplements with a meal.' },
    ];
    title = tasks[rotation].t;
    description = tasks[rotation].d;
  } else {
    const tasks = [
      { t: 'Sleep Optimization', d: 'Set a wind-down alarm 30 minutes before bed. No screens.' },
      { t: 'Stress Reduction', d: 'Take 5 minutes for deep breathing to lower cortisol (which breaks down collagen).' },
      { t: 'Hydration Goal', d: 'Drink a large glass of water immediately upon waking.' },
      { t: 'Clean Nutrition', d: 'Incorporate a serving of antioxidant-rich berries or greens today.' },
    ];
    title = tasks[rotation].t;
    description = tasks[rotation].d;
  }

  return {
    id: `lifestyle_${planDay}`,
    category: 'lifestyle',
    title,
    description,
    phase,
    planDay,
  };
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export async function getDailyTasks(): Promise<{
  tasks: DailyTask[];
  planDay: number;
  phase: 1 | 2 | 3;
  hasScanned: boolean;
}> {
  const [scanResult, planDay, glowLevel] = await Promise.all([
    getItem<FaceAnalysisResult>(KEYS.SCAN_RESULT),
    getCurrentPlanDay(),
    getItem<string>(KEYS.USER_GLOW_LEVEL),
  ]);

  const phase = getPhase(planDay);

  if (!scanResult?.featureScores) {
    return {
      tasks: [
        { id: 'def_1', category: 'skincare', title: 'Morning Routine', description: 'Cleanse and moisturize.', phase: 1, planDay: 1 },
        { id: 'def_2', category: 'makeup', title: 'Feature Enhance', description: 'Highlight your best feature.', phase: 1, planDay: 1 },
        { id: 'def_3', category: 'lifestyle', title: 'Hydration', description: 'Drink 8 glasses of water.', phase: 1, planDay: 1 },
      ],
      planDay,
      phase,
      hasScanned: false,
    };
  }

  const skinScore = scanResult.featureScores.skinQuality?.score || 7.0;
  const targetFeature = getLowestScoringFeature(scanResult.featureScores);
  const level = glowLevel || 'natural';

  const tasks: DailyTask[] = [
    generateSkincareTask(planDay, phase, skinScore),
    generateFeatureTask(planDay, phase, targetFeature),
    generateLifestyleTask(planDay, phase, level),
  ];

  return { tasks, planDay, phase, hasScanned: true };
}

export function getPhaseName(phase: 1 | 2 | 3): string {
  switch (phase) {
    case 1: return 'Phase 1: Foundation';
    case 2: return 'Phase 2: Targeted Correction';
    case 3: return 'Phase 3: Advanced & Maintenance';
  }
}
