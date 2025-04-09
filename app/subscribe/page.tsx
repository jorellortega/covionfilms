"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"

const subscriptionPlans = [
  {
    name: "Free",
    price: "$0/month",
    description: "Limited access to free content",
    features: ["Access to free movies", "Ad-supported viewing", "Slower streaming speed"],
  },
  {
    name: "Movies",
    price: "$5/month",
    description: "Full access to all movies",
    features: ["Unlimited access to all movies", "Ad-free viewing", "Full streaming speed"],
  },
  {
    name: "Premium",
    price: "$10/month",
    description: "Full access to all content",
    features: ["Unlimited access to all movies and reels", "Ad-free viewing", "Exclusive content"],
  },
  {
    name: "Family",
    price: "$15/month",
    description: "Access for the whole family",
    features: ["Up to 5 user profiles", "Parental controls", "Shared watchlist", "Full access to all content"],
  },
]

export default function SubscribePage() {
  const [selectedPlan, setSelectedPlan] = useState("")

  const handleSubscribe = () => {
    if (selectedPlan) {
      toast({
        title: "Subscription Successful",
        description: `You have subscribed to the ${selectedPlan} plan.`,
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
      <RadioGroup onValueChange={setSelectedPlan} className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {subscriptionPlans.map((plan) => (
          <Card key={plan.name} className={`relative ${selectedPlan === plan.name ? "border-primary" : ""}`}>
            <CardHeader>
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-red-600 to-white text-transparent bg-clip-text p-2">
                {plan.name === "Free" && "Free"}
                {plan.name === "Movies" && "Standard"}
                {plan.name === "Premium" && "Full"}
                {plan.name === "Family" && "Family"}
              </CardTitle>
              <CardDescription>{plan.price}</CardDescription>
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
        ))}
      </RadioGroup>
      <div className="mt-8 text-center">
        <Button onClick={handleSubscribe} size="lg" className="w-full md:w-auto">
          Subscribe Now
        </Button>
      </div>
    </div>
  )
}

