import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesPackage,
  type PurchasesError,
} from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import { CONFIG } from "@/config";

// RevenueCat ships native code: it works in dev/EAS builds on iOS & Android,
// but not on web (react-native-web) or inside Expo Go. Every export no-ops
// gracefully when unsupported so the rest of the app never has to check.
const PLATFORM_SUPPORTED = Platform.OS === "ios" || Platform.OS === "android";

let configured = false;

export function isPurchasesSupported(): boolean {
  return configured;
}

// ─── Setup ───────────────────────────────────

/**
 * Call once at app startup, before any other purchases call.
 * Safe to call with or without a known user: anonymous purchases are
 * attached to the account later via logInPurchases().
 */
export function configurePurchases(appUserID?: string | null): void {
  if (!PLATFORM_SUPPORTED || configured) return;
  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    Purchases.configure({
      apiKey: CONFIG.REVENUECAT.API_KEY,
      appUserID: appUserID ?? undefined,
    });
    configured = true;
  } catch (err) {
    // Native module missing (e.g. Expo Go) — leave `configured` false so
    // every other call below becomes a no-op.
    console.warn("[purchases] RevenueCat unavailable:", err);
  }
}

// ─── Entitlements ────────────────────────────

/** True when the "Little World Premium" entitlement is active. */
export function hasPremium(info: CustomerInfo | null | undefined): boolean {
  return (
    info?.entitlements.active[CONFIG.REVENUECAT.ENTITLEMENT_ID] !== undefined
  );
}

// ─── Customer info & identity ────────────────

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (err) {
    console.warn("[purchases] getCustomerInfo failed:", err);
    return null;
  }
}

/** Ties the RevenueCat customer to our backend user id after login. */
export async function logInPurchases(
  appUserID: string
): Promise<CustomerInfo | null> {
  if (!configured) return null;
  try {
    const { customerInfo } = await Purchases.logIn(appUserID);
    return customerInfo;
  } catch (err) {
    console.warn("[purchases] logIn failed:", err);
    return null;
  }
}

/** Back to an anonymous RevenueCat user after app logout. */
export async function logOutPurchases(): Promise<void> {
  if (!configured) return;
  try {
    // Logging out an already-anonymous user throws — check first.
    if (!(await Purchases.isAnonymous())) {
      await Purchases.logOut();
    }
  } catch (err) {
    console.warn("[purchases] logOut failed:", err);
  }
}

/**
 * Fires on purchase, restore, renewal, and expiration. Returns an
 * unsubscribe function. Safe to call before configure (no-op).
 */
export function addCustomerInfoListener(
  onChange: (info: CustomerInfo) => void
): () => void {
  if (!configured) return () => {};
  Purchases.addCustomerInfoUpdateListener(onChange);
  return () => Purchases.removeCustomerInfoUpdateListener(onChange);
}

// ─── Purchasing ──────────────────────────────

export interface PurchaseOutcome {
  customerInfo: CustomerInfo | null;
  /** User closed the store sheet — not an error, don't show one. */
  cancelled: boolean;
  errorMessage?: string;
}

/** The monthly package from the current offering. */
export async function getMonthlyPackage(): Promise<PurchasesPackage | null> {
  if (!configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    // "Current" is whatever the dashboard marks as default; fall back to our
    // named offering if no current one is set.
    const current =
      offerings.current ?? offerings.all[CONFIG.REVENUECAT.OFFERING_ID] ?? null;
    if (!current) return null;
    return (
      current.monthly ??
      current.availablePackages.find(
        (p) => p.identifier === CONFIG.REVENUECAT.MONTHLY_PACKAGE_ID
      ) ??
      current.availablePackages[0] ??
      null
    );
  } catch (err) {
    console.warn("[purchases] getOfferings failed:", err);
    return null;
  }
}

let cachedPriceString: string | null = null;

/**
 * Store-localized monthly price ("$4.99", "4,99 €", …) from the offering.
 * Null when the SDK/offering is unavailable — callers keep their fallback
 * (the shared SUBSCRIPTION_PRICE constant).
 */
