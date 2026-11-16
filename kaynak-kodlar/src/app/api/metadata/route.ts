import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import { checkRequest } from '@/lib/guard';
import { isMessageCode, message, pickLang, type Lang, type MessageCode } from '@/lib/messages';
import { pythonEnv, resolvePython } from '@/lib/python';
import { parseSpotifyUrl } from '@/lib/spotifyUrl';

export const runtime = 'nodejs';

const STATUS: Partial<Record<MessageCode, number>> = {
  BAD_REQUEST: 400,
  INVALID_URL: 400,
  UNSUPPORTED_URL: 400,
  PLAYLIST_NOT_PUBLIC: 502,
  NETWORK: 502,
  RATE_LIMITED: 502,
  PYTHON_MISSING: 503,
  PYTHON_TOO_OLD: 503,
  SPOTDL_MISSING: 503,
  TIMEOUT: 504,
};

function fail(code: MessageCode, lang: Lang) {
  return NextResponse.json(
    { success: false, code, error: message(code, lang) },
    { status: STATUS[code] ?? 500 }
  );
}

// INVALID_URL: not a usable link (not a URL at all, or a track/playlist link with a bad id).
// UNSUPPORTED_URL: a well-formed link to something we do not handle (albums, artists, other sites).
function classifyBadUrl(input: string): MessageCode {
  const s = input.trim();
  if (/^spotify:/i.test(s)) {
    return /^spotify:(track|playlist):/i.test(s) ? 'INVALID_URL' : 'UNSUPPORTED_URL';
  }
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return 'INVALID_URL';
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return 'INVALID_URL';
  if (u.hostname.toLowerCase() !== 'open.spotify.com') return 'UNSUPPORTED_URL';
  const parts = u.pathname.split('/').filter(Boolean);
  if (parts[0] && /^intl-/i.test(parts[0])) parts.shift();
  return parts[0] === 'track' || parts[0] === 'playlist' ? 'INVALID_URL' : 'UNSUPPORTED_URL';
}

type RunResult = { stdout: string; stderr: string; timedOut: boolean };

function runScript(command: string, args: string[], timeout: number): Promise<RunResult> {
  return new Promise((resolve) => {
    execFile(
      command,
      args,
      {
        timeout,
        killSignal: 'SIGKILL',
        maxBuffer: 20 * 1024 * 1024,
        env: pythonEnv(),
        windowsHide: true,
        encoding: 'utf8',
      },
      (err, stdout, stderr) => {
        const e = err as (Error & { killed?: boolean; signal?: string }) | null;
        resolve({
          stdout: String(stdout ?? ''),
          stderr: String(stderr ?? ''),
          timedOut: !!e && e.killed === true && !!e.signal,
        });
      }
    );
  });
}

function lastJsonLine(stdout: string): unknown {
  const lines = stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const last = lines[lines.length - 1];
  if (!last) return null;
  try {
    return JSON.parse(last);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const lang = pickLang(req);
  const blocked = checkRequest(req);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail('BAD_REQUEST', lang);
  }
  const rawUrl = typeof body === 'object' && body !== null ? (body as { url?: unknown }).url : undefined;
  if (typeof rawUrl !== 'string' || rawUrl.trim() === '') return fail('INVALID_URL', lang);
  if (rawUrl.length > 500) return fail('UNSUPPORTED_URL', lang);
  const parsed = parseSpotifyUrl(rawUrl);
  if (!parsed) return fail(classifyBadUrl(rawUrl), lang);

  try {
    const py = await resolvePython();
    if (!py.ok) {
      console.error('Metadata: python problem:', py.problem, py.detail);
      return fail(py.problem, lang);
    }

    const scriptPath = path.join(/*turbopackIgnore: true*/ process.cwd(), 'scripts', 'get_playlist.py');
    const timeout = Number(process.env.YPU_METADATA_TIMEOUT_MS) || 180000;
    const run = await runScript(py.command, [...py.prefixArgs, scriptPath, parsed.url], timeout);

    if (run.timedOut) {
      console.error('Metadata: timed out after', timeout, 'ms');
      return fail('TIMEOUT', lang);
    }

    const data = lastJsonLine(run.stdout);
    if (typeof data !== 'object' || data === null) {
      console.error('Metadata: no JSON from script. stderr:', run.stderr.slice(-2000));
      return fail('UNEXPECTED', lang);
    }
    const d = data as Record<string, unknown>;

    if (d.success !== true) {
      console.error('Metadata: script error:', d.code, d.error, run.stderr.slice(-1000));
      return fail(isMessageCode(d.code) ? d.code : 'UNEXPECTED', lang);
    }

    const tracks = Array.isArray(d.tracks) ? d.tracks : [];
    return NextResponse.json({
      success: true,
      playlistName: typeof d.playlistName === 'string' ? d.playlistName : 'Playlist',
      tracks,
      total: tracks.length,
    });
  } catch (error: unknown) {
    console.error('Metadata error:', error);
    return fail('UNEXPECTED', lang);
  }
}
