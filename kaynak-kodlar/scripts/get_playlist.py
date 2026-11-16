import sys

# Keep stdout clean: only one JSON line may ever reach the real stdout.
# Anything libraries print (rich, warnings, progress) is sent to stderr.
real_out = sys.stdout.buffer
sys.stdout = sys.stderr
try:
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

import json
import re
from urllib.parse import urlparse

ID_RE = re.compile(r'^[A-Za-z0-9]{1,40}$')
URI_RE = re.compile(r'^spotify:(track|playlist|album|artist|show|episode|user):([^:]+)$', re.I)
KINDS = ('track', 'playlist')


def emit(payload):
    line = json.dumps(payload, ensure_ascii=False)
    real_out.write((line + '\n').encode('utf-8'))
    real_out.flush()


def fail(code, error):
    emit({'success': False, 'code': code, 'error': str(error)[:300]})


def parse_url(raw):
    """Return (kind, canonical_url) or (code, message) on failure."""
    text = (raw or '').strip()
    if not text:
        return None, ('INVALID_URL', 'Empty URL')

    m = URI_RE.match(text)
    if m:
        kind, ident = m.group(1).lower(), m.group(2)
    else:
        try:
            u = urlparse(text)
        except ValueError:
            return None, ('INVALID_URL', 'Not a valid URL')
        if u.scheme not in ('http', 'https') or not u.netloc:
            return None, ('INVALID_URL', 'Not a valid URL')
        host = (u.hostname or '').lower()
        if host != 'open.spotify.com':
            return None, ('UNSUPPORTED_URL', 'Not an open.spotify.com link')
        parts = [p for p in u.path.split('/') if p]
        if parts and re.match(r'^intl-[a-z]{2,}(-[a-z]+)?$', parts[0], re.I):
            parts = parts[1:]
        if len(parts) < 2:
            return None, ('UNSUPPORTED_URL', 'Link has no track or playlist')
        kind, ident = parts[0].lower(), parts[1]

    if kind not in KINDS:
        return None, ('UNSUPPORTED_URL', 'Only track and playlist links are supported')
    if not ID_RE.match(ident):
        return None, ('INVALID_URL', 'Invalid Spotify id')
    return kind, 'https://open.spotify.com/%s/%s' % (kind, ident)


def map_error(exc):
    # Libraries often wrap the real network error; check the whole cause chain.
    seen = set()
    cur = exc
    while cur is not None and id(cur) not in seen:
        seen.add(id(cur))
        code = map_one(cur)
        if code != 'UNEXPECTED':
            return code
        cur = cur.__cause__ or cur.__context__
    return 'UNEXPECTED'


def map_one(exc):
    text = '%s: %s' % (type(exc).__name__, exc)
    low = text.lower()
    names = [c.__name__.lower() for c in type(exc).__mro__]
    mod = (type(exc).__module__ or '').lower()
    if 'not available or not accessible' in low or 'make sure it is public' in low:
        return 'PLAYLIST_NOT_PUBLIC'
    if isinstance(exc, KeyError) and exc.args and exc.args[0] == 'uri':
        return 'INVALID_URL'
    if 'nonetype' in low and 'subscriptable' in low:
        return 'INVALID_URL'
    if ('invalid url' in low or 'invalid id' in low or 'invalid base62' in low
            or 'unsupported' in low and 'url' in low):
        return 'INVALID_URL'
    if (isinstance(exc, (ConnectionError, TimeoutError, OSError)) and
            not isinstance(exc, (FileNotFoundError, PermissionError))
            or any(n in ('timeout', 'connectionerror', 'maxretryerror', 'gaierror',
                         'sslerror', 'proxyerror', 'readtimeout', 'connecttimeout')
                   for n in names)
            or mod.startswith(('requests', 'urllib3', 'socket'))
            or 'getaddrinfo' in low or 'failed to complete request' in low or 'requesterror' in low or 'max retries' in low or 'timed out' in low
            or 'connection' in low and ('refused' in low or 'reset' in low
                                        or 'aborted' in low or 'error' in low)
            or 'name resolution' in low):
        return 'NETWORK'
    return 'UNEXPECTED'


def fail_exc(exc):
    detail = '%s: %s' % (type(exc).__name__, exc)
    fail(map_error(exc), detail.replace('\n', ' '))


def track_dict(s):
    return {'id': s.song_id, 'name': s.name, 'artist': s.artist, 'url': s.url}


def main():
    if len(sys.argv) < 2:
        sys.stderr.write('Usage: get_playlist.py <spotify track or playlist url>\n')
        return 2

    kind, result = parse_url(sys.argv[1])
    if kind is None:
        fail(*result)
        return 0
    url = result

    try:
        from spotdl.types.playlist import Playlist
        from spotdl.types.song import Song
        from spotdl.utils.spotify import SpotifyClient
        SpotifyClient.init(client_id='', client_secret='', user_auth=False)

        if kind == 'playlist':
            p = Playlist.from_url(url, fetch_songs=False)
            tracks = [track_dict(t) for t in p.songs]
            name = p.name
        else:
            tracks = [track_dict(Song.from_url(url))]
            name = 'Single Track'
        emit({'success': True, 'playlistName': name, 'tracks': tracks, 'total': len(tracks)})
    except BaseException as exc:  # includes SystemExit raised by libraries
        if isinstance(exc, KeyboardInterrupt):
            raise
        fail_exc(exc)
    return 0


if __name__ == '__main__':
    sys.exit(main())
