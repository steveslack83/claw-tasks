import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-03-25.dahlia',
    })
  }
  return _stripe
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const instance = getStripe()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = Reflect.get(instance as any, prop, receiver)
    return typeof value === 'function' ? (value as Function).bind(instance) : value
  },
})

export const PLANS = {
  get solo() { return process.env.STRIPE_SOLO_PRICE_ID! },
  get team() { return process.env.STRIPE_TEAM_PRICE_ID! },
}
