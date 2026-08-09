import { NextRequest, NextResponse } from 'next/server'
import {
  getStripeUnitAmount,
  getSubscriptionPlan,
  type BillingPeriod,
} from '@/lib/content-pricing'
import { getAuthenticatedUser } from '@/lib/get-authenticated-user'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { getSubscriptionPeriodEnd, upsertSubscriptionFromStripe } from '@/lib/stripe-subscriptions'
import { supabaseServer } from '@/lib/supabaseServer'

const PAID_PLANS = new Set(['standard', 'family'])

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
    }

    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Please log in' }, { status: 401 })
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const body = await request.json()
    const planId = typeof body.planId === 'string' ? body.planId.trim() : ''
    const billingPeriod = body.billingPeriod as BillingPeriod

    if (!PAID_PLANS.has(planId)) {
      return NextResponse.json({ error: 'Choose Standard or Family' }, { status: 400 })
    }

    if (billingPeriod !== 'monthly' && billingPeriod !== 'annual') {
      return NextResponse.json({ error: 'billingPeriod must be monthly or annual' }, { status: 400 })
    }

    const plan = getSubscriptionPlan(planId)
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 400 })
    }

    const { data: existing } = await supabaseServer
      .from('subscriptions')
      .select('stripe_subscription_id, stripe_customer_id, tier, billing_period')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .not('stripe_subscription_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!existing?.stripe_subscription_id) {
      return NextResponse.json(
        {
          error: 'No active Stripe subscription found. Subscribe from the plans page first.',
          needsCheckout: true,
        },
        { status: 404 }
      )
    }

    if (existing.tier === planId && existing.billing_period === billingPeriod) {
      return NextResponse.json({ success: true, message: 'Already on this plan', unchanged: true })
    }

    const stripe = getStripe()
    const subscription = await stripe.subscriptions.retrieve(existing.stripe_subscription_id)
    const itemId = subscription.items.data[0]?.id

    if (!itemId) {
      return NextResponse.json({ error: 'Subscription has no billable item' }, { status: 400 })
    }

    const unitAmount = getStripeUnitAmount(planId as 'standard' | 'family', billingPeriod)
    const interval = billingPeriod === 'annual' ? 'year' : 'month'

    const price = await stripe.prices.create({
      currency: 'usd',
      unit_amount: unitAmount,
      recurring: { interval },
      product_data: {
        name: `${plan.name} Plan`,
        metadata: { tier: planId, billingPeriod },
      },
      metadata: { tier: planId, billingPeriod },
    })

    const updated = await stripe.subscriptions.update(existing.stripe_subscription_id, {
      items: [{ id: itemId, price: price.id }],
      proration_behavior: 'create_prorations',
      cancel_at_period_end: false,
      metadata: {
        userId: user.id,
        tier: planId,
        billingPeriod,
      },
    })

    const customerId =
      typeof updated.customer === 'string' ? updated.customer : updated.customer.id

    const result = await upsertSubscriptionFromStripe({
      userId: user.id,
      tier: planId,
      billingPeriod,
      customerId,
      subscriptionId: updated.id,
      status: updated.status,
      currentPeriodEnd: getSubscriptionPeriodEnd(updated),
    })

    return NextResponse.json({
      success: true,
      tier: result.tier,
      status: result.status,
      billingPeriod,
      expiryDate: result.expiryDate,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to change plan'
    console.error('change-plan error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
