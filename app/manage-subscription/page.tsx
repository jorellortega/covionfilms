"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CreditCard, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"
import {
  ANNUAL_DISCOUNT,
  SUBSCRIPTION_PLANS,
  formatUsd,
  getAnnualPrice,
  getSubscriptionPlan,
  type BillingPeriod,
} from "@/lib/content-pricing"
import { cn } from "@/lib/utils"

type SubRecord = {
  tier: string
  status: string
  billing_period?: string | null
  expiry_date?: string | null
  auto_renew?: boolean | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
}

function formatPrice(amount: number) {
  return amount % 1 === 0 ? `$${amount.toFixed(0)}` : `$${amount.toFixed(2)}`
}

async function authHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) return null
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  }
}

export default function ManageSubscriptionPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [sub, setSub] = useState<SubRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<"free" | "standard" | "family">("standard")
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly")
  const [saving, setSaving] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [confirmChangeOpen, setConfirmChangeOpen] = useState(false)
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)

  const reloadSub = async (userId: string) => {
    const { data } = await supabase
      .from("subscriptions")
      .select(
        "tier, status, billing_period, expiry_date, auto_renew, stripe_customer_id, stripe_subscription_id"
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const record =
      data ||
      ({
        tier: "free",
        status: "active",
        billing_period: null,
        expiry_date: null,
        auto_renew: false,
        stripe_customer_id: null,
        stripe_subscription_id: null,
      } satisfies SubRecord)

    setSub(record)

    if (record.tier === "family" || record.tier === "standard" || record.tier === "free") {
      setSelectedPlan(record.tier)
    } else if (record.tier === "premium") {
      setSelectedPlan("standard")
    }
    if (record.billing_period === "annual" || record.billing_period === "monthly") {
      setBillingPeriod(record.billing_period)
    }
  }

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.replace("/login?redirect=/manage-subscription")
      return
    }

    const load = async () => {
      setLoading(true)
      await reloadSub(user.id)
      setLoading(false)
    }

    void load()
  }, [user, authLoading, router])

  const openBillingPortal = async () => {
    setPortalLoading(true)
    try {
      const headers = await authHeaders()
      if (!headers) {
        router.push("/login?redirect=/manage-subscription")
        return
      }

      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not open billing portal")
      window.location.href = data.url
    } catch (error: unknown) {
      toast({
        title: "Billing portal unavailable",
        description: error instanceof Error ? error.message : "Try again later",
        variant: "destructive",
      })
      setPortalLoading(false)
    }
  }

  const savePlanChange = async () => {
    if (!user) return
    setSaving(true)
    setConfirmChangeOpen(false)
    try {
      const headers = await authHeaders()
      if (!headers) {
        router.push("/login?redirect=/manage-subscription")
        return
      }

      // Downgrade to Free = cancel at period end
      if (selectedPlan === "free") {
        const response = await fetch("/api/stripe/cancel-subscription", {
          method: "POST",
          headers,
          body: JSON.stringify({ immediately: false }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Could not switch to Free")

        toast({
          title: "Switching to Free",
          description: data.expiryDate
            ? `Paid access continues until ${new Date(data.expiryDate).toLocaleDateString()}, then you'll be on Free.`
            : "Your paid plan will end after the current billing period.",
        })
        await reloadSub(user.id)
        return
      }

      const response = await fetch("/api/stripe/change-plan", {
        method: "POST",
        headers,
        body: JSON.stringify({ planId: selectedPlan, billingPeriod }),
      })
      const data = await response.json()

      if (response.status === 404 && data.needsCheckout) {
        toast({
          title: "Subscribe first",
          description: "Start a paid plan, then you can change it here.",
        })
        router.push("/subscribe")
        return
      }

      if (!response.ok) {
        throw new Error(data.error || "Could not update plan")
      }

      if (data.unchanged) {
        toast({ title: "No change", description: "You're already on this plan." })
      } else {
        toast({
          title: "Plan updated",
          description: `Switched to ${selectedPlan} (${billingPeriod}).`,
        })
      }

      await reloadSub(user.id)
    } catch (error: unknown) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Try again",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const nextPlan = getSubscriptionPlan(selectedPlan)
  const nextPrice =
    nextPlan && nextPlan.monthlyPrice > 0
      ? billingPeriod === "annual"
        ? getAnnualPrice(nextPlan.monthlyPrice)
        : nextPlan.monthlyPrice
      : 0
  const nextPriceLabel =
    selectedPlan === "free"
      ? "$0/month"
      : billingPeriod === "annual"
        ? `${formatPrice(nextPrice)}/year`
        : `${formatPrice(nextPrice)}/month`

  const cancelSubscription = async () => {
    if (!user) return

    setCanceling(true)
    setConfirmCancelOpen(false)
    try {
      const headers = await authHeaders()
      if (!headers) {
        router.push("/login?redirect=/manage-subscription")
        return
      }

      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers,
        body: JSON.stringify({ immediately: false }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Cancel failed")

      toast({
        title: "Cancellation scheduled",
        description: data.expiryDate
          ? `Access continues until ${new Date(data.expiryDate).toLocaleDateString()}.`
          : "Your plan will end after the current period.",
      })
      await reloadSub(user.id)
    } catch (error: unknown) {
      toast({
        title: "Cancel failed",
        description: error instanceof Error ? error.message : "Try again",
        variant: "destructive",
      })
    } finally {
      setCanceling(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) return null

  const tier = (sub?.tier || user.subscription || "free").toLowerCase()
  const currentPlan = getSubscriptionPlan(tier === "premium" ? "standard" : tier)
  const planName = currentPlan?.name || tier.charAt(0).toUpperCase() + tier.slice(1)
  const isPaid = tier === "standard" || tier === "family" || tier === "premium"
  const hasStripeSub = Boolean(sub?.stripe_subscription_id)
  const periodLabel =
    sub?.billing_period === "annual"
      ? "Annual"
      : sub?.billing_period === "monthly"
        ? "Monthly"
        : null

  const dirty =
    isPaid &&
    (selectedPlan !== (tier === "family" ? "family" : tier === "free" ? "free" : "standard") ||
      (selectedPlan !== "free" &&
        billingPeriod !== (sub?.billing_period === "annual" ? "annual" : "monthly")))

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center">Manage Subscription</h1>
      <p className="text-center text-muted-foreground mb-8">
        Change your plan or cancel — right here.
      </p>

      <Card className="mb-8 border-primary/30">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-xl">Current plan</CardTitle>
            <Badge className="capitalize bg-gradient-to-r from-blue-600 to-purple-600">
              {planName}
            </Badge>
          </div>
          <CardDescription>
            {currentPlan?.description || "Your COVION membership tier."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Status</span>
            <span className="capitalize font-medium">{sub?.status || "active"}</span>
          </div>
          {periodLabel && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Billing</span>
              <span className="font-medium">{periodLabel}</span>
            </div>
          )}
          {sub?.auto_renew === false && isPaid && (
            <p className="text-amber-400 text-sm">
              Cancellation scheduled
              {sub.expiry_date
                ? ` — access through ${new Date(sub.expiry_date).toLocaleDateString()}`
                : "."}
            </p>
          )}
          {sub?.expiry_date && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">
                {sub.auto_renew === false ? "Access through" : "Next bill / renews"}
              </span>
              <span className="font-medium">
                {new Date(sub.expiry_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {!isPaid && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Upgrade</CardTitle>
            <CardDescription>
              You&apos;re on Free. Pick Standard or Family to unlock everything.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/subscribe">View plans & subscribe</Link>
            </Button>
          </CardFooter>
        </Card>
      )}

      {isPaid && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Change plan</CardTitle>
            <CardDescription>
              Switch between Free, Standard, and Family. Paid plan changes apply immediately with
              proration. Choosing Free cancels renewal at period end.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedPlan !== "free" && (
              <div className="flex justify-center">
                <div className="inline-flex rounded-lg border border-gray-700 p-1 bg-card">
                  <button
                    type="button"
                    onClick={() => setBillingPeriod("monthly")}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      billingPeriod === "monthly"
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:text-white"
                    )}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingPeriod("annual")}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      billingPeriod === "annual"
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:text-white"
                    )}
                  >
                    Annual <span className="text-xs opacity-80">(Save 10%)</span>
                  </button>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const annual = getAnnualPrice(plan.monthlyPrice)
                const priceLabel =
                  plan.monthlyPrice === 0
                    ? "$0/mo"
                    : billingPeriod === "monthly"
                      ? `${formatPrice(plan.monthlyPrice)}/mo`
                      : `${formatPrice(annual)}/yr`
                const selected = selectedPlan === plan.id

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() =>
                      setSelectedPlan(plan.id as "free" | "standard" | "family")
                    }
                    className={cn(
                      "text-left rounded-lg border p-4 transition-all",
                      selected
                        ? "border-primary ring-2 ring-primary/40 bg-primary/5"
                        : "border-gray-700 hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold">{plan.name}</span>
                      <span className="text-sm text-primary">{priceLabel}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                    {plan.monthlyPrice > 0 && billingPeriod === "annual" && (
                      <p className="text-xs text-green-500 mt-2">
                        Save {formatPrice(plan.monthlyPrice * 12 * ANNUAL_DISCOUNT)}/year
                      </p>
                    )}
                    {plan.id === "free" && (
                      <p className="text-xs text-amber-400 mt-2">
                        Ends paid billing after current period
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-3">
            <Button
              onClick={() => setConfirmChangeOpen(true)}
              disabled={saving || !dirty || !hasStripeSub}
            >
              {saving ? "Updating…" : "Save plan changes"}
            </Button>
            {!hasStripeSub && (
              <p className="text-sm text-muted-foreground w-full">
                This account isn&apos;t linked to Stripe billing yet.{" "}
                <Link href="/subscribe" className="text-primary underline">
                  Subscribe again
                </Link>{" "}
                to enable plan changes.
              </p>
            )}
            {hasStripeSub && !dirty && (
              <p className="text-sm text-muted-foreground">Select a different plan or period to update.</p>
            )}
          </CardFooter>
        </Card>
      )}

      {isPaid && (
        <Card className="mb-8 border-red-500/30">
          <CardHeader>
            <CardTitle className="text-lg text-red-400">Cancel subscription</CardTitle>
            <CardDescription>
              Stops auto-renew. You keep access until the end of the current billing period.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="destructive"
              onClick={() => setConfirmCancelOpen(true)}
              disabled={canceling || !hasStripeSub || sub?.auto_renew === false}
            >
              {canceling
                ? "Canceling…"
                : sub?.auto_renew === false
                  ? "Cancellation already scheduled"
                  : "Cancel at period end"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {isPaid && hasStripeSub && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment method & invoices
            </CardTitle>
            <CardDescription>
              Update your card or download invoices (Stripe secure billing page).
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={openBillingPortal} disabled={portalLoading}>
              {portalLoading ? "Opening…" : "Update payment method"}
            </Button>
          </CardFooter>
        </Card>
      )}

      <AlertDialog open={confirmChangeOpen} onOpenChange={setConfirmChangeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedPlan === "free" ? "Switch to Free?" : "Confirm plan change?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                {selectedPlan === "free" ? (
                  <>
                    <p>
                      You&apos;ll move to the <strong className="text-foreground">Free</strong> plan
                      after your current billing period ends
                      {sub?.expiry_date
                        ? ` (${new Date(sub.expiry_date).toLocaleDateString()})`
                        : ""}
                      .
                    </p>
                    <p>
                      Keep paid access until then. After that, per-title charges apply for movies and
                      episodes.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      Switch to <strong className="text-foreground">{nextPlan?.name}</strong> (
                      {billingPeriod}) at{" "}
                      <strong className="text-foreground">{nextPriceLabel}</strong>.
                    </p>
                    <p>
                      Stripe will charge or credit the prorated difference on your card right away for
                      the rest of this billing period. Upgrades usually charge more; downgrades usually
                      add credit.
                    </p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Go back</AlertDialogCancel>
            <AlertDialogAction onClick={() => void savePlanChange()} disabled={saving}>
              {saving
                ? "Updating…"
                : selectedPlan === "free"
                  ? "Yes, switch to Free"
                  : "Yes, change my plan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your plan will stay active until the end of the current billing period
              {sub?.expiry_date
                ? ` (${new Date(sub.expiry_date).toLocaleDateString()})`
                : ""}
              , then it won&apos;t renew. You won&apos;t be charged again after that.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={canceling}>Keep my plan</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void cancelSubscription()}
              disabled={canceling}
            >
              {canceling ? "Canceling…" : "Yes, cancel at period end"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
