import { supabase } from '@/lib/supabase';
import { getItem, setItem } from '@/lib/storage';

const INVITE_CODE_KEY = 'peakd_invite_code';

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Generates a random 6-character alphanumeric code (uppercase letters + digits).
 * e.g. "PK4X2A", "B7R9MQ"
 */
function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Returns the current user's invite code.
 * - Checks local cache first.
 * - If not cached, checks Supabase for an existing code owned by this user.
 * - If none exists, generates a new unique code, stores it in Supabase, and caches it locally.
 */
export async function getOrCreateInviteCode(): Promise<string | null> {
  // 1. Check local cache
  const cached = await getItem<string>(INVITE_CODE_KEY);
  if (cached) return cached;

  // 2. Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 3. Check Supabase for existing code
  const { data: existing } = await supabase
    .from('invite_codes')
    .select('code')
    .eq('owner_user_id', user.id)
    .maybeSingle();

  if (existing?.code) {
    await setItem(INVITE_CODE_KEY, existing.code);
    return existing.code;
  }

  // 4. Generate a new unique code
  let newCode = '';
  let attempts = 0;
  while (attempts < 10) {
    const candidate = generateRandomCode();
    const { data: conflict } = await supabase
      .from('invite_codes')
      .select('code')
      .eq('code', candidate)
      .maybeSingle();

    if (!conflict) {
      newCode = candidate;
      break;
    }
    attempts++;
  }

  if (!newCode) return null;

  // 5. Insert into Supabase
  const { error } = await supabase.from('invite_codes').insert({
    code: newCode,
    owner_user_id: user.id,
  });

  if (error) {
    console.error('[InviteCodes] insert error', error);
    return null;
  }

  // 6. Cache locally
  await setItem(INVITE_CODE_KEY, newCode);
  return newCode;
}

export type InviteGrantType = 'discount' | 'free_access';

/**
 * Validates an invite code entered by a new user on the paywall.
 * Returns true if the code exists and has not exceeded max_uses.
 * Also increments times_used on success.
 *
 * `grantType` tells the caller what the code unlocks:
 *   - 'discount'    → route to promo paywall (40 % off)
 *   - 'free_access' → grant full access with no payment
 */
export async function validateAndRedeemInviteCode(code: string): Promise<{
  valid: boolean;
  grantType?: InviteGrantType;
  error?: string;
}> {
  const normalised = code.trim().toUpperCase();

  if (normalised.length !== 6) {
    return { valid: false, error: 'Codes are 6 characters long.' };
  }

  const { data, error } = await supabase
    .from('invite_codes')
    .select('id, times_used, max_uses, grant_type')
    .eq('code', normalised)
    .maybeSingle();

  if (error || !data) {
    return { valid: false, error: 'Invalid invite code.' };
  }

  if (data.times_used >= data.max_uses) {
    return { valid: false, error: 'This invite code has expired.' };
  }

  await supabase
    .from('invite_codes')
    .update({ times_used: data.times_used + 1 })
    .eq('id', data.id);

  const grantType: InviteGrantType = data.grant_type === 'free_access' ? 'free_access' : 'discount';

  return { valid: true, grantType };
}
