import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { supabaseServer } from '@/lib/supabaseServer'

function mapStripeStatus(status: Stripe.Subscription.Status): 'active' | 'inactive' | 'suspended' {
  if (status === 'active' || status === 'trialing') return 'active'
  if (status === 'past_due' || status === 'unpaid') return 'suspended'
  return 'inactive'
}

export function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): number | null {
  const fromItem = subscription.items?.data?.[0]?.current_period_end
  if (typeof fromItem === 'number') return fromItem
  const legacy = (subscription as Stripe.Subscription & { current_period_end?: number })
    .current_period_end
  return typeof legacy === 'number' ? legacy : null
}

export async function upsertSubscriptionFromStripe(params: {
  userId: string
  tier: string
  billingPeriod?: string | null
  customerId: string
  subscriptionId: string
  status: Stripe.Subscription.Status
  currentPeriodEnd?: number | null
}) {
  if (!supabaseServer) {
    throw new Error('Supabase server client not configured')
  }

  const { userId, tier, billingPeriod, customerId, subscriptionId, status, currentPeriodEnd } =
    params

  const dbStatus = mapStripeStatus(status)
  const expiryDate = currentPeriodEnd
    ? new Date(currentPeriodEnd * 1000).toISOString()
    : null

  if (dbStatus === 'active') {
    await supabaseServer
      .from('subscriptions')
      .update({ status: 'inactive', auto_renew: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'active')
      .neq('stripe_subscription_id', subscriptionId)
  }

  const { data: existing } = await supabaseServer
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle()

  const payload = {
    user_id: userId,
    tier,
    status: dbStatus,
    billing_period: billingPeriod || null,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    expiry_date: expiryDate,
    auto_renew: dbStatus === 'active',
    updated_at: new Date().toISOString(),
  }

  if (existing?.id) {
    const { error } = await supabaseServer
      .from('subscriptions')
      .update(payload)
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabaseServer.from('subscriptions').insert({
      ...payload,
      start_date: new Date().toISOString(),
    })
    if (error) throw error
  }

  return { tier, status: dbStatus, expiryDate }
}

export async function applyCheckoutSessionToUser(
  session: Stripe.Checkout.Session,
  expectedUserId?: string
) {
  if (session.mode !== 'subscription') {
    throw new Error('Not a subscription checkout session')
  }

  const userId = session.metadata?.userId || session.client_reference_id
  const tier = session.metadata?.tier
  const billingPeriod = session.metadata?.billingPeriod
  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id

  if (!userId || !tier || !customerId || !subscriptionId) {
    throw new Error('Checkout session is missing subscription details')
  }

  if (expectedUserId && userId !== expectedUserId) {
    throw new Error('This checkout session belongs to a different account')
  }

  if (session.payment_status !== 'paid' && session.status !== 'complete') {
    throw new Error('Checkout is not complete yet')
  }

  const stripe = getStripe()
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  return upsertSubscriptionFromStripe({
    userId,
    tier,
    billingPeriod,
    customerId,
    subscriptionId,
    status: subscription.status,
    currentPeriodEnd: getSubscriptionPeriodEnd(subscription),
  })
}
