import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import { z } from 'zod'
import type Stripe from 'stripe'
import { HttpError } from '../lib/httpError.js'
import { authenticateRequest, requireRole } from '../middleware/authenticate.js'
import { supabaseServiceClient } from '../lib/supabase.js'
import { stripe, createPaymentIntent } from '../lib/stripe.js'
import { notifyStudent } from '../lib/notify.js'
import { env } from '../config/env.js'

export const lmsPaymentsRouter = Router()

// ─── POST /api/v1/payments/checkout ─────────────────────────────────────────
const checkoutSchema = z.object({
  productId:   z.string().uuid(),
  classId:     z.string().uuid().optional(),
  plan:        z.enum(['upfront', 'installment']),
  couponCode:  z.string().optional(),
})

lmsPaymentsRouter.post('/payments/checkout', authenticateRequest, requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = checkoutSchema.parse(req.body)
      const studentId = req.auth!.userId

      const { data: product } = await supabaseServiceClient
        .from('lms_products').select('*').eq('id', parsed.productId).eq('is_active', true).single()
      if (!product) throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'Product not found or inactive.')

      const basePrice = parsed.plan === 'upfront'
        ? Number(product.upfront_price)
        : Number(product.installment_amount)

      let amountPaid = basePrice
      let couponId: string | null = null

      if (parsed.couponCode) {
        const { data: coupon } = await supabaseServiceClient
          .from('lms_coupons')
          .select('*')
          .ilike('code', parsed.couponCode)
          .eq('is_active', true)
          .single()

        if (coupon) {
          const valid =
            (!coupon.expires_at || new Date(coupon.expires_at) >= new Date()) &&
            (coupon.max_uses === null || coupon.uses_count < coupon.max_uses) &&
            (coupon.product_id === null || coupon.product_id === parsed.productId)

          if (valid) {
            couponId = coupon.id
            if (coupon.discount_type === 'percentage') {
              amountPaid = amountPaid * (1 - Number(coupon.discount_value) / 100)
            } else {
              amountPaid = Math.max(0, amountPaid - Number(coupon.discount_value))
            }
          }
        }
      }

      amountPaid = Math.round(amountPaid * 100) / 100

      const { data: existingOrder } = await supabaseServiceClient
        .from('lms_orders')
        .select('id')
        .eq('student_id', studentId)
        .eq('product_id', parsed.productId)
        .eq('status', 'paid')
        .single()

      if (existingOrder) throw new HttpError(409, 'ALREADY_ENROLLED', 'You are already enrolled in this program.')

      const { data: order, error: orderError } = await supabaseServiceClient
        .from('lms_orders')
        .insert({
          student_id: studentId,
          product_id: parsed.productId,
          plan: parsed.plan,
          amount_paid: amountPaid,
          coupon_id: couponId,
          status: 'pending',
        })
        .select().single()

      if (orderError || !order) throw new HttpError(500, 'ORDER_FAILED', orderError?.message ?? 'Failed to create order.')

      const clientSecret = await createPaymentIntent(Math.round(amountPaid * 100), {
        studentId,
        productId: parsed.productId,
        orderId: order.id,
      })

      // Dev mode: auto-enroll immediately when no real webhook is configured
      if (env.STRIPE_WEBHOOK_SECRET === 'whsec_placeholder') {
        await supabaseServiceClient
          .from('lms_orders')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', order.id)

        let targetClassId: string | null = null
        if (parsed.classId) {
          const { data: cls } = await supabaseServiceClient
            .from('lms_classes').select('id').eq('id', parsed.classId).eq('product_id', parsed.productId).single()
          if (cls) targetClassId = cls.id
        }
        if (!targetClassId) {
          const { data: cls } = await supabaseServiceClient
            .from('lms_classes').select('id').eq('product_id', parsed.productId).limit(1).single()
          if (cls) targetClassId = cls.id
        }
        if (targetClassId) {
          await supabaseServiceClient
            .from('lms_enrollments')
            .upsert({ student_id: studentId, class_id: targetClassId, demo_expires_at: null }, { onConflict: 'student_id,class_id' })
        }
        if (couponId) {
          const { data: couponRow } = await supabaseServiceClient
            .from('lms_coupons').select('uses_count').eq('id', couponId).single()
          if (couponRow) {
            await supabaseServiceClient
              .from('lms_coupons').update({ uses_count: couponRow.uses_count + 1 }).eq('id', couponId)
          }
        }
        await notifyStudent({
          studentId,
          type: 'enrollment_confirmed',
          title: 'Enrollment Confirmed',
          body: 'Your payment was successful. You are now enrolled in your class.',
          classId: targetClassId ?? undefined,
        })
        return res.status(200).json({ clientSecret, orderId: order.id, enrolled: true })
      }

      return res.status(200).json({ clientSecret, orderId: order.id, enrolled: false })
    } catch (err) { return next(err) }
  }
)

// ─── POST /api/v1/payments/webhook ──────────────────────────────────────────
// Registered before express.json() in app.ts with raw body middleware
export async function webhookHandler(req: Request, res: Response) {
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      req.headers['stripe-signature'] as string,
      env.STRIPE_WEBHOOK_SECRET
    )
  } catch {
    return res.status(400).send('Webhook signature verification failed')
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent
    const orderId   = intent.metadata['orderId']
    const studentId = intent.metadata['studentId']
    const productId = intent.metadata['productId']
    if (!orderId || !studentId || !productId) return res.json({ received: true })

    await supabaseServiceClient
      .from('lms_orders')
      .update({ status: 'paid', paid_at: new Date().toISOString(), stripe_payment_intent_id: intent.id })
      .eq('id', orderId)

    const { data: cls } = await supabaseServiceClient
      .from('lms_classes').select('id').eq('product_id', productId).limit(1).single()

    if (cls) {
      await supabaseServiceClient
        .from('lms_enrollments')
        .upsert({ student_id: studentId, class_id: cls.id, demo_expires_at: null }, { onConflict: 'student_id,class_id' })
    }

    // Increment coupon uses_count if a coupon was applied to this order
    const { data: orderRow } = await supabaseServiceClient
      .from('lms_orders').select('coupon_id').eq('id', orderId).single()
    if (orderRow?.coupon_id) {
      const { data: couponRow } = await supabaseServiceClient
        .from('lms_coupons').select('uses_count').eq('id', orderRow.coupon_id).single()
      if (couponRow) {
        await supabaseServiceClient
          .from('lms_coupons').update({ uses_count: couponRow.uses_count + 1 }).eq('id', orderRow.coupon_id)
      }
    }

    await notifyStudent({
      studentId,
      type: 'enrollment_confirmed',
      title: 'Enrollment Confirmed',
      body: 'Your payment was successful. You are now enrolled in your class.',
      classId: cls?.id,
    })
  }

  return res.json({ received: true })
}
