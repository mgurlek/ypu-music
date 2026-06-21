import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Path to the python script
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'get_playlist.py');

    // Run python3 and capture output
    // We increase maxBuffer because a 500-track playlist might output a lot of JSON
    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}" "${url}"`, {
      maxBuffer: 1024 * 1024 * 5, // 5MB limit
    });

    if (stderr && !stdout) {
      throw new Error(stderr);
    }

    const data = JSON.parse(stdout);

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch tracks');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Metadata error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
