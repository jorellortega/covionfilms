import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/get-authenticated-user'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { applyCheckoutSessionToUser } from '@/lib/stripe-subscriptions'

/** Fallback when webhooks aren't running locally: sync after redirect from Checkout. */
export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
    }

    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Please log in to activate your subscription' }, { status: 401 })
    }

    const body = await request.json()
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : ''

    if (!sessionId.startsWith('cs_')) {
      return NextResponse.json({ error: 'Invalid checkout session id' }, { status: 400 })
    }

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const result = await applyCheckoutSessionToUser(session, user.id)

    return NextResponse.json({
      success: true,
      tier: result.tier,
      status: result.status,
      expiryDate: result.expiryDate,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sync subscription'
    console.error('Stripe sync-checkout error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
