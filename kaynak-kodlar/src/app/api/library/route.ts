import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const downloadDir = process.env.DOWNLOAD_DIR || path.resolve(process.cwd(), '../Indirilen-Muzikler');
    
    // Check if the directory exists
    try {
      await fs.access(downloadDir);
    } catch {
      return NextResponse.json({ success: true, playlists: [] });
    }

    const entries = await fs.readdir(downloadDir, { withFileTypes: true });
    
    // Filter out node_modules, hidden folders, and only keep directories
    const playlists = entries
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'spotdl-ui')
      .map(entry => entry.name);

    return NextResponse.json({ success: true, playlists });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
