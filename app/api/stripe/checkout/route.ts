import { NextRequest, NextResponse } from 'next/server'
import {
  getStripeUnitAmount,
  getSubscriptionPlan,
  type BillingPeriod,
} from '@/lib/content-pricing'
import { getAuthenticatedUser } from '@/lib/get-authenticated-user'
import { getSiteUrl, getStripe, isStripeConfigured } from '@/lib/stripe'
import { supabaseServer } from '@/lib/supabaseServer'

const PAID_PLANS = new Set(['standard', 'family'])

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to your environment.' },
        { status: 503 }
      )
    }

    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Please log in to subscribe' }, { status: 401 })
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const body = await request.json()
    const planId = typeof body.planId === 'string' ? body.planId.trim() : ''
    const billingPeriod = body.billingPeriod as BillingPeriod

    if (!PAID_PLANS.has(planId)) {
      return NextResponse.json({ error: 'Invalid plan. Choose Standard or Family.' }, { status: 400 })
    }

    if (billingPeriod !== 'monthly' && billingPeriod !== 'annual') {
      return NextResponse.json({ error: 'billingPeriod must be monthly or annual' }, { status: 400 })
    }

    const plan = getSubscriptionPlan(planId)
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 400 })
    }

    const stripe = getStripe()
    const siteUrl = getSiteUrl(request)
    const unitAmount = getStripeUnitAmount(planId as 'standard' | 'family', billingPeriod)
    const interval = billingPeriod === 'annual' ? 'year' : 'month'

    // Reuse existing Stripe customer if we have one
    const { data: existingSub } = await supabaseServer
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let customerId = existingSub?.stripe_customer_id as string | undefined

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      })
      customerId = customer.id
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: unitAmount,
            recurring: { interval },
            product_data: {
              name: `${plan.name} Plan`,
              description: `${plan.description} (${billingPeriod})`,
              metadata: {
                tier: planId,
                billingPeriod,
              },
            },
          },
        },
      ],
      metadata: {
        userId: user.id,
        tier: planId,
        billingPeriod,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          tier: planId,
          billingPeriod,
        },
      },
      success_url: `${siteUrl}/subscribe?success=1&plan=${planId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/subscribe?canceled=1`,
      allow_promotion_codes: true,
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Checkout failed'
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
