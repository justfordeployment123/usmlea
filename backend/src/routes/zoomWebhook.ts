import crypto from 'crypto'
import type { Request, Response } from 'express'
import { supabaseServiceClient } from '../lib/supabase.js'
import { notifyAllEnrolledStudents } from '../lib/notify.js'
import { env } from '../config/env.js'

// Zoom sends a plain JSON body (not raw buffer), so express.json() middleware is fine here.

export async function zoomWebhookHandler(req: Request, res: Response) {
  // ── 1. URL validation handshake (Zoom fires this once when you register the endpoint) ──
  if (req.body?.event === 'endpoint.url_validation') {
    const plainToken = req.body.payload?.plainToken as string | undefined
    if (!plainToken) return res.status(400).send('Missing plainToken')

    const encryptedToken = crypto
      .createHmac('sha256', env.ZOOM_WEBHOOK_SECRET)
      .update(plainToken)
      .digest('hex')

    return res.status(200).json({ plainToken, encryptedToken })
  }

  // ── 2. Verify webhook signature on all other events ──
  const timestamp  = req.headers['x-zm-request-timestamp'] as string | undefined
  const signature  = req.headers['x-zm-signature'] as string | undefined

  if (timestamp && signature && env.ZOOM_WEBHOOK_SECRET) {
    const message       = `v0:${timestamp}:${JSON.stringify(req.body)}`
    const expected      = 'v0=' + crypto.createHmac('sha256', env.ZOOM_WEBHOOK_SECRET).update(message).digest('hex')
    const ageSeconds    = Math.abs(Date.now() / 1000 - Number(timestamp))

    if (ageSeconds > 300 || expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      return res.status(401).send('Invalid signature')
    }
  }

  // ── 3. Handle meeting.ended ──────────────────────────────────────────────────
  if (req.body?.event === 'meeting.ended') {
    const payload  = req.body.payload as ZoomMeetingEndedPayload
    const meetingId = String(payload?.object?.id ?? '')
    const endTime   = payload?.object?.end_time ?? new Date().toISOString()

    if (!meetingId) return res.status(200).json({ received: true, skipped: 'no_meeting_id' })

    const { data: session, error: fetchErr } = await supabaseServiceClient
      .from('lms_sessions')
      .select('id, class_id, status, started_at')
      .eq('zoom_meeting_id', meetingId)
      .single()

    if (fetchErr || !session) {
      return res.status(200).json({ received: true, skipped: 'session_not_found' })
    }

    if (session.status !== 'live') {
      return res.status(200).json({ received: true, skipped: 'session_not_live' })
    }

    const actualMinutes = session.started_at
      ? Math.max(1, Math.round((new Date(endTime).getTime() - new Date(session.started_at).getTime()) / 60000))
      : null

    const { error: updateErr } = await supabaseServiceClient
      .from('lms_sessions')
      .update({
        status: 'completed',
        ended_at: endTime,
        actual_duration_minutes: actualMinutes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.id)

    if (updateErr) {
      console.error('[zoom-webhook] Failed to end session:', updateErr.message)
      return res.status(500).json({ error: 'db_update_failed' })
    }

    console.log(`[zoom-webhook] Session ${session.id} auto-completed via meeting.ended`)
    return res.status(200).json({ received: true, sessionId: session.id })
  }

  // ── 4. Handle recording.completed ────────────────────────────────────────────
  if (req.body?.event === 'recording.completed') {
    const payload       = req.body.payload as ZoomRecordingPayload
    const downloadToken = req.body.download_token as string | undefined
    const meetingId     = String(payload?.object?.id ?? '')
    const recordFiles   = payload?.object?.recording_files ?? []

    // Pick the best file: prefer MP4 (shared_screen_with_speaker_view), fall back to any MP4
    const mp4Files = recordFiles.filter(f => f.file_type === 'MP4' && f.status === 'completed')
    const best = mp4Files.find(f => f.recording_type === 'shared_screen_with_speaker_view') ?? mp4Files[0]

    // Use play_url (shareable, no auth) — fall back to download_url + token if play_url missing
    const recordingUrl = best?.play_url
      ?? (best?.download_url && downloadToken ? `${best.download_url}?access_token=${downloadToken}` : null)

    if (!meetingId || !recordingUrl) {
      return res.status(200).json({ received: true, skipped: 'no_usable_recording' })
    }

    // Find the session by zoom_meeting_id
    const { data: session, error: fetchErr } = await supabaseServiceClient
      .from('lms_sessions')
      .select('id, class_id, status, recording_url')
      .eq('zoom_meeting_id', meetingId)
      .single()

    if (fetchErr || !session) {
      // Not our session — ignore silently (could be a personal meeting on the same account)
      return res.status(200).json({ received: true, skipped: 'session_not_found' })
    }

    if (session.status !== 'completed') {
      return res.status(200).json({ received: true, skipped: 'session_not_completed' })
    }

    // Don't overwrite a recording already set (manual upload or previous webhook)
    if (session.recording_url) {
      return res.status(200).json({ received: true, skipped: 'recording_already_set' })
    }

    const { error: updateErr } = await supabaseServiceClient
      .from('lms_sessions')
      .update({
        recording_url:    recordingUrl,
        recording_status: 'ready',
        updated_at:       new Date().toISOString(),
      })
      .eq('id', session.id)

    if (updateErr) {
      console.error('[zoom-webhook] Failed to update recording_url:', updateErr.message)
      return res.status(500).json({ error: 'db_update_failed' })
    }

    // Notify enrolled students that the recording is available
    await notifyAllEnrolledStudents(session.class_id, {
      type:      'notice_posted',
      title:     'Session recording available',
      body:      'The recording for your recent session is now ready to watch.',
      classId:   session.class_id,
      sessionId: session.id,
    }).catch(err => console.error('[zoom-webhook] Notify error:', err))

    console.log(`[zoom-webhook] Recording saved for session ${session.id}`)
    return res.status(200).json({ received: true, sessionId: session.id })
  }

  // All other Zoom events — acknowledge and ignore
  return res.status(200).json({ received: true })
}

// ─── Zoom payload types ───────────────────────────────────────────────────────

interface ZoomMeetingEndedPayload {
  object?: {
    id:         number
    uuid:       string
    host_id:    string
    topic:      string
    start_time: string
    end_time:   string
    duration:   number
  }
}

interface ZoomRecordingFile {
  id:              string
  file_type:       string        // 'MP4', 'M4A', 'CHAT', 'TRANSCRIPT', etc.
  recording_type:  string        // 'shared_screen_with_speaker_view', 'speaker_view', etc.
  status:          string        // 'completed'
  play_url?:       string        // shareable URL — no auth required, preferred for student access
  download_url?:   string        // requires access_token param to download
  file_size:       number
  recording_start: string
  recording_end:   string
}

interface ZoomRecordingPayload {
  object?: {
    id:               number    // meeting ID (numeric)
    uuid:             string
    host_id:          string
    topic:            string
    start_time:       string
    duration:         number
    recording_files?: ZoomRecordingFile[]
  }
}
