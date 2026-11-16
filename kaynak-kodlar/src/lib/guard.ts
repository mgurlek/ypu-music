import { NextResponse } from 'next/server';
import { message, pickLang, type MessageCode } from './messages';

function reject(req: Request, status: number, code: MessageCode): Response {
  return NextResponse.json(
    { success: false, code, error: message(code, pickLang(req)) },
    { status }
  );
}

// "Host" header value -> lowercase hostname without port ("[::1]" keeps its brackets).
function hostnameOf(hostHeader: string): string {
  let h = hostHeader.trim().toLowerCase();
  if (h.startsWith('[')) {
    const end = h.indexOf(']');
    return end < 0 ? h : h.slice(0, end + 1);
  }
  const colon = h.indexOf(':');
  if (colon >= 0) h = h.slice(0, colon);
  return h.endsWith('.') ? h.slice(0, -1) : h;
}

function isAllowedHost(hostHeader: string): boolean {
  const name = hostnameOf(hostHeader);
  if (name === 'localhost' || name === '127.0.0.1' || name === '[::1]' || name.endsWith('.localhost')) {
    return true;
  }
  const extra = (process.env.YPU_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((s) => hostnameOf(s))
    .filter((s) => s !== '');
  return extra.includes(name);
}

// null = allowed
export function checkRequest(req: Request): Response | null {
  const method = req.method.toUpperCase();
  const hostHeader = req.headers.get('host') ?? new URL(req.url).host;

  // Blocks DNS rebinding: a page on an attacker's name that resolves to 127.0.0.1 still
  // sends that name in Host, so it is not in the allow list.
  if (!isAllowedHost(hostHeader)) {
    return reject(req, 403, 'FORBIDDEN_ORIGIN');
  }

  if (method === 'POST') {
    const ct = req.headers.get('content-type') ?? '';
    if (!ct.toLowerCase().includes('application/json')) {
      return reject(req, 415, 'BAD_REQUEST');
    }
  }
  if (method === 'POST' || method === 'DELETE') {
    const origin = req.headers.get('origin');
    if (origin !== null) {
      let originHost: string | null = null;
      try {
        originHost = new URL(origin).host;
      } catch {
        originHost = null;
      }
      if (originHost === null || originHost.toLowerCase() !== hostHeader.toLowerCase()) {
        return reject(req, 403, 'FORBIDDEN_ORIGIN');
      }
    }
  }
  return null;
}
