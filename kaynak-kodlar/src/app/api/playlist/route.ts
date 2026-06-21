import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const playlistName = searchParams.get('name');

    if (!playlistName) {
      return NextResponse.json({ error: 'Playlist name is required' }, { status: 400 });
    }

    const downloadDir = process.env.DOWNLOAD_DIR || path.resolve(process.cwd(), '../Indirilen-Muzikler');
    const safePlaylistName = playlistName.replace(/[/\\?%*:|"<>]/g, '-');
    const playlistDir = path.join(downloadDir, safePlaylistName);
    
    // Check if the directory exists
    try {
      await fs.access(playlistDir);
    } catch {
      return NextResponse.json({ success: true, tracks: [] });
    }

    const entries = await fs.readdir(playlistDir, { withFileTypes: true });
    
    // Filter out only mp3 files
    const tracks = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.mp3'))
      .map(entry => {
        // Remove .mp3 extension for display
        return entry.name.replace(/\.mp3$/, '');
      });

    return NextResponse.json({ success: true, tracks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
