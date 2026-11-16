import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { checkRequest } from '@/lib/guard';
import { message, pickLang } from '@/lib/messages';
import { getDownloadDir } from '@/lib/paths';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const denied = checkRequest(req);
  if (denied) return denied;
  const downloadDir = getDownloadDir();
  try {
    let entries;
    try {
      entries = await fs.readdir(downloadDir, { withFileTypes: true });
    } catch (e: unknown) {
      const code = (e as NodeJS.ErrnoException).code;
      if (code === 'ENOENT' || code === 'ENOTDIR') {
        return NextResponse.json({ success: true, playlists: [], downloadDir });
      }
      throw e;
    }

    const playlists = entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules')
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ success: true, playlists, downloadDir });
  } catch (error: unknown) {
    console.error('Library listing error:', error);
    return NextResponse.json(
      { success: false, code: 'UNEXPECTED', error: message('UNEXPECTED', pickLang(req)) },
      { status: 500 }
    );
  }
}
