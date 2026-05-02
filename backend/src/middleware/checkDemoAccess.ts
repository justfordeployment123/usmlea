import type { NextFunction, Request, Response } from 'express'
import { supabaseServiceClient } from '../lib/supabase.js'
import { HttpError } from '../lib/httpError.js'

export async function checkDemoAccess(req: Request, _res: Response, next: NextFunction) {
  try {
    const studentId = req.auth!.userId
    const classId = req.params.classId

    if (!classId) return next()

    const { data: enrollment } = await supabaseServiceClient
      .from('lms_enrollments')
      .select('demo_expires_at')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .single()

    if (!enrollment) {
      throw new HttpError(403, 'NOT_ENROLLED', 'You are not enrolled in this class.')
    }

    if (enrollment.demo_expires_at && new Date(enrollment.demo_expires_at) < new Date()) {
      throw new HttpError(403, 'DEMO_EXPIRED', 'Your demo access has expired. Please enroll to continue.')
    }

    return next()
  } catch (err) {
    return next(err)
  }
}
