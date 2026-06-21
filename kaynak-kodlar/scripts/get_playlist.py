import sys
import json
from spotdl.types.playlist import Playlist
from spotdl.types.song import Song
from spotdl.utils.spotify import SpotifyClient
import io

# Force stdout to be utf-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No URL provided"}))
        return
        
    url = sys.argv[1]
    
    try:
        SpotifyClient.init(client_id='', client_secret='', user_auth=False)
        
        if "playlist" in url:
            p = Playlist.from_url(url, fetch_songs=False)
            tracks = []
            for t in p.songs:
                tracks.append({
                    'id': t.song_id,
                    'name': t.name,
                    'artist': t.artist,
                    'url': t.url
                })
            print(json.dumps({"success": True, "playlistName": p.name, "tracks": tracks}, ensure_ascii=False))
            
        elif "track" in url:
            s = Song.from_url(url)
            tracks = [{
                'id': s.song_id,
                'name': s.name,
                'artist': s.artist,
                'url': s.url
            }]
            print(json.dumps({"success": True, "playlistName": "Single Track", "tracks": tracks}, ensure_ascii=False))
        else:
            print(json.dumps({"success": False, "error": "Unsupported URL (only playlist and track are supported)"}))
            
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
