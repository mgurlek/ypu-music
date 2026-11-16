import fs from 'fs';
import path from 'path';

export const DEFAULT_DIR_NAME = 'Indirilen-Muzikler';

export function getDownloadDir(): string {
  const fromEnv = process.env.DOWNLOAD_DIR;
  if (fromEnv && fromEnv.trim() !== '') return fromEnv;
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), '..', DEFAULT_DIR_NAME);
}

export function ensureDownloadDir(): string {
  const dir = getDownloadDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Windows device names, with or without an extension (superscript digits count too).
const RESERVED = /^(con|prn|aux|nul|conin\$|conout\$|com[0-9¹²³]|lpt[0-9¹²³])$/i;
const TRIM = /^[\s.]+|[\s.]+$/g;

export function sanitizeFolderName(name: unknown): string {
  if (typeof name !== 'string') return 'Playlist';
  let s = name
    .replace(/[<>:"/\\|?*{}\u0000-\u001f\u007f]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(TRIM, '');
  if (s.length > 80) s = s.slice(0, 80).replace(TRIM, '');
  if (s === '') return 'Playlist';
  const base = s.split('.')[0].trim();
  if (RESERVED.test(base)) s += '_';
  // A leading '-' would be read as a command-line flag by spotdl.
  if (s.startsWith('-')) s = `_${s}`;
  return s;
}

export function resolveInsideDownloadDir(name: unknown): string | null {
  const safe = sanitizeFolderName(name);
  if (safe === '.' || safe === '..') return null;
  const root = path.resolve(getDownloadDir());
  const full = path.join(/*turbopackIgnore: true*/ root, safe);
  const rel = path.relative(root, full);
  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return full;
}
