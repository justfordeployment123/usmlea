import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import { z } from 'zod'
import { HttpError } from '../lib/httpError.js'
import { supabaseServiceClient } from '../lib/supabase.js'

export const lmsPublicRouter = Router()

// ─── GET /api/v1/products ────────────────────────────────────────────────────
lmsPublicRouter.get('/products',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, error } = await supabaseServiceClient
        .from('lms_products')
        .select('id, name, description, upfront_price, installment_amount, installment_months, is_active, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      const result = (data ?? []).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        upfrontPrice: Number(p.upfront_price),
        installmentAmount: Number(p.installment_amount),
        installmentMonths: p.installment_months,
        isActive: p.is_active,
        createdAt: p.created_at,
      }))

      return res.status(200).json({ products: result })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/programs ────────────────────────────────────────────────────
lmsPublicRouter.get('/programs',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data: products, error } = await supabaseServiceClient
        .from('lms_products')
        .select('id, name, description, upfront_price, installment_amount, installment_months, is_active, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      const productIds = (products ?? []).map(p => p.id)

      const { data: classes } = await supabaseServiceClient
        .from('lms_classes')
        .select('id, product_id, teacher_id')
        .in('product_id', productIds)

      // Get session counts
      const classIds = (classes ?? []).map(c => c.id)
      const { data: sessions } = await supabaseServiceClient
        .from('lms_sessions')
        .select('class_id')
        .in('class_id', classIds)
        .neq('status', 'cancelled')

      const sessionCountByClass: Record<string, number> = {}
      ;(sessions ?? []).forEach(s => {
        sessionCountByClass[s.class_id] = (sessionCountByClass[s.class_id] ?? 0) + 1
      })

      // Get enrollment counts
      const { data: enrollments } = await supabaseServiceClient
        .from('lms_enrollments')
        .select('class_id')
        .in('class_id', classIds)

      const enrollCountByClass: Record<string, number> = {}
      ;(enrollments ?? []).forEach(e => {
        enrollCountByClass[e.class_id] = (enrollCountByClass[e.class_id] ?? 0) + 1
      })

      // Get teacher names
      const teacherIds = [...new Set((classes ?? []).map(c => c.teacher_id).filter(Boolean))]
      const { data: profiles } = await supabaseServiceClient
        .from('profiles')
        .select('id, full_name')
        .in('id', teacherIds)

      const nameMap: Record<string, string> = {}
      ;(profiles ?? []).forEach(p => { nameMap[p.id] = p.full_name })

      // Build classByProduct map (first class per product)
      type ClassRow = { id: string; product_id: string; teacher_id: string }
      const classByProduct: Record<string, ClassRow> = {}
      ;(classes ?? []).forEach(c => {
        if (!classByProduct[c.product_id]) classByProduct[c.product_id] = c
      })

      // Build classIds per product
      const classIdsByProduct: Record<string, string[]> = {}
      ;(classes ?? []).forEach(c => {
        if (!classIdsByProduct[c.product_id]) classIdsByProduct[c.product_id] = []
        classIdsByProduct[c.product_id]!.push(c.id)
      })

      const programs = (products ?? []).map(p => {
        const cls = classByProduct[p.id]
        const classId = cls?.id ?? null
        const teacherId = cls?.teacher_id ?? null
        const teacherName = teacherId ? (nameMap[teacherId] ?? '') : ''
        const sessionCount = classId ? (sessionCountByClass[classId] ?? 0) : 0
        const enrolledCount = classId ? (enrollCountByClass[classId] ?? 0) : 0
        return {
          product: {
            id: p.id,
            name: p.name,
            description: p.description,
            upfrontPrice: Number(p.upfront_price),
            installmentAmount: Number(p.installment_amount),
            installmentMonths: p.installment_months,
            isActive: p.is_active,
            classIds: classIdsByProduct[p.id] ?? [],
            createdAt: p.created_at,
          },
          teacherName,
          teacherId,
          classId,
          sessionCount,
          enrolledCount,
        }
      })

      return res.status(200).json({ programs })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/programs/:productId ─────────────────────────────────────────
lmsPublicRouter.get('/programs/:productId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data: product, error } = await supabaseServiceClient
        .from('lms_products')
        .select('id, name, description, upfront_price, installment_amount, installment_months, is_active')
        .eq('id', req.params.productId)
        .eq('is_active', true)
        .single()

      if (error || !product) throw new HttpError(404, 'NOT_FOUND', 'Product not found.')

      const { data: cls } = await supabaseServiceClient
        .from('lms_classes')
        .select('id, teacher_id')
        .eq('product_id', req.params.productId)
        .limit(1)
        .single()

      let teacherName = ''
      let teacherBio = ''
      let teacherId: string | null = null

      if (cls?.teacher_id) {
        teacherId = cls.teacher_id
        const [{ data: profile }, { data: tp }] = await Promise.all([
          supabaseServiceClient.from('profiles').select('full_name').eq('id', teacherId).single(),
          supabaseServiceClient.from('lms_teacher_profiles').select('bio').eq('id', teacherId).single(),
        ])
        teacherName = profile?.full_name ?? ''
        teacherBio = tp?.bio ?? ''
      }

      const { data: sessions } = await supabaseServiceClient
        .from('lms_sessions')
        .select('id, scheduled_at, duration_minutes, status')
        .eq('class_id', cls?.id ?? '')
        .neq('status', 'cancelled')
        .order('scheduled_at', { ascending: true })

      const { count: enrolledCount } = await supabaseServiceClient
        .from('lms_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', cls?.id ?? '')

      return res.status(200).json({
        program: {
          productId: product.id,
          name: product.name,
          description: product.description,
          upfrontPrice: Number(product.upfront_price),
          installmentAmount: Number(product.installment_amount),
          installmentMonths: product.installment_months,
          teacherName,
          teacherId,
          teacherBio,
          classId: cls?.id ?? null,
          sessions: (sessions ?? []).map(s => ({
            id: s.id,
            scheduledAt: s.scheduled_at,
            durationMinutes: s.duration_minutes,
            status: s.status,
          })),
          enrolledCount: enrolledCount ?? 0,
          sessionCount: (sessions ?? []).length,
        },
      })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/programs/:productId/classes ─────────────────────────────────
lmsPublicRouter.get('/programs/:productId/classes',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data: classes } = await supabaseServiceClient
        .from('lms_classes')
        .select('id, name, description, teacher_id, created_at')
        .eq('product_id', req.params.productId)
        .order('created_at', { ascending: true })

      const teacherIds = [...new Set((classes ?? []).map(c => c.teacher_id).filter(Boolean))]
      const profileMap: Record<string, string> = {}
      if (teacherIds.length) {
        const { data: profiles } = await supabaseServiceClient
          .from('profiles').select('id, full_name').in('id', teacherIds)
        ;(profiles ?? []).forEach(p => { profileMap[p.id] = p.full_name ?? '' })
      }

      const classIds = (classes ?? []).map(c => c.id)
      const enrolledMap: Record<string, number> = {}
      if (classIds.length) {
        const { data: counts } = await supabaseServiceClient
          .from('lms_enrollments').select('class_id').in('class_id', classIds)
        ;(counts ?? []).forEach(r => {
          enrolledMap[r.class_id] = (enrolledMap[r.class_id] ?? 0) + 1
        })
      }

      const result = (classes ?? []).map(c => ({
        classId: c.id,
        name: c.name,
        description: c.description ?? '',
        teacherName: profileMap[c.teacher_id] ?? '',
        enrolledCount: enrolledMap[c.id] ?? 0,
      }))

      return res.status(200).json({ classes: result })
    } catch (err) { return next(err) }
  }
)

// ─── POST /api/v1/coupons/validate ───────────────────────────────────────────
const validateCouponSchema = z.object({
  code:      z.string().min(1),
  productId: z.string().uuid(),
})

lmsPublicRouter.post('/coupons/validate',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = validateCouponSchema.parse(req.body)

      const { data: coupon } = await supabaseServiceClient
        .from('lms_coupons')
        .select('id, code, discount_type, discount_value, max_uses, uses_count, product_id, expires_at, is_active')
        .ilike('code', parsed.code)
        .single()

      if (!coupon || !coupon.is_active) {
        return res.status(200).json({ valid: false, message: 'Coupon not found or inactive.' })
      }

      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return res.status(200).json({ valid: false, message: 'Coupon has expired.' })
      }

      if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
        return res.status(200).json({ valid: false, message: 'Coupon has reached its usage limit.' })
      }

      if (coupon.product_id !== null && coupon.product_id !== parsed.productId) {
        return res.status(200).json({ valid: false, message: 'Coupon is not valid for this product.' })
      }

      return res.status(200).json({
        valid: true,
        discount: Number(coupon.discount_value),
        type: coupon.discount_type,
      })
    } catch (err) { return next(err) }
  }
)
