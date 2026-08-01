export const MOVIE_PURCHASE_PRICE = 4.25
export const EPISODE_PURCHASE_PRICE = 1.35

export const SUBSCRIPTION_FREE_ACCESS_TIERS = new Set(['standard', 'family'])

export type PurchaseType = 'movie' | 'episode'

export function getPurchasePrice(purchaseType: PurchaseType): number {
  return purchaseType === 'movie' ? MOVIE_PURCHASE_PRICE : EPISODE_PURCHASE_PRICE
}

export function formatUsd(amount: number): string {
  return amount % 1 === 0 ? `$${amount.toFixed(0)}` : `$${amount.toFixed(2)}`
}

export function isEpisodeContent(contentType?: string | null, parentId?: string | null): boolean {
  return contentType === 'episode' || Boolean(parentId)
}
