import { NextResponse } from 'next/server'

// Structured JSON error body for the /api/* endpoints. `error` keeps the
// human-readable string, `code` and `hint` give a stable machine-readable code
// and a resolution hint.
export function apiError(status: number, code: string, message: string, hint: string, headers?: HeadersInit) {
  return NextResponse.json({ error: message, code, hint }, { status, headers })
}

export function methodNotAllowed(allow: string[]) {
  const handler = () =>
    apiError(405, 'method_not_allowed', 'Method not allowed', `This endpoint only supports: ${allow.join(', ')}.`, { Allow: allow.join(', ') })
  return handler
}
