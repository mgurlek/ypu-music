import { spawn, spawnSync, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { StringDecoder } from 'string_decoder';
import { ensureDownloadDir, sanitizeFolderName } from './paths';
import { pythonEnv, resolvePython } from './python';
import type { MessageCode } from './messages';

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

export type FailedItem = {
  name: string;
  artist: string;
  playlistName: string;
  errorCode: MessageCode;
};

export type QueueStatus = 'idle' | 'downloading' | 'success' | 'error';

const MAX_QUEUE = 5000;
const MAX_LOGS = 200;
const MAX_LINE = 2000;
const GAP_MS = 2000;
const MAX_CLASSIFY_CHARS = 400000;
const KILL_GRACE_MS = 10000;

function stallMs(): number {
  const v = Number(process.env.YPU_STALL_MS);
  return Number.isFinite(v) && v >= 1000 ? v : 300000;
}

// Problems that affect every track, so the queue must stop instead of failing them all.
const GLOBAL_CODES: ReadonlySet<MessageCode> = new Set<MessageCode>([
  'PYTHON_MISSING',
  'PYTHON_TOO_OLD',
  'SPOTDL_MISSING',
  'FFMPEG_MISSING',
  'DISK_FULL',
  'DOWNLOAD_DIR_ERROR',
  'NETWORK',
  'RATE_LIMITED',
]);

// Patterns are matched against output reduced to lowercase letters and digits,
// because spotdl's rich output wraps long lines inside boxes.
const PATTERNS: Array<[MessageCode, string[]]> = [
  ['FFMPEG_MISSING', ['ffmpegisnotinstalled', 'ffmpegerror']],
  ['SPOTDL_MISSING', ['nomodulenamedspotdl']],
  ['DISK_FULL', ['nospaceleft', 'enospc', 'notenoughspaceonthedisk']],
  ['RATE_LIMITED', ['toomanyrequests', 'httperror429', 'ratelimit']],
  [
    'NETWORK',
    ['getaddrinfo', 'maxretriesexceeded', 'temporaryfailureinnameresolution', 'connectionerror'],
  ],
  [
    'NOT_FOUND_ON_YOUTUBE',
    ['couldnotmatchany', 'videounavailable', 'noresultsfound', 'lookuperror'],
  ],
  [
    'UNEXPECTED',
    ['tracebackmostrecentcalllast', 'downloadererror', 'metadataerror', 'audioprovidererror'],
  ],
];

const ANSI = /\u001b(?:\[[0-9;?]*[ -/]*[@-~]|\][^\u0007\u001b]*(?:\u0007|\u001b\\)|[@-Z\\-_])/g;

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

// spotdl echoes the song title in its log lines; a title such as "Rate Limit Blues" must not
// look like an error, so the current track's own names are blanked out before matching.
function stripOwnNames(norm: string, track: Track): string {
  const n = normalise(track.name);
  const a = normalise(track.artist);
  const variants = [`${a}${n}`, `${n}${a}`, n, a]
    .filter((v) => v.length >= 3)
    .sort((x, y) => y.length - x.length);
  let out = norm;
  for (const v of variants) out = out.split(v).join('-');
  return out;
}

// spotdl logs `Downloaded "<name>": <url>` for a finished song and
// `Skipping <name> (file already exists)` for one that is already on disk.
const SUCCESS_MARKERS = [/\bdownloaded "/i, /\bskipping .*\(file already exists\)/i];

// True when the folder holds an .mp3 written at or after the run started (small clock slack).
function hasFreshMp3(dir: string, sinceMs: number): boolean {
  try {
    for (const name of fs.readdirSync(dir)) {
      if (!/\.mp3$/i.test(name)) continue;
      try {
        if (fs.statSync(path.join(dir, name)).mtimeMs >= sinceMs - 2000) return true;
      } catch {
        // vanished between listing and stat
      }
    }
  } catch {
    // folder missing or unreadable: no file
  }
  return false;
}

function classify(norm: string): MessageCode | null {
  for (const [code, needles] of PATTERNS) {
    if (needles.some((n) => norm.includes(n))) return code;
  }
  return null;
}

function isQueueItem(x: unknown): x is QueueItem {
  if (typeof x !== 'object' || x === null) return false;
  const o = x as Record<string, unknown>;
  if (typeof o.playlistName !== 'string') return false;
  const t = o.track;
  if (typeof t !== 'object' || t === null) return false;
  const tr = t as Record<string, unknown>;
  return (
    typeof tr.id === 'string' &&
    typeof tr.url === 'string' &&
    typeof tr.name === 'string' &&
    typeof tr.artist === 'string'
  );
}

class QueueManager {
  public queue: QueueItem[] = [];
  public currentDownload: CurrentDownload | null = null;
  public status: QueueStatus = 'idle';
  public logs: string[] = [];
  public errorCode: MessageCode | null = null;
  public blocked = false;
  public completedCount = 0;
  public failed: FailedItem[] = [];

  private activeProcess: ChildProcess | null = null;
  private starting = false;
  private timer: NodeJS.Timeout | null = null;
  private cancelRequested = false;
  private forcePythonRefresh = false;
  // Arms the forced-finish fallback of the run in progress (set by launch()).
  private armForceFinish: (() => void) | null = null;
  // Children whose run was force-finished while they were still alive.
  private orphans = new Set<number>();

  public activePid(): number | undefined {
    return this.activeProcess?.pid;
  }

  public orphanPids(): number[] {
    return Array.from(this.orphans);
  }

  private addLog(message: string) {
    this.logs.push(message);
    if (this.logs.length > MAX_LOGS) this.logs.splice(0, this.logs.length - MAX_LOGS);
  }

  private compact() {
    this.queue = this.queue.filter(isQueueItem);
  }

  private clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  // The only place that schedules the next start.
  private scheduleNext(delay: number) {
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.startNext();
    }, delay);
  }

  private isBusy(): boolean {
    return this.starting || this.activeProcess !== null || this.timer !== null;
  }

  private kick() {
    if (!this.blocked && !this.isBusy()) void this.startNext();
  }

  // Removing items while the queue is blocked drops the block; if the problem persists the
  // next run simply blocks again.
  private afterRemoval(changed: boolean) {
    if (!changed || !this.blocked) return;
    this.blocked = false;
    this.errorCode = null;
    if (!this.isBusy()) this.status = 'idle';
    this.kick();
  }

  public addTracks(items: QueueItem[]) {
    this.compact();
    const wasIdle =
      this.queue.length === 0 &&
      this.currentDownload === null &&
      !this.starting &&
      this.activeProcess === null &&
      this.timer === null;

    const seen = new Set<string>();
    const key = (i: QueueItem) => `${i.playlistName}\u0000${i.track.id}`;
    this.queue.forEach((i) => seen.add(key(i)));
    if (this.currentDownload) seen.add(key(this.currentDownload));

    let added = 0;
    for (const item of items) {
      if (!isQueueItem(item)) continue;
      if (this.queue.length >= MAX_QUEUE) break;
      const k = key(item);
      if (seen.has(k)) continue;
      seen.add(k);
      this.queue.push({
        track: {
          id: item.track.id,
          url: item.track.url,
          name: item.track.name,
          artist: item.track.artist,
        },
        playlistName: item.playlistName,
      });
      added++;
    }
    if (added === 0) return;

    if (wasIdle) {
      this.completedCount = 0;
      this.failed = [];
    }
    this.blocked = false;
    this.kick();
  }

  public retry() {
    this.blocked = false;
    if (this.status === 'error' && !this.isBusy()) this.errorCode = null;
    if (this.queue.length === 0 && !this.isBusy()) {
      this.status = 'idle';
      this.errorCode = null;
      return;
    }
    this.kick();
  }

  public removeTrack(trackId: string, playlistName?: string) {
    const before = this.queue.length;
    this.queue = this.queue.filter(
      (item) =>
        isQueueItem(item) &&
        !(item.track.id === trackId && (playlistName === undefined || item.playlistName === playlistName))
    );
    this.afterRemoval(this.queue.length !== before);
  }

  public removePlaylist(playlistName: string) {
    const before = this.queue.length;
    this.queue = this.queue.filter((item) => isQueueItem(item) && item.playlistName !== playlistName);
    this.afterRemoval(this.queue.length !== before);
  }

  public clearQueue() {
    this.queue = [];
    this.afterRemoval(true);
  }

  public stopAll() {
    this.queue = [];
    this.blocked = false;
    this.cancelCurrent();
    if (!this.starting && this.activeProcess === null) {
      this.clearTimer();
      this.currentDownload = null;
      this.status = 'idle';
      this.errorCode = null;
    }
  }

  public cancelCurrent() {
    if (this.starting && this.activeProcess === null) {
      this.cancelRequested = true;
      return;
    }
    const proc = this.activeProcess;
    if (!proc) return;
    this.cancelRequested = true;
    this.addLog('[INFO] Download cancelled by user');
    this.killTree(proc);
    this.armForceFinish?.();
  }

  private killTree(proc: ChildProcess) {
    const pid = proc.pid;
    if (pid === undefined) return;
    if (process.platform === 'win32') {
      try {
        const killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true });
        killer.on('error', () => proc.kill());
        killer.on('exit', (c) => {
          if (c !== 0) proc.kill();
        });
      } catch {
        proc.kill();
      }
      return;
    }
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      proc.kill('SIGTERM');
    }
    const t = setTimeout(() => {
      if (this.activeProcess !== proc) return;
      try {
        process.kill(-pid, 'SIGKILL');
      } catch {
        proc.kill('SIGKILL');
      }
    }, 3000);
    t.unref();
  }

  public moveTrack(trackId: string, playlistName: string | undefined, direction: 'up' | 'down') {
    this.compact();
    const idx = this.queue.findIndex(
      (i) => i.track.id === trackId && (playlistName === undefined || i.playlistName === playlistName)
    );
    if (idx < 0) return;
    const pl = this.queue[idx].playlistName;
    const step = direction === 'up' ? -1 : 1;
    for (let j = idx + step; j >= 0 && j < this.queue.length; j += step) {
      if (this.queue[j].playlistName === pl) {
        [this.queue[idx], this.queue[j]] = [this.queue[j], this.queue[idx]];
        return;
      }
    }
  }

  public moveTrackByIndex(index: number, direction: 'up' | 'down') {
    this.compact();
    if (!Number.isInteger(index) || index < 0 || index >= this.queue.length) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= this.queue.length) return;
    [this.queue[index], this.queue[target]] = [this.queue[target], this.queue[index]];
  }

  private async startNext(): Promise<void> {
    if (this.starting || this.activeProcess !== null || this.blocked) return;
    this.clearTimer();
    this.compact();

    const item = this.queue.shift();
    if (!item) {
      this.currentDownload = null;
      this.status = 'idle';
      this.errorCode = null;
      return;
    }

    this.starting = true;
    this.cancelRequested = false;
    this.currentDownload = item;
    this.status = 'downloading';
    this.errorCode = null;
    this.addLog(`[INFO] Starting download for: ${item.track.name} by ${item.track.artist}`);

    try {
      await this.launch(item);
    } catch (err) {
      this.addLog(`[ERROR] ${err instanceof Error ? err.message : String(err)}`);
      this.activeProcess = null;
      this.armForceFinish = null;
      this.completeRun(item, this.cancelRequested ? 'CANCELLED' : 'UNEXPECTED');
    } finally {
      this.starting = false;
    }
  }

  private async launch(item: QueueItem): Promise<void> {
    const py = await resolvePython(this.forcePythonRefresh);
    this.forcePythonRefresh = false;

    if (this.cancelRequested) {
      this.completeRun(item, 'CANCELLED');
      return;
    }
    if (!py.ok) {
      this.addLog(`[ERROR] ${py.detail}`);
      this.completeRun(item, py.problem);
      return;
    }

    let cwd: string;
    try {
      cwd = ensureDownloadDir();
    } catch (err) {
      this.addLog(`[ERROR] Cannot use download folder: ${err instanceof Error ? err.message : String(err)}`);
      this.completeRun(item, 'DOWNLOAD_DIR_ERROR');
      return;
    }

    const folder = sanitizeFolderName(item.playlistName);
    const folderPath = path.join(cwd, folder);
    const startedAt = Date.now();

    const proc = spawn(
      py.command,
      [
        ...py.prefixArgs,
        '-m',
        'spotdl',
        item.track.url,
        '--output',
        `${folder}/{title} - {artist}.{output-ext}`,
        '--format',
        'mp3',
      ],
      {
        cwd,
        env: pythonEnv(),
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: process.platform !== 'win32',
      }
    );
    this.activeProcess = proc;

    let finished = false;
    let timedOut = false;
    let norm = '';
    let sawSuccess = false;
    let watchdog: NodeJS.Timeout | null = null;
    let fallback: NodeJS.Timeout | null = null;
    const armWatchdog = () => {
      if (finished || timedOut) return;
      if (watchdog) clearTimeout(watchdog);
      watchdog = setTimeout(() => {
        watchdog = null;
        if (finished) return;
        timedOut = true;
        this.addLog(`[ERROR] No output from spotDL for ${Math.round(stallMs() / 1000)} seconds; stopping it`);
        this.killTree(proc);
        armForce();
      }, stallMs());
    };
    // After a kill, do not wait forever for pipes that may never close.
    const armForce = () => {
      if (finished || fallback) return;
      fallback = setTimeout(() => finish(null, undefined, true), KILL_GRACE_MS);
    };
    this.armForceFinish = armForce;
    const finish = (exitCode: number | null, spawnError?: Error, forced = false) => {
      if (finished) return;
      finished = true;
      if (watchdog) clearTimeout(watchdog);
      if (fallback) clearTimeout(fallback);
      flushAll();
      if (forced) {
        // The child may still be alive and holding the pipes: cut them so late output cannot
        // leak into later runs, and remember the pid so the exit hook can still kill it.
        const pid = proc.pid;
        for (const stream of [proc.stdout, proc.stderr]) {
          if (!stream) continue;
          stream.removeAllListeners('data');
          stream.on('error', () => {});
          stream.destroy();
        }
        if (pid !== undefined && proc.exitCode === null && proc.signalCode === null) {
          this.orphans.add(pid);
          proc.once('exit', () => this.orphans.delete(pid));
          try {
            proc.kill();
          } catch {
            // already gone
          }
        }
      }
      this.activeProcess = null;
      this.armForceFinish = null;

      if (spawnError) {
        this.addLog(`[ERROR] Failed to start spotDL: ${spawnError.message}`);
        this.forcePythonRefresh = true;
        this.completeRun(item, 'PYTHON_MISSING');
        return;
      }
      const seen = classify(stripOwnNames(norm, item.track));
      let code: MessageCode | null;
      if (this.cancelRequested) code = 'CANCELLED';
      else if (timedOut) code = 'TIMEOUT';
      else if (exitCode === 0) {
        // Truth comes from a success line or a fresh file, not from the absence of error words.
        code = sawSuccess || hasFreshMp3(folderPath, startedAt) ? null : (seen ?? 'UNEXPECTED');
      } else code = seen ?? 'UNEXPECTED';

      if (code === null) this.addLog('[DONE] Successfully downloaded track');
      else if (code !== 'CANCELLED') this.addLog(`[ERROR] Download failed (${code}, exit code ${exitCode})`);
      this.completeRun(item, code);
    };

    const makeReader = () => {
      const decoder = new StringDecoder('utf8');
      let partial = '';
      const emit = (line: string) => {
        const clean = line.replace(ANSI, '').trimEnd();
        if (clean.trim() === '') return;
        this.addLog(clean.length > MAX_LINE ? clean.slice(0, MAX_LINE) : clean);
        if (!sawSuccess && SUCCESS_MARKERS.some((m) => m.test(clean))) sawSuccess = true;
        if (norm.length < MAX_CLASSIFY_CHARS) norm += normalise(clean);
      };
      return {
        push: (chunk: Buffer) => {
          armWatchdog();
          partial += decoder.write(chunk);
          const parts = partial.split(/\r\n|\n|\r/);
          partial = parts.pop() ?? '';
          parts.forEach(emit);
        },
        flush: () => {
          partial += decoder.end();
          if (partial !== '') emit(partial);
          partial = '';
        },
      };
    };
    const out = makeReader();
    const err = makeReader();
    const flushAll = () => {
      out.flush();
      err.flush();
    };

    armWatchdog();
    proc.stdout?.on('data', out.push);
    proc.stderr?.on('data', err.push);
    proc.on('error', (e) => finish(null, e));
    proc.on('close', (code) => finish(code));
  }

  // Records the result of one run exactly once and decides what happens next.
  private completeRun(item: QueueItem, code: MessageCode | null) {
    this.currentDownload = null;

    if (code === 'CANCELLED') {
      // A cancel is the user's choice: not a failure, not an error state.
      this.errorCode = null;
      if (this.queue.length > 0) {
        this.status = 'downloading';
        this.scheduleNext(GAP_MS);
      } else {
        this.clearTimer();
        this.status = 'idle';
      }
      return;
    }

    if (code !== null && GLOBAL_CODES.has(code)) {
      this.queue.unshift(item);
      this.blocked = true;
      this.status = 'error';
      this.errorCode = code;
      this.clearTimer();
      return;
    }

    if (code === null) {
      this.completedCount++;
      this.status = 'success';
      this.errorCode = null;
    } else {
      this.status = 'error';
      this.errorCode = code;
      this.failed.push({
        name: item.track.name,
        artist: item.track.artist,
        playlistName: item.playlistName,
        errorCode: code,
      });
      if (this.failed.length > MAX_QUEUE) this.failed.splice(0, this.failed.length - MAX_QUEUE);
    }
    this.scheduleNext(GAP_MS);
  }
}

