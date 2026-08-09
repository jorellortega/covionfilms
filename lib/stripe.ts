import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2026-07-29.dahlia',
      typescript: true,
    })
  }

  return stripeClient
}

export function getSiteUrl(request?: Request): string {
  // Local next dev should always return to localhost, even if SITE_URL points at production
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }

  const origin = request?.headers.get('origin')
  if (origin?.startsWith('http')) {
    return origin.replace(/\/$/, '')
  }

  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}
