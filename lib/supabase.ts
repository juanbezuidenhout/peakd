import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

const REVIEWER_EMAIL = 'appreviewer@trypeakd.com';

export async function isReviewerAccount(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.email === REVIEWER_EMAIL;
  } catch {
    return false;
  }
}