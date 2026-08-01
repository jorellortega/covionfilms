"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"

const ANNUAL_DISCOUNT = 0.1

const subscriptionPlans = [
  {
    name: "Free",
    monthlyPrice: 0,
    description: "Limited access to free content",
    features: ["Access to free movies", "Ad-supported viewing", "Slower streaming speed"],
  },
  {
    name: "Movies",
    monthlyPrice: 7.5,
    description: "Full access to all movies",
    features: ["Unlimited access to all movies", "Ad-free viewing", "Full streaming speed"],
  },
  {
    name: "Family",
    monthlyPrice: 12,
    description: "Access for the whole family",
    features: ["Up to 5 user profiles", "Parental controls", "Shared watchlist", "Full access to all content"],
  },
]

function formatPrice(amount: number) {
  return amount % 1 === 0 ? `$${amount.toFixed(0)}` : `$${amount.toFixed(2)}`
}

function getAnnualPrice(monthlyPrice: number) {
  return monthlyPrice * 12 * (1 - ANNUAL_DISCOUNT)
}

function getDisplayLabel(name: string) {
  if (name === "Free") return "Free"
  if (name === "Movies") return "Standard"
  if (name === "Family") return "Family"
  return name
}

export default function SubscribePage() {
  const [selectedPlan, setSelectedPlan] = useState("")
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly")

  const handleSubscribe = () => {
    if (selectedPlan) {
      const label = getDisplayLabel(selectedPlan)
      const period = billingPeriod === "annual" ? "annual" : "monthly"
      toast({
        title: "Subscription Successful",
        description: `You have subscribed to the ${label} plan (${period}).`,
      })
    } else {
      toast({
        title: "Subscription Failed",
        description: "Please select a plan before subscribing.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-8 text-center">Choose Your Subscription</h1>

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

      <RadioGroup onValueChange={setSelectedPlan} className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {subscriptionPlans.map((plan) => {
          const isFree = plan.monthlyPrice === 0
          const annualPrice = getAnnualPrice(plan.monthlyPrice)
          const priceLabel = isFree
            ? "$0/month"
            : billingPeriod === "monthly"
              ? `${formatPrice(plan.monthlyPrice)}/month`
              : `${formatPrice(annualPrice)}/year`

          return (
            <Card key={plan.name} className={`relative ${selectedPlan === plan.name ? "border-primary" : ""}`}>
              <CardHeader>
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-red-600 to-white text-transparent bg-clip-text p-2">
                  {getDisplayLabel(plan.name)}
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
                <RadioGroupItem value={plan.name} id={plan.name} className="absolute top-4 right-4" />
              </CardFooter>
            </Card>
          )
        })}
      </RadioGroup>
      <div className="mt-8 text-center">
        <Button onClick={handleSubscribe} size="lg" className="w-full md:w-auto">
          Subscribe Now
        </Button>
      </div>
    </div>
  )
}
