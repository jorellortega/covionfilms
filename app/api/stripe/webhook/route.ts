import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import {
  applyCheckoutSessionToUser,
  getSubscriptionPeriodEnd,
  upsertSubscriptionFromStripe,
} from '@/lib/stripe-subscriptions'
import { applyContentPurchaseCheckoutSession } from '@/lib/stripe-purchases'
import { supabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode === 'subscription') {
    await applyCheckoutSessionToUser(session)
    return
  }

  if (session.mode === 'payment' && session.metadata?.type === 'content_purchase') {
    await applyContentPurchaseCheckoutSession(session)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  const tier = subscription.metadata?.tier || 'standard'
  const billingPeriod = subscription.metadata?.billingPeriod
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id

  if (!userId) {
    if (!supabaseServer) return
    const { data } = await supabaseServer
      .from('subscriptions')
      .select('user_id, tier, billing_period')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle()

    if (!data?.user_id) {
      console.error('No user found for Stripe subscription', subscription.id)
      return
    }

    await upsertSubscriptionFromStripe({
      userId: data.user_id,
      tier: data.tier || tier,
      billingPeriod: data.billing_period || billingPeriod,
      customerId,
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: getSubscriptionPeriodEnd(subscription),
    })
    return
  }

  await upsertSubscriptionFromStripe({
    userId,
    tier,
    billingPeriod,
    customerId,
    subscriptionId: subscription.id,
    status: subscription.status,
    currentPeriodEnd: getSubscriptionPeriodEnd(subscription),
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  if (!supabaseServer) return

  const { error } = await supabaseServer
    .from('subscriptions')
    .update({
      status: 'inactive',
      auto_renew: false,
      tier: 'free',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Failed to deactivate subscription', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET is not set' }, { status: 503 })
    }

    const stripe = getStripe()
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid signature'
      console.error('Webhook signature verification failed:', message)
      return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook handler failed'
    console.error('Stripe webhook error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
