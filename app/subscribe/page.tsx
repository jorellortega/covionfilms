"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import {
  ANNUAL_DISCOUNT,
  EPISODE_PURCHASE_PRICE,
  MOVIE_PURCHASE_PRICE,
  SUBSCRIPTION_PLANS,
  formatUsd,
  getAnnualPrice,
  type BillingPeriod,
} from "@/lib/content-pricing"
import { cn } from "@/lib/utils"

function formatPrice(amount: number) {
  return amount % 1 === 0 ? `$${amount.toFixed(0)}` : `$${amount.toFixed(2)}`
}

export default function SubscribePage() {
  const { user, isLoading: authLoading } = useAuth()
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly")
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const isLoggedIn = Boolean(user)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const success = params.get("success") === "1"
    const canceled = params.get("canceled") === "1"
    const sessionId = params.get("session_id")
    const plan = params.get("plan") || "your"

    if (!success && !canceled) return

    const finish = async () => {
      if (canceled) {
        setStatusMessage("Checkout canceled. No charge was made.")
        window.history.replaceState({}, "", "/subscribe")
        return
      }

      if (sessionId?.startsWith("cs_")) {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.access_token) {
          setStatusMessage("Payment received. Log in to activate your plan.")
          window.history.replaceState({}, "", "/subscribe")
          return
        }

        try {
          const response = await fetch("/api/stripe/sync-checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ sessionId }),
          })
          const data = await response.json()
          if (!response.ok) {
            throw new Error(data.error || "Could not activate subscription")
          }
          setStatusMessage(`Subscription active — you're on the ${data.tier || plan} plan.`)
          toast({
            title: "Subscription active",
            description: `You're on the ${data.tier || plan} plan.`,
          })
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Activation failed"
          setStatusMessage(message)
        }
      } else {
        setStatusMessage(`Thanks! Your ${plan} plan is activating.`)
      }

      window.history.replaceState({}, "", "/subscribe")
    }

    void finish()
  }, [])

  const startCheckout = async (planId: string) => {
    if (planId === "free") {
      setStatusMessage("You're on the Free plan. Upgrade anytime for full access.")
      return
    }

    setLoadingPlan(planId)
    setStatusMessage(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        window.location.href = "/login?redirect=/subscribe"
        return
      }

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ planId, billingPeriod }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Could not start checkout")
      }

      if (!data.url) {
        throw new Error("No checkout URL returned")
      }

      window.location.href = data.url
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Checkout failed"
      setStatusMessage(message)
      setLoadingPlan(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-8 text-center">Choose Your Subscription</h1>
      <p className="text-center text-xs text-muted-foreground mb-4" data-build="SUBSCRIBE_BUILD_MARKER">Updated subscribe flow — use Log in / Create account first</p>

      {!isLoggedIn && (
        <div className="max-w-xl mx-auto mb-8 rounded-lg border-2 border-red-500 bg-red-500/10 p-5 text-center space-y-4">
          <p className="text-lg font-bold text-white">Log in or create an account to subscribe</p>
          <p className="text-sm text-muted-foreground">
            Paid plans must be linked to your COVION account.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="/login?redirect=/subscribe"
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Log in
            </a>
            <a
              href="/signup?redirect=/subscribe"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-5 py-2.5 text-sm font-medium hover:bg-accent"
            >
              Create account
            </a>
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="max-w-xl mx-auto mb-6 rounded-lg border border-primary/40 bg-primary/10 p-4 text-center text-sm">
          {statusMessage}
        </div>
      )}

      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-lg border border-gray-700 p-1 bg-card">
          <button
            type="button"
            onClick={() => setBillingPeriod("monthly")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingPeriod === "monthly"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingPeriod("annual")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingPeriod === "annual"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            Annual <span className="text-xs opacity-80">(Save 10%)</span>
          </button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isFree = plan.monthlyPrice === 0
          const annualPrice = getAnnualPrice(plan.monthlyPrice)
          const priceLabel = isFree
            ? "$0/month"
            : billingPeriod === "monthly"
              ? `${formatPrice(plan.monthlyPrice)}/month`
              : `${formatPrice(annualPrice)}/year`
          const isBusy = loadingPlan === plan.id
          const authHref = isFree
            ? "/signup?redirect=/subscribe"
            : "/login?redirect=/subscribe"

          return (
            <Card
              key={plan.id}
              className={cn("relative transition-all hover:border-primary/60 hover:shadow-lg")}
            >
              <CardHeader>
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-red-600 to-white text-transparent bg-clip-text p-2">
                  {plan.name}
                </CardTitle>
                <CardDescription>{priceLabel}</CardDescription>
                {!isFree && billingPeriod === "annual" && (
                  <p className="text-xs text-green-500 font-medium">
                    Save {formatPrice(plan.monthlyPrice * 12 * ANNUAL_DISCOUNT)}/year vs monthly
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-sm">{plan.description}</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {plan.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {/* Plain <a> when logged out — works even if React hydration fails */}
                {!isLoggedIn || authLoading ? (
                  <a
                    href={authHref}
                    className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    {isFree ? "Create account" : "Log in to subscribe"}
                  </a>
                ) : (
                  <Button
                    className="w-full"
                    disabled={Boolean(loadingPlan)}
                    onClick={() => void startCheckout(plan.id)}
                  >
                    {isBusy ? "Redirecting to Stripe…" : isFree ? "Get Started" : "Subscribe"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <Card className="mt-10 max-w-3xl mx-auto border-gray-800">
        <CardHeader>
          <CardTitle className="text-xl">Pay Per Title (No Subscription)</CardTitle>
          <CardDescription>
            Prefer to pay only for what you watch? Buy individual movies and episodes without a monthly plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-800 bg-card/50 p-4">
              <p className="font-semibold text-primary">Full Movie / Series</p>
              <p className="text-2xl font-bold mt-1">{formatUsd(MOVIE_PURCHASE_PRICE)}</p>
              <p className="text-muted-foreground mt-2">
                Unlock an entire movie or all episodes in a series with one purchase.
              </p>
            </div>
            <div className="rounded-lg border border-gray-800 bg-card/50 p-4">
              <p className="font-semibold text-primary">Single Episode</p>
              <p className="text-2xl font-bold mt-1">{formatUsd(EPISODE_PURCHASE_PRICE)}</p>
              <p className="text-muted-foreground mt-2">
                Pay per episode for series content. Free episodes are marked on the watch page.
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="font-medium">Included with Standard & Family plans</p>
            <p className="text-muted-foreground mt-1">
              <strong>Standard</strong> ({formatPrice(7.5)}/mo or {formatPrice(getAnnualPrice(7.5))}/yr) and{" "}
              <strong>Family</strong> ({formatPrice(12)}/mo or {formatPrice(getAnnualPrice(12))}/yr) subscribers
              watch all paid movies and episodes at no extra cost — no per-title charges.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
