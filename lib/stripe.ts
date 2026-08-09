import Stripe from 'stripe'
import { supabaseServer } from '@/lib/supabaseServer'

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

  // Prefer host header on Vercel/production so checkout returns to the live site
  const host =
    request?.headers.get('x-forwarded-host') || request?.headers.get('host')
  const proto = request?.headers.get('x-forwarded-proto') || 'https'
  if (host && !host.includes('localhost')) {
    return `${proto}://${host}`.replace(/\/$/, '')
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

function isMissingCustomerError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as { code?: string; message?: string }
  return (
    err.code === 'resource_missing' ||
    /no such customer/i.test(err.message || '') ||
    /no such customer/i.test(String(error))
  )
}

/**
 * Resolve a Stripe customer for the signed-in user.
 * If a stored customer ID is from the wrong mode (test vs live) or deleted,
 * create a new one so checkout does not fail with "No such customer".
 */
export async function getOrCreateStripeCustomer(params: {
  userId: string
  email?: string | null
}): Promise<string> {
  const stripe = getStripe()

  if (!supabaseServer) {
    const customer = await stripe.customers.create({
      email: params.email || undefined,
      metadata: { userId: params.userId },
    })
    return customer.id
  }

  const { data: existingSub } = await supabaseServer
    .from('subscriptions')
    .select('id, stripe_customer_id')
    .eq('user_id', params.userId)
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const storedCustomerId = existingSub?.stripe_customer_id as string | undefined

  if (storedCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(storedCustomerId)
      if (!('deleted' in existing && existing.deleted)) {
        return existing.id
      }
    } catch (error) {
      if (!isMissingCustomerError(error)) {
        throw error
      }
      console.warn(
        `Stripe customer ${storedCustomerId} missing in current mode — creating a new one for user ${params.userId}`
      )
    }
  }

  const customer = await stripe.customers.create({
    email: params.email || undefined,
    metadata: { userId: params.userId },
  })

  if (existingSub?.id) {
    await supabaseServer
      .from('subscriptions')
      .update({
        stripe_customer_id: customer.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSub.id)
  } else {
    // Keep a lightweight row so later checkouts/portal can reuse this customer
    const { error: insertError } = await supabaseServer.from('subscriptions').insert({
      user_id: params.userId,
      tier: 'free',
      status: 'inactive',
      stripe_customer_id: customer.id,
      updated_at: new Date().toISOString(),
    })

    if (insertError) {
      // Non-fatal — checkout can still proceed with the new customer id
      console.warn('Failed to persist Stripe customer id:', insertError.message)
    }
  }

  return customer.id
}
