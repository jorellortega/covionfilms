export const MOVIE_PURCHASE_PRICE = 4.25
export const EPISODE_PURCHASE_PRICE = 1.35

export const SUBSCRIPTION_FREE_ACCESS_TIERS = new Set(['standard', 'family'])

export const ANNUAL_DISCOUNT = 0.1

export type PurchaseType = 'movie' | 'episode'
export type SubscriptionTier = 'free' | 'standard' | 'family'
export type BillingPeriod = 'monthly' | 'annual'

export type SubscriptionPlan = {
  id: 'free' | 'standard' | 'family'
  name: string
  monthlyPrice: number
  description: string
  features: string[]
}

/** Paid plans offered on /subscribe (Free is handled without Stripe). */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    description: 'Limited access to free content',
    features: ['Access to free movies', 'Ad-supported viewing', 'Slower streaming speed'],
  },
  {
    id: 'standard',
    name: 'Standard',
    monthlyPrice: 7.5,
    description: 'Full access to all movies',
    features: ['Unlimited access to all movies', 'Ad-free viewing', 'Full streaming speed'],
  },
  {
    id: 'family',
    name: 'Family',
    monthlyPrice: 12,
    description: 'Access for the whole family',
    features: ['Up to 5 user profiles', 'Parental controls', 'Shared watchlist', 'Full access to all content'],
  },
]

export function getSubscriptionPlan(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId)
}

export function getAnnualPrice(monthlyPrice: number): number {
  return monthlyPrice * 12 * (1 - ANNUAL_DISCOUNT)
}

/** Stripe unit amount in cents for a paid plan + billing period. */
export function getStripeUnitAmount(planId: 'standard' | 'family', period: BillingPeriod): number {
  const plan = getSubscriptionPlan(planId)
  if (!plan || plan.monthlyPrice <= 0) {
    throw new Error(`Invalid paid plan: ${planId}`)
  }
  const dollars = period === 'monthly' ? plan.monthlyPrice : getAnnualPrice(plan.monthlyPrice)
  return Math.round(dollars * 100)
}

export function getPurchasePrice(purchaseType: PurchaseType): number {
  return purchaseType === 'movie' ? MOVIE_PURCHASE_PRICE : EPISODE_PURCHASE_PRICE
}

export function formatUsd(amount: number): string {
  return amount % 1 === 0 ? `$${amount.toFixed(0)}` : `$${amount.toFixed(2)}`
}

export function isEpisodeContent(contentType?: string | null, parentId?: string | null): boolean {
  return contentType === 'episode' || Boolean(parentId)
}
