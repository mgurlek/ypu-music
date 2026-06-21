'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Download, Music, Search, Library, Home, Loader2, CheckCircle2, XCircle, X, ChevronDown, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';

type Track = {
  id: string;
  url: string;
  name: string;
  artist: string;
};

type PlaylistGroup = {
  id: string;
  name: string;
  tracks: Track[];
  isExpanded: boolean;
};

type CurrentDownload = {
  track: Track;
  playlistName: string;
};

type QueueItem = CurrentDownload;

export default function SpotifyDownloader() {
  const [url, setUrl] = useState('');
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  
  // Queue state
  const [queue, setQueue] = useState<PlaylistGroup[]>([]);
  const [currentDownload, setCurrentDownload] = useState<CurrentDownload | null>(null);
  
  // Download state
  const [status, setStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [downloadedPlaylists, setDownloadedPlaylists] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<'home' | 'library' | 'playlist'>('home');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<string[]>([]);

  // Polling Queue from Backend
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/queue');
        const data = await res.json();
        
        setCurrentDownload(data.currentDownload);
        setStatus(data.status);
        setLogs(data.logs);
        setErrorDetails(data.errorDetails);
        
        setQueue(prev => {
          const groups: Record<string, Track[]> = {};
          data.queue.forEach((item: QueueItem) => {
            if (!groups[item.playlistName]) groups[item.playlistName] = [];
            groups[item.playlistName].push(item.track);
          });
          
          return Object.keys(groups).map(name => {
            const existing = prev.find(p => p.name === name);
            return {
              id: existing ? existing.id : name,
              name,
              tracks: groups[name],
              isExpanded: existing ? existing.isExpanded : true
            };
          });
        });
      } catch (e) {}
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const openPlaylist = async (name: string) => {
    setSelectedPlaylist(name);
    setCurrentView('playlist');
    try {
      const res = await fetch(`/api/playlist?name=${encodeURIComponent(name)}`);
      const data = await res.json();
      if (data.success) {
        setPlaylistTracks(data.tracks);
      }
    } catch (e) {}
  };

  const fetchLibrary = async () => {
    try {
      const res = await fetch('/api/library');
      const data = await res.json();
      if (data.success) {
        setDownloadedPlaylists(data.playlists);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  useEffect(() => {
    if (status === 'success') {
      fetchLibrary();
    }
  }, [status]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleAddToQueue = async () => {
    if (!url) return;
    
    setIsFetchingMetadata(true);
    try {
      const res = await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      
      if (data.success && data.tracks && data.tracks.length > 0) {
        await fetch('/api/queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tracks: data.tracks, playlistName: data.playlistName })
        });
        setUrl('');
      } else {
        alert(data.error || 'No tracks found for this URL.');
      }
    } catch (err: any) {
      alert(`Error fetching metadata: ${err.message}`);
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const removeTrack = async (playlistId: string, trackId: string) => {
    await fetch(`/api/queue?action=remove&trackId=${trackId}`, { method: 'DELETE' });
  };

  const moveTrack = async (playlistId: string, trackId: string, direction: 'up' | 'down') => {
    const res = await fetch('/api/queue');
    const data = await res.json();
    const idx = data.queue.findIndex((i: QueueItem) => i.track.id === trackId);
    if (idx !== -1) {
      await fetch('/api/queue', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'move', index: idx, direction }) 
      });
    }
  };

  const toggleExpand = (playlistId: string) => {
    setQueue(prev => prev.map(p => p.id === playlistId ? { ...p, isExpanded: !p.isExpanded } : p));
  };

  const handleCancelCurrent = async () => {
    await fetch('/api/queue?action=cancelCurrent', { method: 'DELETE' });
  };

  const totalRemainingTracks = queue.reduce((acc, p) => acc + p.tracks.length, 0);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <Music size={32} color="#1ed760" />
          <span>YPU Music</span>
        </div>
        
        <div className="sidebar-nav">
          <div 
            className={`sidebar-item ${currentView === 'home' ? 'active' : ''}`} 
            onClick={() => setCurrentView('home')}
          >
            <Home size={24} />
            <span>Home</span>
          </div>
          <div 
            className={`sidebar-item ${currentView === 'library' || currentView === 'playlist' ? 'active' : ''}`} 
            onClick={() => setCurrentView('library')}
          >
            <Library size={24} />
            <span>Your Library</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content" style={currentView === 'playlist' ? { padding: 0 } : {}}>
        {currentView === 'home' ? (
          <>
            <div className="header">
              <h1>Download Playlist</h1>
              <p>Paste a Spotify playlist link to fetch its songs and add them to your queue.</p>
            </div>

            <div className="download-card">
          <div className="input-group">
            <label className="input-label" htmlFor="playlist-url">
              Spotify Playlist/Track URL
            </label>
            <input
              id="playlist-url"
              className="url-input"
              type="text"
              placeholder="https://open.spotify.com/playlist/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddToQueue();
                }
              }}
              disabled={isFetchingMetadata}
            />
          </div>

          <div className="btn-group">
            <button 
              className="download-btn" 
              onClick={handleAddToQueue}
              disabled={!url || isFetchingMetadata}
            >
              {isFetchingMetadata ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Fetching Songs...
                </>
              ) : (
                <>
                  <Plus size={20} />
                  Add to Queue
                </>
              )}
            </button>
          </div>

          {currentDownload && (
            <div className="status-panel">
              <div className="status-label">Now Downloading</div>
              <div className="status-info">
                <Loader2 size={32} className="animate-spin" color="var(--accent-primary)" />
                <div className="status-text">
                  <div className="status-track-name">{currentDownload.track.name}</div>
                  <div className="status-artist">{currentDownload.track.artist} (to {currentDownload.playlistName})</div>
                </div>
              </div>
              <div className="status-meta">
                {totalRemainingTracks} songs remaining in queue
              </div>
            </div>
          )}

          {currentDownload && status !== 'idle' && (
            <div className={`status-indicator ${status}`}>
              {status === 'success' && <><CheckCircle2 size={18} /> İşlem başarıyla tamamlandı.</>}
              {status === 'error' && <><XCircle size={18} /> İndirme sırasında hata oluştu.</>}
            </div>
          )}

          {status === 'error' && errorDetails && (
            <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'rgba(255, 60, 60, 0.1)', border: '1px solid rgba(255, 60, 60, 0.3)', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <XCircle size={20} color="#ff4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 600, color: '#ff4444', marginBottom: '4px' }}>Bir Sorun Oluştu</div>
                <div style={{ fontSize: '14px', color: 'var(--text-base)' }}>{errorDetails}</div>
              </div>
            </div>
          )}
        </div>

        {/* Logs */}
        {logs.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <button 
              onClick={() => setShowLogs(!showLogs)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'var(--text-subdued)', cursor: 'pointer', fontSize: '14px', padding: '8px 0' }}
            >
              {showLogs ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              Terminal Çıktılarını {showLogs ? 'Gizle' : 'Göster'}
            </button>
            
            {showLogs && (
              <div className="logs-container" style={{ marginTop: '8px' }}>
                {logs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`log-line ${log.includes('[ERROR]') || log.includes('error') ? 'error' : ''} ${log.includes('Downloaded') ? 'success' : ''}`}
                  >
                    {log}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        )}
          </>
        ) : currentView === 'library' ? (
          <div className="library-view">
            <div className="header" style={{ padding: '32px' }}>
              <h1>Your Library</h1>
            </div>
            <div className="library-grid">
              {downloadedPlaylists.map(playlist => (
                <div 
                  key={playlist} 
                  className="library-card"
                  onClick={() => openPlaylist(playlist)}
                >
                  <div className="library-card-cover">
                    <Music size={48} color="var(--text-subdued)" />
                  </div>
                  <div className="library-card-title">{playlist}</div>
                  <div className="library-card-subtitle">Playlist</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="playlist-view">
            <div className="playlist-header-large">
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Playlist</div>
              <h1 className="playlist-title-large">{selectedPlaylist}</h1>
              <p className="playlist-meta">{playlistTracks.length} songs</p>
            </div>
            <div className="track-table-container">
              <table className="track-table">
                <thead>
                  <tr>
                    <th style={{ width: '48px', textAlign: 'center' }}>#</th>
                    <th>Title</th>
                  </tr>
                </thead>
                <tbody>
                  {playlistTracks.map((track, i) => (
                    <tr key={i} className="track-row">
                      <td className="track-index" style={{ textAlign: 'center' }}>{i + 1}</td>
                      <td className="track-title">{track}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Queue */}
      <div className="right-sidebar">
        <h2>Sıradakiler</h2>
        
        <div className="queue-section">
          <div className="queue-section-title">Now Downloading</div>
          {currentDownload ? (
            <div className="queue-list">
              <div className="queue-item active">
                <div className="queue-item-content">
                  <Loader2 size={16} className="animate-spin" color="var(--accent-primary)" />
                  <div className="queue-item-info">
                    <span className="queue-item-title">{currentDownload.track.name}</span>
                    <span className="queue-item-subtitle">{currentDownload.track.artist}</span>
                  </div>
                </div>
                <button className="queue-item-action danger" onClick={handleCancelCurrent} title="Cancel Download">
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">No active downloads.</div>
          )}
        </div>

        <div className="queue-section">
          <div className="queue-section-title">Next in Queue ({totalRemainingTracks})</div>
          {queue.length > 0 ? (
            <div className="queue-list">
              {queue.map(playlist => (
                <div key={playlist.id} className="playlist-group">
                  <div className="playlist-header" onClick={() => toggleExpand(playlist.id)}>
                    {playlist.isExpanded ? <ChevronDown size={18} color="var(--text-subdued)" /> : <ChevronRight size={18} color="var(--text-subdued)" />}
                    <span className="playlist-title">{playlist.name}</span>
                    <span className="playlist-count">{playlist.tracks.length}</span>
                    <button 
                      className="queue-item-action danger" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setQueue(prev => prev.filter(p => p.id !== playlist.id));
                      }} 
                      title="Remove entire playlist"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  {playlist.isExpanded && (
                    <div className="queue-items-container">
                      {playlist.tracks.map((track, index) => (
                        <div className="queue-item" key={`${track.id}-${index}`}>
                          <div className="queue-item-content">
                            <div className="queue-item-index">{index + 1}</div>
                            <div className="queue-item-info">
                              <span className="queue-item-title">{track.name}</span>
                              <span className="queue-item-subtitle">{track.artist}</span>
                            </div>
                          </div>
                          <div className="queue-item-controls">
                            <button 
                              className="queue-item-action" 
                              onClick={() => moveTrack(playlist.id, track.id, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button 
                              className="queue-item-action" 
                              onClick={() => moveTrack(playlist.id, track.id, 'down')}
                              disabled={index === playlist.tracks.length - 1}
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button className="queue-item-action danger" onClick={() => removeTrack(playlist.id, track.id)} title="Remove track">
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">Queue is empty.</div>
          )}
        </div>
      </div>

    </div>
  );
}
