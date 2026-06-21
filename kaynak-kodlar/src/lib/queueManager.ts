import { spawn, ChildProcess } from 'child_process';
import path from 'path';

export type Track = {
  id: string;
  url: string;
  name: string;
  artist: string;
};

export type CurrentDownload = {
  track: Track;
  playlistName: string;
};

export type QueueItem = CurrentDownload;

class QueueManager {
  public queue: QueueItem[] = [];
  public currentDownload: CurrentDownload | null = null;
  public status: 'idle' | 'downloading' | 'success' | 'error' = 'idle';
  public logs: string[] = [];
  public errorDetails: string | null = null;
  
  private activeProcess: ChildProcess | null = null;

  constructor() {
    this.logs = [];
  }

  private addLog(message: string) {
    this.logs.push(message);
    if (this.logs.length > 200) {
      this.logs.shift(); // Keep last 200 logs
    }
    this.analyzeError(message);
  }

  private analyzeError(message: string) {
    const lower = message.toLowerCase();
    if (lower.includes('ffmpeg is not installed')) {
      this.errorDetails = 'Bilgisayarınızda ses dönüştürme aracı (FFmpeg) kurulu değil. Lütfen sisteminize FFmpeg kurup tekrar deneyin.';
    } else if (lower.includes('could not match any') || lower.includes('video unavailable') || lower.includes('no results found')) {
      this.errorDetails = 'Bu şarkı YouTube üzerinde bulunamadı veya videoya erişim engellenmiş.';
    } else if (lower.includes('too many requests') || lower.includes('ratelimiterror')) {
      this.errorDetails = 'Çok fazla istek attınız, YouTube geçici olarak engelledi. Lütfen biraz bekleyip tekrar deneyin.';
    } else if (lower.includes('traceback (most recent call last)')) {
      if (!this.errorDetails) this.errorDetails = 'İndirme sırasında beklenmeyen bir yazılımsal hata oluştu. Detaylar için loglara göz atın.';
    }
  }

  public addTracks(items: QueueItem[]) {
    this.queue.push(...items);
    if (this.status === 'idle' || this.status === 'success' || this.status === 'error') {
      this.startNext();
    }
  }

  public removeTrack(trackId: string) {
    this.queue = this.queue.filter(item => item.track.id !== trackId);
  }

  public cancelCurrent() {
    if (this.activeProcess) {
      this.activeProcess.kill('SIGINT');
      this.addLog('[INFO] Download cancelled by user');
      this.status = 'error';
      this.errorDetails = 'İndirme işlemi sizin tarafınızdan iptal edildi.';
      // Process on close will handle setting it to null and calling startNext
    }
  }

  public moveTrack(trackIndex: number, direction: 'up' | 'down') {
    if (direction === 'up' && trackIndex > 0) {
      const temp = this.queue[trackIndex - 1];
      this.queue[trackIndex - 1] = this.queue[trackIndex];
      this.queue[trackIndex] = temp;
    } else if (direction === 'down' && trackIndex < this.queue.length - 1) {
      const temp = this.queue[trackIndex + 1];
      this.queue[trackIndex + 1] = this.queue[trackIndex];
      this.queue[trackIndex] = temp;
    }
  }

  public clearQueue() {
      this.queue = [];
  }

  private startNext() {
    if (this.queue.length === 0) {
      this.currentDownload = null;
      this.status = 'idle';
      return;
    }

    const nextItem = this.queue.shift();
    if (!nextItem) return;

    this.currentDownload = nextItem;
    this.status = 'downloading';
    this.errorDetails = null;
    this.addLog(`[INFO] Starting download for: ${nextItem.track.name} by ${nextItem.track.artist}`);

    const downloadDir = process.env.DOWNLOAD_DIR || path.resolve(process.cwd(), '../Indirilen-Muzikler');
    const safePlaylistName = nextItem.playlistName.replace(/[/\\?%*:|"<>]/g, '-');

    const args = [
      '-m',
      'spotdl',
      nextItem.track.url,
      '--output',
      `${safePlaylistName}/{title} - {artist}.{output-ext}`
    ];

    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    this.activeProcess = spawn(pythonCmd, args, { cwd: downloadDir });

    this.activeProcess.stdout?.on('data', (data) => {
      const lines = data.toString().split('\n').filter((l: string) => l.trim() !== '');
      lines.forEach((l: string) => this.addLog(l));
    });

    this.activeProcess.stderr?.on('data', (data) => {
      const lines = data.toString().split('\n').filter((l: string) => l.trim() !== '');
      lines.forEach((l: string) => this.addLog(l));
    });

    this.activeProcess.on('close', (code) => {
      if (code === 0) {
        this.addLog('[DONE] Successfully downloaded track');
        this.status = 'success';
      } else {
        if (this.status !== 'error') {
          this.addLog(`[ERROR] Process exited with code ${code}`);
          this.status = 'error';
        }
      }
      this.activeProcess = null;
      this.currentDownload = null;
      
      // Delay to avoid UI spam and give process time to exit completely
      setTimeout(() => this.startNext(), 2000);
    });

    this.activeProcess.on('error', (err) => {
      this.addLog(`[ERROR] Failed to start spotDL: ${err.message}`);
      this.status = 'error';
      if (err.message.includes('ENOENT')) {
        this.errorDetails = 'Python veya spotDL bilgisayarınızda bulunamadı. Lütfen kurulumları kontrol edin.';
      } else {
        this.errorDetails = 'SpotDL başlatılamadı. Sistemsel bir hata oluştu.';
      }
      this.activeProcess = null;
      this.currentDownload = null;
      setTimeout(() => this.startNext(), 2000);
    });
  }
}

// Preserve across HMR
const globalForQueueManager = globalThis as unknown as {
  queueManager: QueueManager | undefined;
};

export const queueManager =
  globalForQueueManager.queueManager ?? new QueueManager();

if (process.env.NODE_ENV !== 'production') {
  globalForQueueManager.queueManager = queueManager;
}
