import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import { z } from 'zod'
import { HttpError } from '../lib/httpError.js'
import { authenticateRequest, requireRole } from '../middleware/authenticate.js'
import { supabaseServiceClient } from '../lib/supabase.js'

export const lmsEditorRouter = Router()

// ─── GET /api/v1/editor/teachers ─────────────────────────────────────────────
lmsEditorRouter.get('/editor/teachers', authenticateRequest, requireRole('editor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data: teachers } = await supabaseServiceClient
        .from('lms_teacher_profiles')
        .select('id, status, phone, bio, profile_picture_url, created_at, profiles!inner(full_name, email)')
        .order('created_at', { ascending: false })

      const teacherIds = (teachers ?? []).map(t => t.id)
      const { data: classes } = await supabaseServiceClient
        .from('lms_classes').select('id, teacher_id').in('teacher_id', teacherIds)

      const classMap: Record<string, string[]> = {}
      ;(classes ?? []).forEach(c => {
        if (!classMap[c.teacher_id]) classMap[c.teacher_id] = []
        classMap[c.teacher_id]!.push(c.id)
      })

      const result = (teachers ?? []).map(t => ({
        id: t.id,
        name: (t.profiles as any).full_name,
        email: (t.profiles as any).email,
        phone: t.phone,
        bio: t.bio,
        profilePicture: t.profile_picture_url ?? null,
        status: t.status,
        registeredAt: t.created_at,
        assignedClassIds: classMap[t.id] ?? [],
      }))

      return res.status(200).json({ teachers: result })
    } catch (err) { return next(err) }
  }
)

// ─── PATCH /api/v1/editor/teachers/:id/approve ───────────────────────────────
lmsEditorRouter.patch('/editor/teachers/:id/approve', authenticateRequest, requireRole('editor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error } = await supabaseServiceClient
        .from('lms_teacher_profiles').update({ status: 'approved' }).eq('id', req.params.id)
      if (error) throw new HttpError(500, 'UPDATE_FAILED', error.message)
      return res.status(200).json({ message: 'Teacher approved.' })
    } catch (err) { return next(err) }
  }
)

// ─── PATCH /api/v1/editor/teachers/:id/reject ────────────────────────────────
lmsEditorRouter.patch('/editor/teachers/:id/reject', authenticateRequest, requireRole('editor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error } = await supabaseServiceClient
        .from('lms_teacher_profiles').update({ status: 'suspended' }).eq('id', req.params.id)
      if (error) throw new HttpError(500, 'UPDATE_FAILED', error.message)
      return res.status(200).json({ message: 'Teacher rejected.' })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/editor/sessions ─────────────────────────────────────────────
lmsEditorRouter.get('/editor/sessions', authenticateRequest, requireRole('editor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, error } = await supabaseServiceClient
        .from('lms_sessions')
        .select(`
          *,
          lms_classes!inner(
            id, name,
            lms_teacher_profiles!inner(id),
            lms_products:lms_classes_product_id_fkey(name)
          )
        `)
        .order('scheduled_at', { ascending: false })

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      const teacherIds = [...new Set((data ?? []).map(s => (s.lms_classes as any).lms_teacher_profiles?.id).filter(Boolean))]
      const { data: profiles } = await supabaseServiceClient
        .from('profiles').select('id, full_name').in('id', teacherIds)

      const nameMap: Record<string, string> = {}
      ;(profiles ?? []).forEach(p => { nameMap[p.id] = p.full_name })

      const result = (data ?? []).map(s => ({
        id: s.id, classId: s.class_id,
        className: (s.lms_classes as any).name,
        teacherName: nameMap[(s.lms_classes as any).lms_teacher_profiles?.id] ?? '',
        productName: (s.lms_classes as any).lms_products?.name ?? '',
        scheduledAt: s.scheduled_at, durationMinutes: s.duration_minutes, status: s.status,
        meetingLink: s.zoom_meeting_id, attendanceCount: s.attendance_count,
        actualDurationMinutes: s.actual_duration_minutes, changeNote: s.change_note,
        missedReason: s.missed_reason, recordingUrl: s.recording_url, createdAt: s.created_at,
      }))

      return res.status(200).json({ sessions: result })
    } catch (err) { return next(err) }
  }
)

// ─── PATCH /api/v1/editor/sessions/:id ───────────────────────────────────────
const updateSessionSchema = z.object({
  scheduledAt:     z.string().datetime().optional(),
  durationMinutes: z.number().int().min(15).optional(),
  meetingLink:     z.string().optional(),
  changeNote:      z.string().min(1),
})

lmsEditorRouter.patch('/editor/sessions/:id', authenticateRequest, requireRole('editor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = updateSessionSchema.parse(req.body)
      const updates: Record<string, unknown> = { change_note: parsed.changeNote, updated_at: new Date().toISOString() }
      if (parsed.scheduledAt)     updates.scheduled_at = parsed.scheduledAt
      if (parsed.durationMinutes) updates.duration_minutes = parsed.durationMinutes
      if (parsed.meetingLink)     updates.zoom_meeting_id = parsed.meetingLink

      const { data: updated, error } = await supabaseServiceClient
        .from('lms_sessions').update(updates).eq('id', req.params.id).select().single()

      if (error) throw new HttpError(500, 'UPDATE_FAILED', error.message)
      return res.status(200).json({
        session: {
          id: updated.id, classId: updated.class_id, scheduledAt: updated.scheduled_at,
          durationMinutes: updated.duration_minutes, status: updated.status,
          meetingLink: updated.zoom_meeting_id, attendanceCount: updated.attendance_count,
          actualDurationMinutes: updated.actual_duration_minutes, changeNote: updated.change_note,
          missedReason: updated.missed_reason, recordingUrl: updated.recording_url, createdAt: updated.created_at,
        },
      })
    } catch (err) { return next(err) }
  }
)