// Synchronous, because it also runs inside process 'exit' where nothing async can finish.
function killActiveTreeSync(mgr: QueueManager) {
  const pids = new Set<number>(mgr.orphanPids());
  const active = mgr.activePid();
  if (active !== undefined) pids.add(active);
  for (const pid of pids) {
    try {
      if (process.platform === 'win32') {
        spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true });
      } else {
        process.kill(-pid, 'SIGKILL');
      }
    } catch {
      // already gone
    }
  }
}

// Keep one instance across hot reloads and route bundles, in every environment.
const globalForQueueManager = globalThis as unknown as {
  queueManager: QueueManager | undefined;
};

export const queueManager = globalForQueueManager.queueManager ?? new QueueManager();
globalForQueueManager.queueManager = queueManager;

// Registered once per process (not per hot reload) so a stopped app leaves no orphan download.
const cleanupFlag = globalThis as unknown as { __ypuExitHook?: boolean };
if (!cleanupFlag.__ypuExitHook) {
  cleanupFlag.__ypuExitHook = true;
  process.on('exit', () => killActiveTreeSync(queueManager));
  // Next already exits on SIGINT/SIGTERM (which fires 'exit' above), but not on SIGHUP
  // (terminal closed). Without this, SIGHUP would kill the server with no cleanup at all.
  const signals: Array<[NodeJS.Signals, number]> = [['SIGHUP', 129]];
  if (process.env.NEXT_MANUAL_SIG_HANDLE) signals.push(['SIGINT', 130], ['SIGTERM', 143]);
  for (const [sig, exitCode] of signals) process.on(sig, () => process.exit(exitCode));
}