export async function getMonthlyPriceString(): Promise<string | null> {
  if (!configured) return null;
  if (cachedPriceString) return cachedPriceString;
  const pkg = await getMonthlyPackage();
  cachedPriceString = pkg?.product.priceString ?? null;
  return cachedPriceString;
}

/** Direct purchase of the monthly package (used if no remote paywall). */
export async function purchaseMonthly(): Promise<PurchaseOutcome> {
  if (!configured) {
    return {
      customerInfo: null,
      cancelled: false,
      errorMessage: "Purchases are not available on this platform.",
    };
  }
  const pkg = await getMonthlyPackage();
  if (!pkg) {
    return {
      customerInfo: null,
      cancelled: false,
      errorMessage: "No subscription products are available right now.",
    };
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { customerInfo, cancelled: false };
  } catch (err) {
    const e = err as PurchasesError & { userCancelled?: boolean };
    if (
      e.userCancelled ||
      e.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
    ) {
      return { customerInfo: null, cancelled: true };
    }
    console.warn("[purchases] purchase failed:", e);
    return {
      customerInfo: null,
      cancelled: false,
      errorMessage: e.message || "Purchase failed. Please try again.",
    };
  }
}

export async function restorePurchases(): Promise<PurchaseOutcome> {
  if (!configured) {
    return {
      customerInfo: null,
      cancelled: false,
      errorMessage: "Purchases are not available on this platform.",
    };
  }
  try {
    const customerInfo = await Purchases.restorePurchases();
    return { customerInfo, cancelled: false };
  } catch (err) {
    const e = err as PurchasesError;
    console.warn("[purchases] restore failed:", e);
    return {
      customerInfo: null,
      cancelled: false,
      errorMessage: e.message || "Restore failed. Please try again.",
    };
  }
}

// ─── RevenueCat Paywall ──────────────────────

export type PaywallOutcome =
  | "purchased"
  | "restored"
  | "cancelled"
  /** Paywall couldn't be shown (no template configured, error, or platform
   *  unsupported) — callers can fall back to purchaseMonthly(). */
  | "unavailable";

/** Presents the remote paywall configured in the RevenueCat dashboard. */
export async function presentPaywall(): Promise<PaywallOutcome> {
  if (!configured) return "unavailable";
  try {
    const result = await RevenueCatUI.presentPaywall({
      displayCloseButton: true,
    });
    switch (result) {
      case PAYWALL_RESULT.PURCHASED:
        return "purchased";
      case PAYWALL_RESULT.RESTORED:
        return "restored";
      case PAYWALL_RESULT.CANCELLED:
        return "cancelled";
      default: // ERROR or NOT_PRESENTED
        return "unavailable";
    }
  } catch (err) {
    console.warn("[purchases] presentPaywall failed:", err);
    return "unavailable";
  }
}

/**
 * Only shows the paywall when "Little World Premium" is not already active.
 * Resolves true when the user has the entitlement afterwards.
 */
export async function presentPaywallIfNeeded(): Promise<boolean> {
  if (!configured) return false;
  try {
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: CONFIG.REVENUECAT.ENTITLEMENT_ID,
      displayCloseButton: true,
    });
    return (
      result === PAYWALL_RESULT.PURCHASED ||
      result === PAYWALL_RESULT.RESTORED ||
      result === PAYWALL_RESULT.NOT_PRESENTED // already premium
    );
  } catch (err) {
    console.warn("[purchases] presentPaywallIfNeeded failed:", err);
    return false;
  }
}

// ─── Customer Center ─────────────────────────

/**
 * RevenueCat Customer Center: self-service subscription management
 * (cancel, refunds, plan changes). Resolves true if it was shown.
 */
export async function presentCustomerCenter(): Promise<boolean> {
  if (!configured) return false;
  try {
    await RevenueCatUI.presentCustomerCenter();
    return true;
  } catch (err) {
    console.warn("[purchases] presentCustomerCenter failed:", err);
    return false;
  }
}
