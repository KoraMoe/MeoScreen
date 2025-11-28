// Request validation utilities

export interface ValidationResult {
  valid: boolean
  error?: string
}

// Validate room ID format
export function validateRoomId(roomId: unknown): ValidationResult {
  if (typeof roomId !== 'string') {
    return { valid: false, error: 'roomId must be a string' }
  }
  
  if (roomId.length < 4 || roomId.length > 10) {
    return { valid: false, error: 'roomId must be 4-10 characters' }
  }
  
  if (!/^[A-Z0-9]+$/.test(roomId)) {
    return { valid: false, error: 'roomId must be alphanumeric uppercase' }
  }
  
  return { valid: true }
}

// Validate username
export function validateUserName(userName: unknown): ValidationResult {
  if (typeof userName !== 'string') {
    return { valid: false, error: 'userName must be a string' }
  }
  
  const trimmed = userName.trim()
  
  if (trimmed.length < 1 || trimmed.length > 30) {
    return { valid: false, error: 'userName must be 1-30 characters' }
  }
  
  // Basic sanitization - no control characters or excessive whitespace
  if (/[\x00-\x1f\x7f]/.test(trimmed)) {
    return { valid: false, error: 'userName contains invalid characters' }
  }
  
  return { valid: true }
}

// Validate request body size (prevent large payloads)
export function validateContentLength(request: Request, maxBytes: number = 1024): ValidationResult {
  const contentLength = request.headers.get('Content-Length')
  
  if (contentLength && parseInt(contentLength) > maxBytes) {
    return { valid: false, error: 'Request body too large' }
  }
  
  return { valid: true }
}

// Parse JSON safely with size limit
export async function parseJsonSafely<T>(
  request: Request,
  maxBytes: number = 1024
): Promise<{ data?: T; error?: string }> {
  try {
    const contentLength = request.headers.get('Content-Length')
    if (contentLength && parseInt(contentLength) > maxBytes) {
      return { error: 'Request body too large' }
    }
    
    const text = await request.text()
    if (text.length > maxBytes) {
      return { error: 'Request body too large' }
    }
    
    const data = JSON.parse(text) as T
    return { data }
  } catch {
    return { error: 'Invalid JSON' }
  }
}

