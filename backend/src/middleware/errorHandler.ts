import type { NextFunction, Request, Response } from 'express'
import { ZodError, type ZodIssue } from 'zod'
import { HttpError } from '../lib/httpError.js'
import { logError } from '../lib/logger.js'

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, 'NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl}`))
}

function friendlyZodMessage(issue: ZodIssue): string {
  const field = issue.path[issue.path.length - 1]

  const fieldMessages: Record<string, string> = {
    email:       'Please enter a valid email address.',
    password:    'Password must be at least 8 characters.',
    name:        'Name must be at least 2 characters.',
    fullName:    'Full name must be at least 2 characters.',
    phone:       'Please enter a valid phone number.',
    bio:         'Bio must be between 10 and 300 characters.',
    reason:      'Please provide a reason (minimum 10 characters).',
    changeNote:  'Please provide a reason for this change (minimum 1 character).',
    url:         'Please enter a valid URL.',
    code:        'Coupon code is required.',
    title:       'Title is required.',
    content:     'Content is required.',
    text:        'Message cannot be empty.',
    description: 'Description is required.',
    plan:        'Please select a payment plan (upfront or installment).',
    productId:   'A valid product must be selected.',
    classId:     'A valid class must be selected.',
    studentId:   'A valid student ID is required.',
    teacherId:   'A valid teacher must be selected.',
    records:     'Attendance records are required.',
    isActive:    'Please provide a valid active status (true or false).',
    type:        'Invalid type selected.',
    discountType:  'Discount type must be "percentage" or "fixed".',
    discountValue: 'Please enter a valid discount amount.',
    days:        'Please enter a valid number of days.',
    status:      'Invalid status value.',
    scheduledAt: 'Please provide a valid date and time.',
    durationMinutes: 'Duration must be at least 15 minutes.',
    accessToken:   'Invalid or missing access token.',
    refreshToken:  'Invalid or missing refresh token.',
    newPassword:   'New password must be at least 8 characters.',
  }

  if (typeof field === 'string' && fieldMessages[field]) {
    return fieldMessages[field]!
  }

  // Fallback by issue code
  switch (issue.code) {
    case 'invalid_type':
      return field ? `"${field}" is required.` : 'Invalid request data.'
    case 'too_small':
      return field ? `"${field}" is too short.` : 'A required field is too short.'
    case 'too_big':
      return field ? `"${field}" is too long.` : 'A field exceeds the maximum length.'
    case 'invalid_string':
      return field ? `"${field}" has an invalid format.` : 'Invalid format.'
    case 'invalid_enum_value':
      return field ? `Invalid value for "${field}".` : 'Invalid option selected.'
    default:
      return 'Please check your input and try again.'
  }
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    const message = friendlyZodMessage(error.issues[0]!)
    return res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message,
      },
    })
  }

  if (error instanceof HttpError) {
    return res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
      },
    })
  }

  logError('Unhandled error', { error })

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong',
    },
  })
}
