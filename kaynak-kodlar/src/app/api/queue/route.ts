import { NextResponse } from 'next/server';
import { queueManager, QueueItem } from '@/lib/queueManager';
import { checkRequest } from '@/lib/guard';
import { message, pickLang, type MessageCode } from '@/lib/messages';
import { getDownloadDir } from '@/lib/paths';
import { parseSpotifyUrl } from '@/lib/spotifyUrl';

export const dynamic = 'force-dynamic';

const MAX_TRACKS = 2000;

function fail(req: Request, status: number, code: MessageCode) {
  return NextResponse.json(
    { success: false, code, error: message(code, pickLang(req)) },
    { status }
  );
}

function str(x: unknown, max: number): x is string {
  return typeof x === 'string' && x.length <= max;
}

function parseTracks(x: unknown): QueueItem['track'][] | null {
  if (!Array.isArray(x) || x.length < 1 || x.length > MAX_TRACKS) return null;
  const out: QueueItem['track'][] = [];
  for (const t of x as unknown[]) {
    if (typeof t !== 'object' || t === null) return null;
    const o = t as Record<string, unknown>;
    if (!str(o.id, 64) || o.id === '') return null;
    if (!str(o.name, 300) || !str(o.artist, 300)) return null;
    const parsed = parseSpotifyUrl(o.url);
    if (!parsed || parsed.kind !== 'track') return null;
    out.push({ id: o.id, name: o.name, artist: o.artist, url: parsed.url });
  }
  return out;
}

function parseDirection(x: unknown): 'up' | 'down' | null {
  return x === 'up' || x === 'down' ? x : null;
}

export async function GET(req: Request) {
  const denied = checkRequest(req);
  if (denied) return denied;
  const lang = pickLang(req);
  const code = queueManager.errorCode;
  return NextResponse.json({
    queue: queueManager.queue,
    currentDownload: queueManager.currentDownload,
    status: queueManager.status,
    logs: queueManager.logs,
    errorCode: code,
    errorDetails: code ? message(code, lang) : null,
    blocked: queueManager.blocked,
    downloadDir: getDownloadDir(),
    completedCount: queueManager.completedCount,
    failed: queueManager.failed.map((f) => ({ ...f, errorDetails: message(f.errorCode, lang) })),
  });
}

export async function POST(req: Request) {
  const denied = checkRequest(req);
  if (denied) return denied;

  try {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return fail(req, 400, 'BAD_REQUEST');
    }
    if (typeof raw !== 'object' || raw === null) return fail(req, 400, 'BAD_REQUEST');
    const body = raw as Record<string, unknown>;

    if (body.action === 'move') {
      const direction = parseDirection(body.direction);
      if (!direction) return fail(req, 400, 'BAD_REQUEST');
      if (typeof body.trackId === 'string' && body.trackId !== '') {
        const pl = typeof body.playlistName === 'string' ? body.playlistName : undefined;
        queueManager.moveTrack(body.trackId, pl, direction);
      } else if (typeof body.index === 'number' && Number.isInteger(body.index)) {
        queueManager.moveTrackByIndex(body.index, direction);
      } else {
        return fail(req, 400, 'BAD_REQUEST');
      }
      return NextResponse.json({ success: true });
    }

    if (body.action === 'retry') {
      queueManager.retry();
      return NextResponse.json({ success: true });
    }

    if (body.action !== undefined) return fail(req, 400, 'BAD_REQUEST');

    const tracks = parseTracks(body.tracks);
    const name = body.playlistName;
    if (!tracks || typeof name !== 'string' || name.length < 1 || name.length > 200) {
      return fail(req, 400, 'BAD_REQUEST');
    }
    queueManager.addTracks(tracks.map((track) => ({ track, playlistName: name })));
    return NextResponse.json({ success: true });
  } catch {
    return fail(req, 500, 'UNEXPECTED');
  }
}

export async function DELETE(req: Request) {
  const denied = checkRequest(req);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const trackId = searchParams.get('trackId');
    const playlistName = searchParams.get('playlistName');

    if (action === 'cancelCurrent') {
      queueManager.cancelCurrent();
    } else if (action === 'remove' && trackId) {
      queueManager.removeTrack(trackId, playlistName ?? undefined);
    } else if (action === 'clear') {
      queueManager.clearQueue();
    } else if (action === 'stopAll') {
      queueManager.stopAll();
    } else if (action === 'removePlaylist' && playlistName) {
      queueManager.removePlaylist(playlistName);
    } else {
      return fail(req, 400, 'BAD_REQUEST');
    }

    return NextResponse.json({ success: true });
  } catch {
    return fail(req, 500, 'UNEXPECTED');
  }
}
