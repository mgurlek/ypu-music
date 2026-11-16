import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { checkRequest } from '@/lib/guard';
import { message, pickLang } from '@/lib/messages';
import { resolveInsideDownloadDir } from '@/lib/paths';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const denied = checkRequest(req);
  if (denied) return denied;
  const lang = pickLang(req);
  try {
    const rawName = new URL(req.url).searchParams.get('name');
    // Dots-only names ('.', '..') are refused outright. Other odd names (slashes etc.) are
    // sanitised by resolveInsideDownloadDir, the same way the queue names its folders.
    const valid = rawName !== null && !/^[\s.]*$/.test(rawName);
    const playlistDir = valid ? resolveInsideDownloadDir(rawName) : null;

    if (!playlistDir) {
      return NextResponse.json(
        { success: false, code: 'BAD_REQUEST', error: message('BAD_REQUEST', lang) },
        { status: 400 }
      );
    }

    let entries;
    try {
      entries = await fs.readdir(playlistDir, { withFileTypes: true });
    } catch (e: unknown) {
      const code = (e as NodeJS.ErrnoException).code;
      if (code === 'ENOENT' || code === 'ENOTDIR') {
        return NextResponse.json({ success: true, tracks: [], folder: playlistDir });
      }
      throw e;
    }

    const tracks = entries
      .filter((entry) => entry.isFile() && !entry.name.startsWith('.') && /\.mp3$/i.test(entry.name))
      .map((entry) => entry.name.replace(/\.mp3$/i, ''))
      .sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ success: true, tracks, folder: playlistDir });
  } catch (error: unknown) {
    console.error('Playlist listing error:', error);
    return NextResponse.json(
      { success: false, code: 'UNEXPECTED', error: message('UNEXPECTED', lang) },
      { status: 500 }
    );
  }
}
