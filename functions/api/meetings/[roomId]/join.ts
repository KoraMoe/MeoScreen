// POST /api/meetings/:roomId/join - Join an existing meeting

interface Env {
  RTK_API_KEY: string
  RTK_APP_ID: string
  ROOMS: KVNamespace
}

interface JoinMeetingRequest {
  userName: string
}

const RTK_API_URL = 'https://api.realtime.cloudflare.com/v2'

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context
  const roomId = params.roomId as string

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body: JoinMeetingRequest = await request.json()
    const { userName } = body

    if (!userName) {
      return new Response(
        JSON.stringify({ error: 'userName is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get meeting ID from room code
    const meetingId = await env.ROOMS.get(roomId)
    if (!meetingId) {
      return new Response(
        JSON.stringify({ error: 'Room not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create auth header
    const authToken = btoa(`${env.RTK_APP_ID}:${env.RTK_API_KEY}`)

    // Add viewer as participant
    const participantResponse = await fetch(`${RTK_API_URL}/meetings/${meetingId}/participants`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userName,
        preset_name: 'group_call_participant',
      }),
    })

    if (!participantResponse.ok) {
      const errorText = await participantResponse.text()
      console.error('Failed to add participant:', errorText)
      
      if (participantResponse.status === 404) {
        // Meeting no longer exists, clean up KV
        await env.ROOMS.delete(roomId)
        return new Response(
          JSON.stringify({ error: 'Room not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to join meeting' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const participantData = await participantResponse.json() as { token: string }

    return new Response(
      JSON.stringify({
        meetingId,
        authToken: participantData.token,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error joining meeting:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// Handle CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

