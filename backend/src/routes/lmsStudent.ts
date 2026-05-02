import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import { z } from 'zod'
import { HttpError } from '../lib/httpError.js'
import { authenticateRequest, requireRole } from '../middleware/authenticate.js'
import { checkDemoAccess } from '../middleware/checkDemoAccess.js'
import { supabaseServiceClient } from '../lib/supabase.js'

export const lmsStudentRouter = Router()

// ─── GET /api/v1/student/classes ─────────────────────────────────────────────
lmsStudentRouter.get('/student/classes', authenticateRequest, requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.auth!.userId

      const { data: enrollments, error } = await supabaseServiceClient
        .from('lms_enrollments')
        .select(`
          class_id, enrolled_at, demo_expires_at,
          lms_classes!inner(
            id, name, description, default_duration_minutes,
            lms_products!inner(id, name),
            lms_teacher_profiles!inner(id)
          )
        `)
        .eq('student_id', studentId)
        .or(`demo_expires_at.is.null,demo_expires_at.gt.${new Date().toISOString()}`)

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      const classIds = (enrollments ?? []).map(e => e.class_id)

      const { data: sessions } = await supabaseServiceClient
        .from('lms_sessions')
        .select('id, class_id, scheduled_at, duration_minutes, status, zoom_meeting_id, recording_url, missed_reason, created_at')
        .in('class_id', classIds)
        .in('status', ['scheduled', 'live'])
        .order('scheduled_at', { ascending: true })

      type SessionRow = NonNullable<typeof sessions>[number]
      const nextSessionByClass: Record<string, SessionRow> = {}
      ;(sessions ?? []).forEach(s => {
        if (!nextSessionByClass[s.class_id]) nextSessionByClass[s.class_id] = s
      })

      const teacherIds = [...new Set((enrollments ?? []).map(e => (e.lms_classes as any).lms_teacher_profiles?.id).filter(Boolean))]
      const { data: profiles } = await supabaseServiceClient
        .from('profiles').select('id, full_name').in('id', teacherIds)
      const { data: teacherProfiles } = await supabaseServiceClient
        .from('lms_teacher_profiles').select('id, profile_picture_url').in('id', teacherIds)

      const nameMap: Record<string, string> = {}
      const photoMap: Record<string, string | null> = {}
      ;(profiles ?? []).forEach(p => { nameMap[p.id] = p.full_name })
      ;(teacherProfiles ?? []).forEach(t => { photoMap[t.id] = t.profile_picture_url })

      const mapSession = (s: SessionRow | null) => s ? {
        id: s.id, classId: s.class_id, scheduledAt: s.scheduled_at,
        durationMinutes: s.duration_minutes, status: s.status,
        meetingLink: s.zoom_meeting_id, recordingUrl: s.recording_url,
        missedReason: s.missed_reason, createdAt: s.created_at,
      } : null

      const result = (enrollments ?? []).map(e => {
        const cls = e.lms_classes as any
        const teacherId = cls.lms_teacher_profiles?.id
        return {
          id: cls.id, name: cls.name, description: cls.description,
          productId: cls.lms_products?.id, productName: cls.lms_products?.name ?? '',
          teacherId, teacherName: nameMap[teacherId] ?? '', teacherPhoto: photoMap[teacherId] ?? null,
          defaultDurationMinutes: cls.default_duration_minutes,
          nextSession: mapSession(nextSessionByClass[e.class_id] ?? null),
          enrolledAt: e.enrolled_at, demoExpiresAt: e.demo_expires_at,
        }
      })

      return res.status(200).json({ classes: result })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/student/classes/:classId ────────────────────────────────────
lmsStudentRouter.get('/student/classes/:classId', authenticateRequest, requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.auth!.userId

      const { data: enrollment } = await supabaseServiceClient
        .from('lms_enrollments').select('class_id').eq('student_id', studentId).eq('class_id', req.params.classId).single()
      if (!enrollment) throw new HttpError(403, 'NOT_ENROLLED', 'You are not enrolled in this class.')

      const { data: cls, error } = await supabaseServiceClient
        .from('lms_classes')
        .select('id, name, description, default_duration_minutes, lms_products!inner(id, name), lms_teacher_profiles!inner(id)')
        .eq('id', req.params.classId)
        .single()

      if (error || !cls) throw new HttpError(404, 'NOT_FOUND', 'Class not found.')

      const teacherId = (cls.lms_teacher_profiles as any).id
      const [{ data: profile }, { data: tp }] = await Promise.all([
        supabaseServiceClient.from('profiles').select('full_name').eq('id', teacherId).single(),
        supabaseServiceClient.from('lms_teacher_profiles').select('profile_picture_url').eq('id', teacherId).single(),
      ])

      return res.status(200).json({
        class: {
          id: cls.id, productId: (cls.lms_products as any).id,
          name: cls.name, description: cls.description,
          productName: (cls.lms_products as any).name,
          teacherId, teacherName: profile?.full_name ?? '',
          teacherPhoto: tp?.profile_picture_url ?? null,
          defaultDurationMinutes: cls.default_duration_minutes,
        },
      })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/student/classes/:classId/sessions ───────────────────────────
lmsStudentRouter.get('/student/classes/:classId/sessions', authenticateRequest, requireRole('student'), checkDemoAccess,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.auth!.userId

      const { data: enrollment } = await supabaseServiceClient
        .from('lms_enrollments').select('class_id').eq('student_id', studentId).eq('class_id', req.params.classId).single()
      if (!enrollment) throw new HttpError(403, 'NOT_ENROLLED', 'You are not enrolled in this class.')

      const { data, error } = await supabaseServiceClient
        .from('lms_sessions')
        .select('id, class_id, scheduled_at, duration_minutes, status, zoom_meeting_id, recording_url, attendance_count, actual_duration_minutes, change_note, missed_reason, created_at')
        .eq('class_id', req.params.classId)
        .neq('status', 'cancelled')
        .order('scheduled_at', { ascending: false })

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      const sessions = (data ?? []).map(s => ({
        id: s.id, classId: s.class_id, scheduledAt: s.scheduled_at,
        durationMinutes: s.duration_minutes, status: s.status,
        meetingLink: s.zoom_meeting_id, recordingUrl: s.recording_url,
        attendanceCount: s.attendance_count, actualDurationMinutes: s.actual_duration_minutes,
        changeNote: s.change_note, missedReason: s.missed_reason, createdAt: s.created_at,
      }))

      return res.status(200).json({ sessions })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/student/classes/:classId/notices ────────────────────────────
lmsStudentRouter.get('/student/classes/:classId/notices', authenticateRequest, requireRole('student'), checkDemoAccess,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.auth!.userId

      const { data: enrollment } = await supabaseServiceClient
        .from('lms_enrollments').select('class_id').eq('student_id', studentId).eq('class_id', req.params.classId).single()
      if (!enrollment) throw new HttpError(403, 'NOT_ENROLLED', 'You are not enrolled in this class.')

      const { data, error } = await supabaseServiceClient
        .from('lms_notices')
        .select('id, class_id, teacher_id, title, content, type, file_name, created_at')
        .eq('class_id', req.params.classId)
        .order('created_at', { ascending: false })

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      const notices = (data ?? []).map(n => ({
        id: n.id, classId: n.class_id, teacherId: n.teacher_id,
        title: n.title, content: n.content, type: n.type,
        fileName: n.file_name, createdAt: n.created_at,
      }))

      return res.status(200).json({ notices })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/student/classes/:classId/attendance ─────────────────────────
lmsStudentRouter.get('/student/classes/:classId/attendance', authenticateRequest, requireRole('student'), checkDemoAccess,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.auth!.userId

      const { data: enrollment } = await supabaseServiceClient
        .from('lms_enrollments').select('class_id').eq('student_id', studentId).eq('class_id', req.params.classId).single()
      if (!enrollment) throw new HttpError(403, 'NOT_ENROLLED', 'You are not enrolled in this class.')

      // Get all session IDs for this class so we can scope the attendance query
      const { data: classSessions } = await supabaseServiceClient
        .from('lms_sessions')
        .select('id, scheduled_at, duration_minutes')
        .eq('class_id', req.params.classId)

      const sessionIds = (classSessions ?? []).map(s => s.id)
      const sessionMeta: Record<string, { scheduledAt: string; durationMinutes: number }> = {}
      ;(classSessions ?? []).forEach(s => { sessionMeta[s.id] = { scheduledAt: s.scheduled_at, durationMinutes: s.duration_minutes } })

      const { data: records, error } = sessionIds.length
        ? await supabaseServiceClient
            .from('lms_attendance_records')
            .select('session_id, status')
            .eq('student_id', studentId)
            .in('session_id', sessionIds)
            .order('session_id')
        : { data: [], error: null }

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      const result = (records ?? []).map(r => ({
        sessionId: r.session_id,
        classId: req.params.classId,
        scheduledAt: sessionMeta[r.session_id]?.scheduledAt ?? '',
        durationMinutes: sessionMeta[r.session_id]?.durationMinutes ?? 0,
        status: r.status,
      }))

      return res.status(200).json({ records: result })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/student/classes/:classId/recordings ─────────────────────────
lmsStudentRouter.get('/student/classes/:classId/recordings', authenticateRequest, requireRole('student'), checkDemoAccess,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.auth!.userId

      const { data: enrollment } = await supabaseServiceClient
        .from('lms_enrollments').select('demo_expires_at').eq('student_id', studentId).eq('class_id', req.params.classId).single()
      if (!enrollment) throw new HttpError(403, 'NOT_ENROLLED', 'You are not enrolled in this class.')

      const isExpiredDemo = enrollment.demo_expires_at && new Date(enrollment.demo_expires_at) < new Date()
      const isDemo = enrollment.demo_expires_at !== null

      if (isExpiredDemo) throw new HttpError(403, 'DEMO_EXPIRED', 'Your demo access has expired.')

      const { data, error } = await supabaseServiceClient
        .from('lms_sessions')
        .select('id, class_id, scheduled_at, duration_minutes, recording_url')
        .eq('class_id', req.params.classId)
        .eq('status', 'completed')
        .not('recording_url', 'is', null)
        .order('scheduled_at', { ascending: true })

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      const recordings = (data ?? []).map((s, idx) => ({
        sessionId: s.id,
        classId: s.class_id,
        scheduledAt: s.scheduled_at,
        durationMinutes: s.duration_minutes,
        recordingUrl: s.recording_url,
        accessLevel: isDemo && idx > 0 ? 'demo_only' : 'full',
      }))

      return res.status(200).json({ recordings })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/student/notifications ───────────────────────────────────────
lmsStudentRouter.get('/student/notifications', authenticateRequest, requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.auth!.userId

      const { data, error } = await supabaseServiceClient
        .from('lms_notifications')
        .select('id, type, title, class_id, is_read, created_at')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      const notifications = (data ?? []).map(n => ({
        id: n.id,
        type: n.type,
        message: n.title,
        classId: n.class_id,
        read: n.is_read,
        createdAt: n.created_at,
      }))

      return res.status(200).json({ notifications })
    } catch (err) { return next(err) }
  }
)

// ─── PATCH /api/v1/student/notifications/:id/read ────────────────────────────
lmsStudentRouter.patch('/student/notifications/:id/read', authenticateRequest, requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.auth!.userId

      const { error } = await supabaseServiceClient
        .from('lms_notifications')
        .update({ is_read: true })
        .eq('id', req.params.id)
        .eq('student_id', studentId)

      if (error) throw new HttpError(500, 'UPDATE_FAILED', error.message)
      return res.status(200).json({ message: 'Notification marked as read.' })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/student/notification-prefs ──────────────────────────────────
lmsStudentRouter.get('/student/notification-prefs', authenticateRequest, requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.auth!.userId

      const { data } = await supabaseServiceClient
        .from('lms_notification_prefs').select('*').eq('student_id', studentId).single()

      const defaults = {
        studentId, emailEnabled: true, pushEnabled: false,
        sessionReminder: true, sessionStarted: true, sessionRescheduled: true, noticePosted: true,
      }

      if (!data) return res.status(200).json({ prefs: defaults })

      return res.status(200).json({
        prefs: {
          studentId: data.student_id,
          emailEnabled: data.email_enabled,
          pushEnabled: data.push_enabled,
          sessionReminder: data.session_reminder,
          sessionStarted: data.session_started,
          sessionRescheduled: data.session_rescheduled,
          noticePosted: data.notice_posted,
        },
      })
    } catch (err) { return next(err) }
  }
)

// ─── PATCH /api/v1/student/notification-prefs ────────────────────────────────
const notifPrefsSchema = z.object({
  emailEnabled:       z.boolean().optional(),
  pushEnabled:        z.boolean().optional(),
  sessionReminder:    z.boolean().optional(),
  sessionStarted:     z.boolean().optional(),
  sessionRescheduled: z.boolean().optional(),
  noticePosted:       z.boolean().optional(),
})

lmsStudentRouter.patch('/student/notification-prefs', authenticateRequest, requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = notifPrefsSchema.parse(req.body)
      const studentId = req.auth!.userId

      const updates: Record<string, unknown> = { student_id: studentId, updated_at: new Date().toISOString() }
      if (parsed.emailEnabled !== undefined)       updates.email_enabled = parsed.emailEnabled
      if (parsed.pushEnabled !== undefined)        updates.push_enabled = parsed.pushEnabled
      if (parsed.sessionReminder !== undefined)    updates.session_reminder = parsed.sessionReminder
      if (parsed.sessionStarted !== undefined)     updates.session_started = parsed.sessionStarted
      if (parsed.sessionRescheduled !== undefined) updates.session_rescheduled = parsed.sessionRescheduled
      if (parsed.noticePosted !== undefined)       updates.notice_posted = parsed.noticePosted

      const { error } = await supabaseServiceClient
        .from('lms_notification_prefs')
        .upsert(updates, { onConflict: 'student_id' })

      if (error) throw new HttpError(500, 'UPSERT_FAILED', error.message)
      return res.status(200).json({ message: 'Preferences saved.' })
    } catch (err) { return next(err) }
  }
)

// ─── PATCH /api/v1/student/profile ───────────────────────────────────────────
const studentProfileSchema = z.object({
  name:  z.string().min(2).optional(),
  phone: z.string().min(5).optional(),
})

lmsStudentRouter.patch('/student/profile', authenticateRequest, requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, phone } = studentProfileSchema.parse(req.body)
      const studentId = req.auth!.userId
      const updates: Record<string, string> = {}
      if (name)  updates.full_name = name
      if (phone) updates.phone = phone

      if (!Object.keys(updates).length) return res.status(200).json({ message: 'Nothing to update.' })

      const { error } = await supabaseServiceClient
        .from('profiles').update(updates).eq('id', studentId)
      if (error) throw new HttpError(500, 'UPDATE_FAILED', error.message)
      return res.status(200).json({ message: 'Profile updated.' })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/student/orders ──────────────────────────────────────────────
lmsStudentRouter.get('/student/orders', authenticateRequest, requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.auth!.userId

      const { data, error } = await supabaseServiceClient
        .from('lms_orders')
        .select('id, plan, amount_paid, status, created_at, paid_at, lms_products!inner(name), lms_coupons(code)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      const orders = (data ?? []).map(o => ({
        id: o.id,
        productName: (o.lms_products as any).name,
        plan: o.plan,
        amountPaid: Number(o.amount_paid),
        status: o.status,
        couponCode: (o.lms_coupons as any)?.code ?? null,
        createdAt: o.created_at,
        paidAt: o.paid_at,
      }))

      return res.status(200).json({ orders })
    } catch (err) { return next(err) }
  }
)
