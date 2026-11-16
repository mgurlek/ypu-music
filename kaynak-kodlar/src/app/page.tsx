'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Plus, Music, Library, Home, Loader2, CheckCircle2, XCircle, X, ChevronDown, ChevronRight, ArrowUp, ArrowDown, ArrowLeft, Copy, Check, AlertTriangle } from 'lucide-react';
import { detectLang, t, type Key, type Lang, type Params } from '@/lib/i18n';

type Track = {
  id: string;
  url: string;
  name: string;
  artist: string;
};

type QueueItem = {
  track: Track;
  playlistName: string;
};

type FailedTrack = {
  name: string;
  artist: string;
  playlistName: string;
  errorCode: string;
  errorDetails: string;
};

type Status = 'idle' | 'downloading' | 'success' | 'error';

type QueueState = {
  queue: QueueItem[];
  currentDownload: QueueItem | null;
  status: Status;
  logs: string[];
  errorDetails: string | null;
  blocked: boolean;
  downloadDir: string;
  completedCount: number;
  failed: FailedTrack[];
};

type PlaylistGroup = {
  name: string;
  tracks: Track[];
};

type View = 'home' | 'library' | 'playlist';

const EMPTY_STATE: QueueState = {
  queue: [],
  currentDownload: null,
  status: 'idle',
  logs: [],
  errorDetails: null,
  blocked: false,
  downloadDir: '',
  completedCount: 0,
  failed: [],
};

const POLL_MS = 1000;
const UNREACHABLE_AFTER = 3;

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function parseTrack(x: unknown): Track | null {
  if (!isRecord(x)) return null;
  if (typeof x.id !== 'string' || typeof x.name !== 'string' || typeof x.artist !== 'string' || typeof x.url !== 'string') return null;
  return { id: x.id, name: x.name, artist: x.artist, url: x.url };
}

function parseQueueItem(x: unknown): QueueItem | null {
  if (!isRecord(x) || typeof x.playlistName !== 'string') return null;
  const track = parseTrack(x.track);
  return track ? { track, playlistName: x.playlistName } : null;
}

function parseFailed(x: unknown): FailedTrack | null {
  if (!isRecord(x)) return null;
  return {
    name: typeof x.name === 'string' ? x.name : '',
    artist: typeof x.artist === 'string' ? x.artist : '',
    playlistName: typeof x.playlistName === 'string' ? x.playlistName : '',
    errorCode: typeof x.errorCode === 'string' ? x.errorCode : '',
    errorDetails: typeof x.errorDetails === 'string' ? x.errorDetails : '',
  };
}

