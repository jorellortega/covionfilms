-- Stripe fields for subscription billing

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS billing_period TEXT CHECK (billing_period IN ('monthly', 'annual'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id
ON subscriptions(stripe_subscription_id)
WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id
ON subscriptions(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

COMMENT ON COLUMN subscriptions.stripe_customer_id IS 'Stripe Customer ID (cus_...)';
COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'Stripe Subscription ID (sub_...)';
COMMENT ON COLUMN subscriptions.billing_period IS 'monthly or annual billing interval';
