import { NextResponse } from 'next/server';
import { queueManager, QueueItem } from '@/lib/queueManager';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    queue: queueManager.queue,
    currentDownload: queueManager.currentDownload,
    status: queueManager.status,
    logs: queueManager.logs,
    errorDetails: queueManager.errorDetails
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (body.action === 'move') {
      queueManager.moveTrack(body.index, body.direction);
      return NextResponse.json({ success: true });
    }
    
    if (body.tracks && Array.isArray(body.tracks) && body.playlistName) {
      const items: QueueItem[] = body.tracks.map((t: any) => ({
        track: t,
        playlistName: body.playlistName
      }));
      queueManager.addTracks(items);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const trackId = searchParams.get('trackId');

    if (action === 'cancelCurrent') {
      queueManager.cancelCurrent();
    } else if (action === 'remove' && trackId) {
      queueManager.removeTrack(trackId);
    } else if (action === 'clear') {
      queueManager.clearQueue();
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
