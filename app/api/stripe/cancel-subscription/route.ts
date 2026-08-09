import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/get-authenticated-user'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { getSubscriptionPeriodEnd, upsertSubscriptionFromStripe } from '@/lib/stripe-subscriptions'
import { supabaseServer } from '@/lib/supabaseServer'

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

    const body = await request.json().catch(() => ({}))
    const immediately = Boolean(body.immediately)

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
        { error: 'No active Stripe subscription to cancel.' },
        { status: 404 }
      )
    }

    const stripe = getStripe()

    if (immediately) {
      const canceled = await stripe.subscriptions.cancel(existing.stripe_subscription_id)
      await supabaseServer
        .from('subscriptions')
        .update({
          status: 'inactive',
          auto_renew: false,
          tier: 'free',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', canceled.id)

      return NextResponse.json({
        success: true,
        canceledImmediately: true,
        tier: 'free',
      })
    }

    const updated = await stripe.subscriptions.update(existing.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    const customerId =
      typeof updated.customer === 'string' ? updated.customer : updated.customer.id

    await upsertSubscriptionFromStripe({
      userId: user.id,
      tier: existing.tier || 'standard',
      billingPeriod: existing.billing_period,
      customerId,
      subscriptionId: updated.id,
      status: updated.status,
      currentPeriodEnd: getSubscriptionPeriodEnd(updated),
    })

    await supabaseServer
      .from('subscriptions')
      .update({
        auto_renew: false,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', updated.id)

    return NextResponse.json({
      success: true,
      cancelAtPeriodEnd: true,
      tier: existing.tier,
      expiryDate: getSubscriptionPeriodEnd(updated)
        ? new Date(getSubscriptionPeriodEnd(updated)! * 1000).toISOString()
        : null,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to cancel subscription'
    console.error('cancel-subscription error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
