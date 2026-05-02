import Stripe from 'stripe'
import { env } from '../config/env.js'

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-04-22.dahlia' })

export async function createPaymentIntent(
  amountCents: number,
  metadata: { studentId: string; productId: string; orderId: string }
): Promise<string> {
  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    metadata,
    automatic_payment_methods: { enabled: true },
  })
  return intent.client_secret!
}
