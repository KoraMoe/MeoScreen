// POST /api/meetings - Create a new meeting

import { checkRateLimit, getClientIP, RATE_LIMITS } from '../../lib/ratelimit'
import { validateRoomId, validateUserName, parseJsonSafely } from '../../lib/validation'

interface Env {
  RTK_API_KEY: string
  RTK_APP_ID: string
  ROOMS: KVNamespace
}

interface CreateMeetingRequest {
  roomId: string
  userName: string
  isHost: boolean
}

const RTK_API_URL = 'https://api.realtime.cloudflare.com/v2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context
  const clientIP = getClientIP(request)

  // Check global rate limit
  const globalLimit = await checkRateLimit(env.ROOMS, `global:${clientIP}`, RATE_LIMITS.global)
  if (!globalLimit.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': String(globalLimit.resetAt - Math.floor(Date.now() / 1000)),
        } 
      }
    )
  }

  // Check create room rate limit
  const createLimit = await checkRateLimit(env.ROOMS, `create:${clientIP}`, RATE_LIMITS.createRoom)
  if (!createLimit.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many rooms created. Please try again later.' }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': String(createLimit.resetAt - Math.floor(Date.now() / 1000)),
        } 
      }
    )
  }

  try {
    // Parse and validate request body
    const { data: body, error: parseError } = await parseJsonSafely<CreateMeetingRequest>(request)
    if (parseError || !body) {
      return new Response(
        JSON.stringify({ error: parseError || 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { roomId, userName } = body

    // Validate roomId
    const roomIdValidation = validateRoomId(roomId)
    if (!roomIdValidation.valid) {
      return new Response(
        JSON.stringify({ error: roomIdValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate userName
    const userNameValidation = validateUserName(userName)
    if (!userNameValidation.valid) {
      return new Response(
        JSON.stringify({ error: userNameValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if room already exists
    const existingMeetingId = await env.ROOMS.get(roomId)
    if (existingMeetingId) {
      return new Response(
        JSON.stringify({ error: 'Room already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create auth header
    const authToken = btoa(`${env.RTK_APP_ID}:${env.RTK_API_KEY}`)

    // Create meeting in RealtimeKit
    const meetingResponse = await fetch(`${RTK_API_URL}/meetings`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `MeoScreen Room ${roomId}`,
        preferred_region: 'ap-south-1',
        record_on_start: false,
      }),
    })

    if (!meetingResponse.ok) {
      const errorText = await meetingResponse.text()
      console.error('Failed to create meeting:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to create meeting' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const meetingData = await meetingResponse.json() as { id: string }
    const meetingId = meetingData.id

    // Store room -> meeting mapping (expires in 24 hours)
    await env.ROOMS.put(roomId, meetingId, { expirationTtl: 86400 })

    // Add host as participant
    const participantResponse = await fetch(`${RTK_API_URL}/meetings/${meetingId}/participants`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userName.trim(),
        preset_name: 'group_call_host',
      }),
    })

    if (!participantResponse.ok) {
      const errorText = await participantResponse.text()
      console.error('Failed to add participant:', errorText)
      // Clean up the room mapping since we failed
      await env.ROOMS.delete(roomId)
      return new Response(
        JSON.stringify({ error: 'Failed to add participant' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const participantData = await participantResponse.json() as { token: string }

    return new Response(
      JSON.stringify({
        meetingId,
        authToken: participantData.token,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating meeting:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// Handle CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders })
}
