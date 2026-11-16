export type SpotifyKind = 'track' | 'playlist';

const ID = '[A-Za-z0-9]{16,32}';
const WEB = new RegExp(
  `^https?://open\\.spotify\\.com/(?:intl-[a-z]{2,3}(?:-[A-Za-z]{2,4})?/)?(track|playlist)/(${ID})/?(?:[?#].*)?$`
);
const URI = new RegExp(`^spotify:(track|playlist):(${ID})$`);

export function parseSpotifyUrl(
  input: unknown
): { kind: SpotifyKind; id: string; url: string } | null {
  if (typeof input !== 'string') return null;
  const s = input.trim();
  if (s.length > 500) return null;
  const m = WEB.exec(s) ?? URI.exec(s);
  if (!m) return null;
  const kind = m[1] as SpotifyKind;
  const id = m[2];
  return { kind, id, url: `https://open.spotify.com/${kind}/${id}` };
}

export function isSpotifyTrackUrl(input: unknown): boolean {
  return parseSpotifyUrl(input)?.kind === 'track';
}
