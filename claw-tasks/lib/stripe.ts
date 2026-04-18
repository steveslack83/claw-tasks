import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

export const PLANS = {
  solo: process.env.STRIPE_SOLO_PRICE_ID!,
  team: process.env.STRIPE_TEAM_PRICE_ID!,
}
