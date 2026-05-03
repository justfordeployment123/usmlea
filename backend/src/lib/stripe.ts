import Stripe from 'stripe'
import { env } from '../config/env.js'
import { supabaseServiceClient } from './supabase.js'

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

// ─── Subscription helpers ────────────────────────────────────────────────────

export async function getOrCreateStripeCustomer(studentId: string, email: string): Promise<string> {
  const { data: profile } = await supabaseServiceClient
    .from('profiles')
    .select('stripe_customer_id, full_name')
    .eq('id', studentId)
    .single()

  if (profile?.stripe_customer_id) return profile.stripe_customer_id

  const customer = await stripe.customers.create({
    email,
    name: profile?.full_name ?? undefined,
    metadata: { studentId },
  })

  await supabaseServiceClient
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', studentId)

  return customer.id
}

export async function createMonthlySubscription(
  customerId: string,
  amountCents: number,
  metadata: { studentId: string; productId: string; orderId: string; installmentMonths: number }
): Promise<{ subscriptionId: string; clientSecret: string }> {
  const price = await stripe.prices.create({
    currency: 'usd',
    unit_amount: amountCents,
    recurring: { interval: 'month' },
    product_data: { name: 'LMS Program — Monthly Installment' },
  })

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: price.id }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
    metadata,
  })

  const invoice = subscription.latest_invoice as Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent | null }
  const paymentIntent = invoice?.payment_intent

  if (!paymentIntent?.client_secret) throw new Error('Subscription payment intent not available')

  return {
    subscriptionId: subscription.id,
    clientSecret: paymentIntent.client_secret,
  }
}
