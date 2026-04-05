import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';

const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY!;
const ENTITLEMENT_ID = 'pro';

export function configureRevenueCat(): void {
  if (Platform.OS !== 'ios') return;
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey: API_KEY });
}

export async function identifyRevenueCatUser(supabaseUserId: string): Promise<void> {
  try {
    await Purchases.logIn(supabaseUserId);
  } catch (e) {
    console.error('[RC] identify error', e);
  }
}

export async function resetRevenueCatUser(): Promise<void> {
  try {
    await Purchases.logOut();
  } catch (e) {
    console.error('[RC] reset error', e);
  }
}

export async function hasPremiumAccess(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
  } catch {
    return false;
  }
}

export async function getPaywallPackages(): Promise<{
  weekly: PurchasesPackage | null;
  lifetime: PurchasesPackage | null;
}> {
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return { weekly: null, lifetime: null };
    return {
      weekly: current.weekly ?? null,
      lifetime: current.lifetime ?? null,
    };
  } catch {
    return { weekly: null, lifetime: null };
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
  } catch (e: any) {
    if (!e.userCancelled) console.error('[RC] purchase error', e);
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const info = await Purchases.restorePurchases();
    return typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
  } catch {
    return false;
  }
}