// ─── PATCH /api/v1/editor/sessions/:id/cancel ────────────────────────────────
lmsEditorRouter.patch('/editor/sessions/:id/cancel', authenticateRequest, requireRole('editor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error } = await supabaseServiceClient
        .from('lms_sessions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .in('status', ['scheduled', 'live'])
      if (error) throw new HttpError(500, 'CANCEL_FAILED', error.message)
      return res.status(200).json({ message: 'Session cancelled.' })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/editor/products ─────────────────────────────────────────────
lmsEditorRouter.get('/editor/products', authenticateRequest, requireRole('editor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, error } = await supabaseServiceClient
        .from('lms_products')
        .select('id, name, description, upfront_price, installment_amount, installment_months, is_active, created_at')
        .order('created_at', { ascending: false })
      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)
      const products = (data ?? []).map(p => ({
        id: p.id, name: p.name, description: p.description ?? '',
        upfrontPrice: Number(p.upfront_price),
        installmentAmount: Number(p.installment_amount),
        installmentMonths: p.installment_months,
        isActive: p.is_active,
        createdAt: p.created_at,
      }))
      return res.status(200).json({ products })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/editor/classes ──────────────────────────────────────────────
lmsEditorRouter.get('/editor/classes', authenticateRequest, requireRole('editor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, error } = await supabaseServiceClient
        .from('lms_classes')
        .select('id, product_id, name, description, teacher_id, default_duration_minutes, created_at, lms_products:lms_classes_product_id_fkey(name)')
        .order('created_at', { ascending: false })

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      const result = (data ?? []).map(c => ({
        id: c.id,
        productId: c.product_id,
        productName: (c.lms_products as any)?.name ?? '',
        name: c.name,
        description: c.description,
        teacherId: c.teacher_id,
        defaultDurationMinutes: c.default_duration_minutes,
        createdAt: c.created_at,
      }))

      return res.status(200).json({ classes: result })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/editor/chat ─────────────────────────────────────────────────
lmsEditorRouter.get('/editor/chat', authenticateRequest, requireRole('editor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const classIdFilter = req.query.classId as string | undefined
      const limit = Math.min(Number(req.query.limit) || 100, 200)
      const before = req.query.before as string | undefined

      let query = supabaseServiceClient
        .from('lms_chat_messages')
        .select('id, class_id, sender_id, sender_name, sender_role, text, is_deleted, sent_at, lms_classes!inner(name)')
        .order('sent_at', { ascending: false })
        .limit(limit)

      if (classIdFilter) query = (query as any).eq('class_id', classIdFilter)
      if (before) query = (query as any).lt('sent_at', before)

      const { data, error } = await query
      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      const result = (data ?? []).map(m => ({
        id: m.id, classId: m.class_id, className: (m.lms_classes as any).name,
        senderId: m.sender_id, senderName: m.sender_name, senderRole: m.sender_role,
        text: m.is_deleted ? '[Message deleted]' : m.text,
        isDeleted: m.is_deleted, sentAt: m.sent_at,
      }))

      return res.status(200).json({ messages: result.reverse(), hasMore: result.length === limit })
    } catch (err) { return next(err) }
  }
)
