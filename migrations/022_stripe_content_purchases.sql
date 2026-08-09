-- Stripe fields for one-time content purchases

ALTER TABLE content_purchases
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_purchases_stripe_session
ON content_purchases(stripe_checkout_session_id)
WHERE stripe_checkout_session_id IS NOT NULL;

COMMENT ON COLUMN content_purchases.stripe_checkout_session_id IS 'Stripe Checkout Session ID (cs_...)';
COMMENT ON COLUMN content_purchases.stripe_payment_intent_id IS 'Stripe PaymentIntent ID (pi_...)';
