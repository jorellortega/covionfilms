import type Stripe from 'stripe'
import { getPurchasePrice, type PurchaseType } from '@/lib/content-pricing'
import { getStripe } from '@/lib/stripe'
import { supabaseServer } from '@/lib/supabaseServer'

export async function recordPaidContentPurchase(params: {
  userId: string
  videoId: string
  purchaseType: PurchaseType
  amount: number
  checkoutSessionId?: string | null
  paymentIntentId?: string | null
}) {
  if (!supabaseServer) {
    throw new Error('Supabase server client not configured')
  }

  const {
    userId,
    videoId,
    purchaseType,
    amount,
    checkoutSessionId,
    paymentIntentId,
  } = params

  if (checkoutSessionId) {
    const { data: existingBySession } = await supabaseServer
      .from('content_purchases')
      .select('id')
      .eq('stripe_checkout_session_id', checkoutSessionId)
      .maybeSingle()

    if (existingBySession?.id) {
      return { alreadyRecorded: true }
    }
  }

  const { error } = await supabaseServer.from('content_purchases').insert({
    user_id: userId,
    video_id: videoId,
    purchase_type: purchaseType,
    amount,
    stripe_checkout_session_id: checkoutSessionId || null,
    stripe_payment_intent_id: paymentIntentId || null,
  })

  if (error) {
    if (error.code === '23505') {
      return { alreadyRecorded: true }
    }
    throw error
  }

  return { alreadyRecorded: false }
}

export async function applyContentPurchaseCheckoutSession(
  session: Stripe.Checkout.Session,
  expectedUserId?: string
) {
  if (session.mode !== 'payment') {
    throw new Error('Not a one-time payment checkout session')
  }

  if (session.metadata?.type !== 'content_purchase') {
    throw new Error('Checkout session is not a content purchase')
  }

  const userId = session.metadata?.userId || session.client_reference_id
  const videoId = session.metadata?.targetVideoId
  const purchaseType = session.metadata?.purchaseType as PurchaseType
  const amountCents = session.amount_total

  if (!userId || !videoId || (purchaseType !== 'movie' && purchaseType !== 'episode')) {
    throw new Error('Checkout session missing purchase metadata')
  }

  if (expectedUserId && userId !== expectedUserId) {
    throw new Error('This checkout session belongs to a different account')
  }

  if (session.payment_status !== 'paid') {
    throw new Error('Payment is not complete yet')
  }

  const amount =
    typeof amountCents === 'number'
      ? amountCents / 100
      : getPurchasePrice(purchaseType)

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || null

  await recordPaidContentPurchase({
    userId,
    videoId,
    purchaseType,
    amount,
    checkoutSessionId: session.id,
    paymentIntentId,
  })

  return {
    videoId,
    purchaseType,
    amount,
    watchVideoId: session.metadata?.watchVideoId || videoId,
  }
}

export async function syncContentPurchaseSession(sessionId: string, userId: string) {
  const stripe = getStripe()
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  return applyContentPurchaseCheckoutSession(session, userId)
}
