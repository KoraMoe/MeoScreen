// Rate limiting utility using Cloudflare KV

interface RateLimitConfig {
  maxRequests: number      // Max requests allowed
  windowSeconds: number    // Time window in seconds
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export async function checkRateLimit(
  kv: KVNamespace,
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - config.windowSeconds
  const kvKey = `ratelimit:${key}`

  // Get existing rate limit data
  const existing = await kv.get(kvKey, 'json') as { requests: number[]; } | null
  
  let requests: number[] = []
  
  if (existing) {
    // Filter out requests outside the current window
    requests = existing.requests.filter(timestamp => timestamp > windowStart)
  }

  const remaining = Math.max(0, config.maxRequests - requests.length)
  const allowed = requests.length < config.maxRequests

  if (allowed) {
    // Add current request timestamp
    requests.push(now)
    
    // Store updated data with TTL
    await kv.put(kvKey, JSON.stringify({ requests }), {
      expirationTtl: config.windowSeconds + 60, // Add buffer
    })
  }

  return {
    allowed,
    remaining: allowed ? remaining - 1 : 0,
    resetAt: requests.length > 0 ? Math.min(...requests) + config.windowSeconds : now + config.windowSeconds,
  }
}

// Get client IP from request
export function getClientIP(request: Request): string {
  // Cloudflare provides the real IP in CF-Connecting-IP header
  return request.headers.get('CF-Connecting-IP') || 
         request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 
         'unknown'
}

// Rate limit configurations
export const RATE_LIMITS = {
  // Creating rooms: 5 per minute per IP
  createRoom: {
    maxRequests: 5,
    windowSeconds: 60,
  },
  // Joining rooms: 10 per minute per IP
  joinRoom: {
    maxRequests: 10,
    windowSeconds: 60,
  },
  // Global: 30 requests per minute per IP
  global: {
    maxRequests: 30,
    windowSeconds: 60,
  },
}

