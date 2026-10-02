/**
 * pricing-plans.ts
 *
 * Central configuration for PDF Studio subscription and cloud storage plans.
 * Supports localized pricing for India (INR) and Global/US (USD).
 * All prices, durations, and limits are centrally configured here.
 */

export type PlanId = "free" | "pro_monthly" | "pro_annual";
export type BillingPeriod = "monthly" | "annual";
export type SupportedCurrency = "INR" | "USD";

export interface PlanPricing {
  currency: SupportedCurrency;
  symbol: string;
  amount: number;
  displayPrice: string;
  periodLabel: string;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  tagline: string;
  badge?: string;
  storageDays: number | "unlimited";
  maxDocuments: number | "unlimited";
  billingPeriod?: BillingPeriod;
  ctaText: string;
  pricing: Record<SupportedCurrency, PlanPricing>;
  features: string[];
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free Trial",
    tagline: "Try PDF Studio for free",
    storageDays: 7,
    maxDocuments: 1,
    ctaText: "Continue with Free",
    pricing: {
      INR: {
        currency: "INR",
        symbol: "₹",
        amount: 0,
        displayPrice: "₹0",
        periodLabel: "free",
      },
      USD: {
        currency: "USD",
        symbol: "$",
        amount: 0,
        displayPrice: "$0",
        periodLabel: "free",
      },
    },
    features: [
      "Save 1 document",
      "Cloud storage for 7 days",
      "Access your saved document while it is active",
      "Basic PDF editing",
      "Download PDF",
    ],
  },

  pro_monthly: {
    id: "pro_monthly",
    name: "Pro Monthly",
    tagline: "Flexible monthly document cloud access",
    badge: "Popular",
    storageDays: "unlimited",
    maxDocuments: "unlimited",
    billingPeriod: "monthly",
    ctaText: "Choose Pro Monthly",
    pricing: {
      INR: {
        currency: "INR",
        symbol: "₹",
        amount: 199,
        displayPrice: "₹199",
        periodLabel: "/ month",
      },
      USD: {
        currency: "USD",
        symbol: "$",
        amount: 2,
        displayPrice: "$2",
        periodLabel: "/ month",
      },
    },
    features: [
      "Save multiple documents",
      "Cloud document storage",
      "Access documents from your dashboard",
      "Continue editing saved documents",
      "Basic PDF editing",
      "Download documents",
    ],
  },

  pro_annual: {
    id: "pro_annual",
    name: "Pro Annual",
    tagline: "Best value with unlimited document storage",
    badge: "Save 58%",
    storageDays: "unlimited",
    maxDocuments: "unlimited",
    billingPeriod: "annual",
    ctaText: "Choose Pro Annual",
    pricing: {
      INR: {
        currency: "INR",
        symbol: "₹",
        amount: 999,
        displayPrice: "₹999",
        periodLabel: "/ year",
      },
      USD: {
        currency: "USD",
        symbol: "$",
        amount: 10,
        displayPrice: "$10",
        periodLabel: "/ year",
      },
    },
    features: [
      "Save multiple documents",
      "Long-term cloud storage",
      "Dashboard access",
      "Unlimited document saving",
      "Continue editing saved documents",
      "Basic PDF editing",
      "Download documents",
    ],
  },
};

/**
 * Detects the user's localized currency preference based on timezone/locale.
 * Defaults to USD if reliable Indian region signals are not present.
 */
export function detectUserCurrency(): SupportedCurrency {
  if (typeof window === "undefined") return "USD";

  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    // India standard timezone
    if (timeZone.toLowerCase().includes("kolkata") || timeZone.toLowerCase().includes("calcutta")) {
      return "INR";
    }

    // Check navigator languages
    const languages = navigator.languages || [navigator.language || ""];
    for (const lang of languages) {
      if (lang && (lang.toLowerCase().endsWith("-in") || lang.toLowerCase() === "en-in" || lang.toLowerCase() === "hi")) {
        return "INR";
      }
    }
  } catch {
    // Fall back to USD
  }

  return "USD";
}

/**
 * Helper to get a plan definition with localized price.
 */
export function getPlanWithPricing(planId: PlanId, currency: SupportedCurrency = "USD") {
  const plan = PLANS[planId];
  const pricing = plan.pricing[currency] || plan.pricing.USD;
  return {
    ...plan,
    pricing,
  };
}
