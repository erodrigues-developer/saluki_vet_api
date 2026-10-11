/** Security events contain metadata only, never bodies, query strings or headers. */
export function safeRequestLog(request: any) {
  return { method: request.method, path: String(request.originalUrl || request.url || '').split('?')[0], userId: request.user?.userId };
}
