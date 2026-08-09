import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/get-authenticated-user'
import { getSiteUrl, getOrCreateStripeCustomer, getStripe, isStripeConfigured } from '@/lib/stripe'
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

    const customerId = await getOrCreateStripeCustomer({
      userId: user.id,
      email: user.email,
    })

    const stripe = getStripe()

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getSiteUrl(request)}/manage-subscription`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Portal session failed'
    console.error('Stripe portal error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