function parseQueueState(x: unknown): QueueState | null {
  if (!isRecord(x) || !Array.isArray(x.queue)) return null;
  const status: Status = x.status === 'downloading' || x.status === 'success' || x.status === 'error' ? x.status : 'idle';
  const failed = Array.isArray(x.failed) ? x.failed.map(parseFailed).filter((f): f is FailedTrack => f !== null) : [];
  return {
    queue: x.queue.map(parseQueueItem).filter((i): i is QueueItem => i !== null),
    currentDownload: parseQueueItem(x.currentDownload),
    status,
    logs: Array.isArray(x.logs) ? x.logs.filter((l): l is string => typeof l === 'string') : [],
    errorDetails: typeof x.errorDetails === 'string' ? x.errorDetails : null,
    blocked: x.blocked === true,
    downloadDir: typeof x.downloadDir === 'string' ? x.downloadDir : '',
    completedCount: typeof x.completedCount === 'number' ? x.completedCount : 0,
    failed,
  };
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function serverError(data: unknown): string | null {
  return isRecord(data) && typeof data.error === 'string' && data.error !== '' ? data.error : null;
}

const noopSubscribe = () => () => {};

function useLang(): Lang {
  // The server render has no navigator, so it renders English; the client switches without a hydration mismatch.
  return useSyncExternalStore(noopSubscribe, detectLang, () => 'en');
}

export default function SpotifyDownloader() {
  const lang = useLang();
  const tt = useCallback((key: Key, params?: Params) => t(lang, key, params), [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const [url, setUrl] = useState('');
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addInfo, setAddInfo] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [state, setState] = useState<QueueState>(EMPTY_STATE);
  const [unreachable, setUnreachable] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmStop, setConfirmStop] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const [showLogs, setShowLogs] = useState(false);
  const logsBoxRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const [downloadedPlaylists, setDownloadedPlaylists] = useState<string[]>([]);
  const [libraryDir, setLibraryDir] = useState('');
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<string[]>([]);
  const [playlistState, setPlaylistState] = useState<'loading' | 'ready' | 'error'>('loading');
  const playlistRequestRef = useRef(0);

  const refreshRef = useRef<(() => Promise<void>) | null>(null);

  // Polling the queue from the backend, plus refreshing the library when something finished.
  useEffect(() => {
    let alive = true;
    let inFlight = false;
    let failures = 0;
    let seq = 0;
    let prevStatus: Status = 'idle';
    let prevActive = false;

    const loadLibrary = async () => {
      try {
        const res = await fetch('/api/library', { cache: 'no-store' });
        const data = await readJson(res);
        if (!alive || !res.ok || !isRecord(data) || data.success !== true || !Array.isArray(data.playlists)) return;
        setDownloadedPlaylists(data.playlists.filter((p): p is string => typeof p === 'string'));
        if (typeof data.downloadDir === 'string') setLibraryDir(data.downloadDir);
      } catch {
        // The queue poll reports connection problems.
      }
    };

    const poll = async () => {
      if (inFlight) return;
      inFlight = true;
      const mine = ++seq;
      try {
        const res = await fetch('/api/queue', { cache: 'no-store' });
        const parsed = res.ok ? parseQueueState(await readJson(res)) : null;
        if (!alive || mine !== seq) return;
        if (!parsed) {
          failures += 1;
          if (failures >= UNREACHABLE_AFTER) setUnreachable(true);
          return;
        }
        failures = 0;
        setUnreachable(false);
        setState(parsed);

        const active = parsed.queue.length > 0 || parsed.currentDownload !== null || parsed.status === 'downloading';
        const justSucceeded = parsed.status === 'success' && prevStatus !== 'success';
        const runEnded = prevActive && !active && parsed.status === 'idle';
        prevStatus = parsed.status;
        prevActive = active;
        if (justSucceeded || runEnded) void loadLibrary();
      } catch {
        if (!alive || mine !== seq) return;
        failures += 1;
        if (failures >= UNREACHABLE_AFTER) setUnreachable(true);
      } finally {
        inFlight = false;
      }
    };

    refreshRef.current = poll;
    void poll();
    void loadLibrary();
    const interval = setInterval(() => void poll(), POLL_MS);
    return () => {
      alive = false;
      refreshRef.current = null;
      clearInterval(interval);
    };
  }, []);

  // Keep the log scrolled to the bottom only while the user is already at the bottom.
  useEffect(() => {
    const el = logsBoxRef.current;
    if (el && stickToBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [state.logs, showLogs]);

  const onLogsScroll = () => {
    const el = logsBoxRef.current;
    if (el) stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
  };

  const groups = useMemo<PlaylistGroup[]>(() => {
    const map = new Map<string, Track[]>();
    for (const item of state.queue) {
      const list = map.get(item.playlistName);
      if (list) list.push(item.track);
      else map.set(item.playlistName, [item.track]);
    }
    return Array.from(map, ([name, tracks]) => ({ name, tracks }));
  }, [state.queue]);

  const { currentDownload, status, blocked, downloadDir, completedCount, failed } = state;
  const totalRemainingTracks = state.queue.length;
  const hasActive = totalRemainingTracks > 0 || currentDownload !== null;
  const showSummary = status === 'idle' && !hasActive && completedCount + failed.length > 0;
  const showStop = hasActive || blocked;
  const showConfirmStop = confirmStop && showStop;
  const folder = downloadDir || libraryDir;

  const openPlaylist = async (name: string) => {
    const mine = ++playlistRequestRef.current;
    setSelectedPlaylist(name);
    setPlaylistTracks([]);
    setPlaylistState('loading');
    setCurrentView('playlist');
    try {
      const res = await fetch(`/api/playlist?name=${encodeURIComponent(name)}`, { cache: 'no-store' });
      const data = await readJson(res);
      if (mine !== playlistRequestRef.current) return;
      if (res.ok && isRecord(data) && data.success === true && Array.isArray(data.tracks)) {
        setPlaylistTracks(data.tracks.filter((x): x is string => typeof x === 'string'));
        setPlaylistState('ready');
      } else {
        setPlaylistState('error');
      }
    } catch {
      if (mine === playlistRequestRef.current) setPlaylistState('error');
    }
  };

  const handleAddToQueue = async () => {
    const link = url.trim();
    if (!link || isFetchingMetadata) return;

    setAddError(null);
    setAddInfo(null);
    const controller = new AbortController();
    abortRef.current = controller;
    setIsFetchingMetadata(true);
    try {
      const res = await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: link }),
        signal: controller.signal,
      });
      const data = await readJson(res);
      if (!res.ok || !isRecord(data) || data.success !== true) {
        setAddError(serverError(data) ?? tt('errUnknown'));
        return;
      }
      if (!Array.isArray(data.tracks) || typeof data.playlistName !== 'string') {
        setAddError(tt('errBadResponse'));
        return;
      }
      const tracks = data.tracks.map(parseTrack).filter((x): x is Track => x !== null);
      if (tracks.length === 0) {
        setAddError(tt('errNoTracks'));
        return;
      }
      const playlistName = data.playlistName;

      const qres = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracks, playlistName }),
        signal: controller.signal,
      });
      if (!qres.ok) {
        setAddError(serverError(await readJson(qres)) ?? tt('errUnknown'));
        return;
      }
      setUrl('');
      setAddInfo(tt('addedToQueue', { n: tracks.length, name: playlistName }));
      void refreshRef.current?.();
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setAddInfo(tt('fetchCancelled'));
      } else {
        setAddError(tt('errNetwork'));
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setIsFetchingMetadata(false);
    }
  };

  const cancelFetch = () => {
    abortRef.current?.abort();
  };

  // One helper for every queue command; shows the server's message inline when it fails.
  const sendCommand = async (method: 'POST' | 'DELETE', target: string, body?: Record<string, unknown>) => {
    setActionError(null);
    try {
      const res = await fetch(target, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        setActionError(serverError(await readJson(res)) ?? tt('actionFailed'));
      }
    } catch {
      setActionError(tt('errNetwork'));
    }
    void refreshRef.current?.();
  };

  const queueUrl = (action: string, extra?: Record<string, string>) => {
    const p = new URLSearchParams({ action, ...extra });
    return `/api/queue?${p.toString()}`;
  };

  const removeTrack = (playlistName: string, trackId: string) =>
    sendCommand('DELETE', queueUrl('remove', { trackId, playlistName }));
  const removePlaylist = (playlistName: string) =>
    sendCommand('DELETE', queueUrl('removePlaylist', { playlistName }));
  const moveTrack = (playlistName: string, trackId: string, direction: 'up' | 'down') =>
    sendCommand('POST', '/api/queue', { action: 'move', trackId, playlistName, direction });
  const handleCancelCurrent = () => sendCommand('DELETE', queueUrl('cancelCurrent'));
  const handleRetry = () => sendCommand('POST', '/api/queue', { action: 'retry' });
  const handleStopAll = async () => {
    setConfirmStop(false);
    await sendCommand('DELETE', queueUrl('stopAll'));
  };

  const toggleExpand = (name: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const copyFolder = async () => {
    try {
      await navigator.clipboard.writeText(folder);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The path is selectable text, so the user can still copy it by hand.
    }
  };

  const stopControls = showStop && (
    <div className="stop-area">
      {showConfirmStop ? (
        <div className="stop-confirm" role="group" aria-label={tt('stopAll')}>
          <span>{tt('stopAllAsk')}</span>
          <button type="button" className="btn-danger" onClick={handleStopAll}>{tt('stopAllYes')}</button>
          <button type="button" className="btn-secondary" onClick={() => setConfirmStop(false)}>{tt('stopAllNo')}</button>
        </div>
      ) : (
        <button type="button" className="btn-secondary btn-stop" onClick={() => setConfirmStop(true)}>
          <XCircle size={16} aria-hidden="true" />
          {tt('stopAll')}
        </button>
      )}
    </div>
  );

  const folderBox = (
    <div className="folder-box">
      <div className="folder-title">{tt('folderTitle')}</div>
      <div className="folder-row">
        <code className="folder-path">{folder || '...'}</code>
        {folder && (
          <button type="button" className="btn-secondary" onClick={copyFolder} aria-label={tt('folderCopyLabel')}>
            {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            <span role="status">{copied ? tt('folderCopied') : tt('folderCopy')}</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <Music size={32} color="#1ed760" aria-hidden="true" />
          <span>{tt('appName')}</span>
        </div>

        <nav className="sidebar-nav" aria-label={tt('navLabel')}>
          <button
            type="button"
            className={`sidebar-item ${currentView === 'home' ? 'active' : ''}`}
            aria-current={currentView === 'home' ? 'page' : undefined}
            onClick={() => setCurrentView('home')}
          >
            <Home size={24} aria-hidden="true" />
            <span>{tt('navHome')}</span>
          </button>
          <button
            type="button"
            className={`sidebar-item ${currentView === 'library' || currentView === 'playlist' ? 'active' : ''}`}
            aria-current={currentView === 'library' || currentView === 'playlist' ? 'page' : undefined}
            onClick={() => setCurrentView('library')}
          >
            <Library size={24} aria-hidden="true" />
            <span>{tt('navLibrary')}</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${currentView === 'playlist' ? 'flush' : ''}`}>
        {unreachable && (
          <div className="banner banner-error banner-top" role="alert">
            <AlertTriangle size={20} aria-hidden="true" className="banner-icon" />
            <div>{tt('unreachable')}</div>
          </div>
        )}

        {blocked && (
          <div className="banner banner-error" role="alert">
            <AlertTriangle size={20} aria-hidden="true" className="banner-icon" />
            <div className="banner-body">
              <div className="banner-title">{tt('blockedTitle')}</div>
              <div className="banner-text">{state.errorDetails ?? tt('blockedFallback')}</div>
              <div className="banner-actions">
                <button type="button" className="btn-primary-small" onClick={handleRetry}>{tt('tryAgain')}</button>
                {stopControls}
              </div>
            </div>
          </div>
        )}

        {currentView === 'home' ? (
          <>
            <div className="header">
              <h1>{tt('homeTitle')}</h1>
              <p>{tt('homeSubtitle')}</p>
            </div>

            <div className="download-card">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleAddToQueue();
                }}
              >
                <div className="input-group">
                  <label className="input-label" htmlFor="playlist-url">
                    {tt('urlLabel')}
                  </label>
                  <input
                    id="playlist-url"
                    className="url-input"
                    type="text"
                    inputMode="url"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={tt('urlPlaceholder')}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isFetchingMetadata}
                    aria-describedby="add-feedback"
                    aria-invalid={addError ? true : undefined}
                  />
                </div>

                <div className="btn-group">
                  <button type="submit" className="download-btn" disabled={!url.trim() || isFetchingMetadata}>
                    {isFetchingMetadata ? (
                      <>
                        <Loader2 size={20} className="animate-spin" aria-hidden="true" />
                        {tt('fetchingButton')}
                      </>
                    ) : (
                      <>
                        <Plus size={20} aria-hidden="true" />
                        {tt('addToQueue')}
                      </>
                    )}
                  </button>
                  {isFetchingMetadata && (
                    <button type="button" className="btn-secondary" onClick={cancelFetch}>{tt('cancelFetch')}</button>
                  )}
                </div>
              </form>

              <div id="add-feedback" className="add-feedback" aria-live="polite">
                {isFetchingMetadata && <p className="feedback-progress">{tt('fetchingHint')}</p>}
                {addError && <p className="feedback-error" role="alert">{addError}</p>}
                {addInfo && !addError && !isFetchingMetadata && <p className="feedback-info">{addInfo}</p>}
              </div>

              {folderBox}

              {currentDownload && (
                <div className="status-panel">
                  <div className="status-label">{tt('nowDownloading')}</div>
                  <div className="status-info">
                    <Loader2 size={32} className="animate-spin" color="var(--accent-primary)" aria-hidden="true" />
                    <div className="status-text">
                      <div className="status-track-name">{currentDownload.track.name}</div>
                      <div className="status-artist">
                        {currentDownload.track.artist} ({tt('toPlaylist', { name: currentDownload.playlistName })})
                      </div>
                    </div>
                  </div>
                  <div className="status-meta">{tt('songsRemaining', { n: totalRemainingTracks })}</div>
                </div>
              )}

              {!blocked && status === 'success' && (
                <div className="status-indicator success" role="status">
                  <CheckCircle2 size={18} aria-hidden="true" /> {tt('statusSuccess')}
                </div>
              )}
              {!blocked && status === 'error' && (
                <div className="banner banner-error" role="alert">
                  <XCircle size={20} aria-hidden="true" className="banner-icon" />
                  <div className="banner-body">
                    <div className="banner-title">{tt('errorTitle')}</div>
                    <div className="banner-text">{state.errorDetails ?? tt('statusError')}</div>
                  </div>
                </div>
              )}

              {showSummary && (
                <div className="summary-card">
                  <div className="summary-title">{tt('summaryTitle')}</div>
                  <div className="summary-counts">
                    {tt('summaryCounts', { done: completedCount, failed: failed.length })}
                  </div>
                  {failed.length === 0 ? (
                    <div className="summary-note">{tt('summaryAllGood')}</div>
                  ) : (
                    <>
                      <div className="summary-note">{tt('summaryFailedHeading')}</div>
                      <ul className="failed-list">
                        {failed.map((f, i) => (
                          <li key={`${f.name}-${i}`}>
                            <div className="failed-name">
                              {f.name}
                              {f.artist ? ` - ${f.artist}` : ''}
                            </div>
                            <div className="failed-reason">{f.errorDetails}</div>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Logs */}
            {state.logs.length > 0 && (
              <div className="logs-section">
                <button
                  type="button"
                  className="logs-toggle"
                  onClick={() => setShowLogs(!showLogs)}
                  aria-expanded={showLogs}
                >
                  {showLogs ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
                  {showLogs ? tt('logsHide') : tt('logsShow')}
                </button>

                {showLogs && (
                  <div
                    className="logs-container"
                    ref={logsBoxRef}
                    onScroll={onLogsScroll}
                    tabIndex={0}
                    role="log"
                    aria-label={tt('logsLabel')}
                  >
                    {state.logs.map((log, index) => (
                      <div
                        key={index}
                        className={`log-line ${log.includes('[ERROR]') || log.includes('error') ? 'error' : ''} ${log.startsWith('Downloaded "') || log.startsWith('[DONE]') ? 'success' : ''}`}
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : currentView === 'library' ? (
          <div className="library-view">
            <div className="header library-header">
              <h1>{tt('libraryTitle')}</h1>
              {folder && downloadedPlaylists.length > 0 && (
                <p>
                  {tt('librarySavedIn')}: <code className="folder-path inline">{folder}</code>
                </p>
              )}
            </div>
            {downloadedPlaylists.length === 0 ? (
              <div className="library-empty">
                <p>{tt('libraryEmpty')}</p>
                <p className="library-empty-where">{tt('libraryEmptyWhere')}</p>
                <code className="folder-path">{folder || '...'}</code>
              </div>
            ) : (
              <div className="library-grid">
                {downloadedPlaylists.map((playlist) => (
                  <button
                    type="button"
                    key={playlist}
                    className="library-card"
                    onClick={() => void openPlaylist(playlist)}
                  >
                    <span className="library-card-cover">
                      <Music size={48} color="var(--text-subdued)" aria-hidden="true" />
                    </span>
                    <span className="library-card-title">{playlist}</span>
                    <span className="library-card-subtitle">{tt('libraryKind')}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="playlist-view">
            <div className="playlist-header-large">
              <button type="button" className="back-btn" onClick={() => setCurrentView('library')}>
                <ArrowLeft size={16} aria-hidden="true" />
                {tt('backToLibrary')}
              </button>
              <div className="playlist-kind">{tt('libraryKind')}</div>
              <h1 className="playlist-title-large">{selectedPlaylist}</h1>
              <p className="playlist-meta">{tt('songCount', { n: playlistTracks.length })}</p>
            </div>
            <div className="track-table-container">
              {playlistState === 'loading' && <p className="empty-state" role="status">{tt('playlistLoading')}</p>}
              {playlistState === 'error' && <p className="empty-state" role="alert">{tt('playlistError')}</p>}
              {playlistState === 'ready' && playlistTracks.length === 0 && (
                <p className="empty-state">{tt('playlistEmpty')}</p>
              )}
              {playlistState === 'ready' && playlistTracks.length > 0 && (
                <table className="track-table">
                  <thead>
                    <tr>
                      <th scope="col" className="col-index">{tt('tableNumber')}</th>
                      <th scope="col">{tt('tableTitle')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playlistTracks.map((track, i) => (
                      <tr key={i} className="track-row">
                        <td className="track-index">{i + 1}</td>
                        <td className="track-title">{track}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Right Sidebar - Queue */}
      <aside className="right-sidebar" aria-label={tt('queueTitle')}>
        <h2>{tt('queueTitle')}</h2>

        {showStop && !(blocked && currentView === 'home') && stopControls}

        {actionError && <div className="banner banner-error banner-compact" role="alert">{actionError}</div>}

        <div className="queue-section">
          <h3 className="queue-section-title">{tt('queueNow')}</h3>
          {currentDownload ? (
            <div className="queue-list">
              <div className="queue-item active">
                <div className="queue-item-content">
                  <Loader2 size={16} className="animate-spin" color="var(--accent-primary)" aria-hidden="true" />
                  <div className="queue-item-info">
                    <span className="queue-item-title">{currentDownload.track.name}</span>
                    <span className="queue-item-subtitle">{currentDownload.track.artist}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="queue-item-action danger always"
                  onClick={handleCancelCurrent}
                  title={tt('cancelDownload')}
                  aria-label={tt('cancelDownload')}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">{tt('queueNone')}</div>
          )}
        </div>

        <div className="queue-section">
          <h3 className="queue-section-title">{tt('queueNext', { n: totalRemainingTracks })}</h3>
          {groups.length > 0 ? (
            <div className="queue-list">
              {groups.map((playlist) => {
                const isExpanded = !collapsed.has(playlist.name);
                return (
                  <div key={playlist.name} className="playlist-group">
                    <div className="playlist-header">
                      <button
                        type="button"
                        className="playlist-toggle"
                        onClick={() => toggleExpand(playlist.name)}
                        aria-expanded={isExpanded}
                        aria-label={tt('togglePlaylist', { name: playlist.name, n: playlist.tracks.length })}
                      >
                        {isExpanded ? <ChevronDown size={18} color="var(--text-subdued)" aria-hidden="true" /> : <ChevronRight size={18} color="var(--text-subdued)" aria-hidden="true" />}
                        <span className="playlist-title">{playlist.name}</span>
                        <span className="playlist-count">{playlist.tracks.length}</span>
                      </button>
                      <button
                        type="button"
                        className="queue-item-action danger always"
                        onClick={() => void removePlaylist(playlist.name)}
                        title={tt('removePlaylist', { name: playlist.name })}
                        aria-label={tt('removePlaylist', { name: playlist.name })}
                      >
                        <X size={16} aria-hidden="true" />
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="queue-items-container">
                        {playlist.tracks.map((track, index) => (
                          <div className="queue-item" key={`${playlist.name}:${track.id}`}>
                            <div className="queue-item-content">
                              <div className="queue-item-index">{index + 1}</div>
                              <div className="queue-item-info">
                                <span className="queue-item-title">{track.name}</span>
                                <span className="queue-item-subtitle">{track.artist}</span>
                              </div>
                            </div>
                            <div className="queue-item-controls">
                              <button
                                type="button"
                                className="queue-item-action"
                                onClick={() => void moveTrack(playlist.name, track.id, 'up')}
                                disabled={index === 0}
                                title={tt('moveUp', { name: track.name })}
                                aria-label={tt('moveUp', { name: track.name })}
                              >
                                <ArrowUp size={14} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                className="queue-item-action"
                                onClick={() => void moveTrack(playlist.name, track.id, 'down')}
                                disabled={index === playlist.tracks.length - 1}
                                title={tt('moveDown', { name: track.name })}
                                aria-label={tt('moveDown', { name: track.name })}
                              >
                                <ArrowDown size={14} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                className="queue-item-action danger"
                                onClick={() => void removeTrack(playlist.name, track.id)}
                                title={tt('removeTrack', { name: track.name })}
                                aria-label={tt('removeTrack', { name: track.name })}
                              >
                                <X size={16} aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">{tt('queueEmpty')}</div>
          )}
        </div>
      </aside>
    </div>
  );
}
