import crypto from 'crypto'

let _tokenCache: { token: string; expiresAt: number } | null = null

async function getZoomAccessToken(): Promise<string> {
  if (_tokenCache && Date.now() < _tokenCache.expiresAt) return _tokenCache.token
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
        ).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )
  const { access_token, expires_in } = await res.json() as { access_token: string; expires_in: number }
  _tokenCache = { token: access_token, expiresAt: Date.now() + (expires_in - 60) * 1000 }
  return access_token
}

export async function createZoomMeeting(
  topic: string,
  scheduledAt: string,
  durationMinutes: number
): Promise<{ meetingId: string; startUrl: string }> {
  // ZOOM SWAP: Replace this placeholder with real Zoom API call when credentials are set.
  if (process.env.NODE_ENV !== 'production' || !process.env.ZOOM_ACCOUNT_ID) {
    const id = String(Math.floor(Math.random() * 9_000_000_000) + 1_000_000_000)
    return { meetingId: id, startUrl: `https://zoom.us/s/${id}` }
  }

  const token = await getZoomAccessToken()
  const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic,
      type: 2,
      start_time: scheduledAt,
      duration: durationMinutes,
      settings: {
        join_before_host: false,
        waiting_room: true,
        mute_upon_entry: true,
        auto_recording: 'cloud',
      },
    }),
  })
  const meeting = await res.json() as { id: number; start_url: string }
  return { meetingId: String(meeting.id), startUrl: meeting.start_url }
}

export function generateSdkSignature(meetingNumber: string, role: 0 | 1): string {
  const iat = Math.round(Date.now() / 1000) - 30
  const exp = iat + 60 * 60 * 2

  const payload = {
    sdkKey: process.env.ZOOM_SDK_KEY!,
    mn: meetingNumber,
    role,
    iat,
    exp,
    appKey: process.env.ZOOM_SDK_KEY!,
    tokenExp: exp,
  }

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body   = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig    = crypto
    .createHmac('sha256', process.env.ZOOM_SDK_SECRET!)
    .update(`${header}.${body}`)
    .digest('base64url')

  return `${header}.${body}.${sig}`
}
