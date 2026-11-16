import { execFile } from 'child_process';
import { createHash } from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

export type PythonProblem = 'PYTHON_MISSING' | 'PYTHON_TOO_OLD' | 'SPOTDL_MISSING';
export type PythonResolution =
  | { ok: true; command: string; prefixArgs: string[]; version: string; caBundle?: string }
  | { ok: false; problem: PythonProblem; detail: string };

type Candidate = { command: string; prefixArgs: string[] };
type Okay = Extract<PythonResolution, { ok: true }>;

const g = globalThis as unknown as { __ypuPython?: Okay };
let cached: Okay | null = null;

const VERSION_CODE = "import sys; print('%d.%d.%d' % sys.version_info[:3])";

const CA_VARS = ['CURL_CA_BUNDLE', 'SSL_CERT_FILE', 'REQUESTS_CA_BUNDLE'] as const;
const asciiCopies = new Map<string, string | null>();

const isAscii = (s: string): boolean => /^[\x00-\x7f]*$/.test(s);

function sha256(file: string): string {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

// libcurl on Windows cannot open a CA bundle whose path has non-ASCII characters,
// so keep an ASCII-path copy of it. Never throws; returns null if no location works.
function asciiCaCopy(src: string): string | null {
  if (asciiCopies.has(src)) return asciiCopies.get(src) ?? null;
  // ProgramData first: only the user who creates a file there can change it
  // (the Public folder is writable by every local user).
  const dirs = [
    process.env.ProgramData,
    process.env.ALLUSERSPROFILE,
    process.env.PUBLIC,
    `${process.env.SystemDrive || 'C:'}\\Users\\Public`,
    os.tmpdir(),
  ];
  let result: string | null = null;
  for (const base of dirs) {
    if (!base || !isAscii(base)) continue;
    try {
      const dir = path.join(base, 'YPU-Music');
      const dest = path.join(dir, 'ypu-cacert.pem');
      fs.mkdirSync(dir, { recursive: true });
      if (!fs.existsSync(dest) || sha256(dest) !== sha256(src)) fs.copyFileSync(src, dest);
      result = dest;
      break;
    } catch {
      // try the next candidate
    }
  }
  if (!result) console.warn('Could not create an ASCII-path copy of the CA bundle');
  asciiCopies.set(src, result);
  return result;
}

function caEnv(): Record<string, string> {
  if (process.platform !== 'win32') return {};
  const bundle = (cached ?? g.__ypuPython ?? null)?.caBundle;
  if (!bundle || isAscii(bundle)) return {};
  if (CA_VARS.some((k) => process.env[k])) return {};
  const copy = asciiCaCopy(bundle);
  if (!copy) return {};
  return { CURL_CA_BUNDLE: copy, SSL_CERT_FILE: copy, REQUESTS_CA_BUNDLE: copy };
}

export function pythonEnv(extra?: Record<string, string>): NodeJS.ProcessEnv {
  return {
    ...process.env,
    ...caEnv(),
    PYTHONUTF8: '1',
    PYTHONIOENCODING: 'utf-8',
    PYTHONUNBUFFERED: '1',
    ...extra,
  };
}

function candidates(): Candidate[] {
  const list: Candidate[] = [];
  const custom = process.env.YPU_PYTHON;
  if (custom && custom.trim() !== '') list.push({ command: custom.trim(), prefixArgs: [] });
  if (process.platform === 'win32') {
    list.push({ command: 'py', prefixArgs: ['-3'] });
    list.push({ command: 'python', prefixArgs: [] });
    list.push({ command: 'python3', prefixArgs: [] });
  } else {
    list.push({ command: 'python3', prefixArgs: [] });
    list.push({ command: 'python', prefixArgs: [] });
  }
  return list;
}

function run(c: Candidate, code: string): Promise<{ ok: boolean; out: string }> {
  return new Promise((resolve) => {
    try {
      execFile(
        c.command,
        [...c.prefixArgs, '-c', code],
        { timeout: 15000, windowsHide: true, env: pythonEnv(), encoding: 'utf8' },
        (err, stdout, stderr) => {
          resolve({ ok: !err, out: `${stdout ?? ''}${stderr ?? ''}`.trim() });
        }
      );
    } catch {
      resolve({ ok: false, out: '' });
    }
  });
}

function parseVersion(out: string): { major: number; minor: number; text: string } | null {
  const m = /^(\d+)\.(\d+)\.(\d+)$/m.exec(out);
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]), text: `${m[1]}.${m[2]}.${m[3]}` };
}

export async function resolvePython(forceRefresh = false): Promise<PythonResolution> {
  if (!forceRefresh) {
    const hit = cached ?? g.__ypuPython ?? null;
    if (hit) return hit;
  }

  const probes = await Promise.all(
    candidates().map(async (c) => {
      const r = await run(c, VERSION_CODE);
      return { c, v: r.ok ? parseVersion(r.out) : null };
    })
  );

  const found = probes.flatMap((p) => (p.v ? [{ c: p.c, v: p.v }] : []));
  if (found.length === 0) {
    return { ok: false, problem: 'PYTHON_MISSING', detail: 'No working Python interpreter found' };
  }
  const suitable = found.filter((p) => p.v.major > 3 || (p.v.major === 3 && p.v.minor >= 11));
  if (suitable.length === 0) {
    return {
      ok: false,
      problem: 'PYTHON_TOO_OLD',
      detail: `Found Python ${found.map((p) => p.v.text).join(', ')}; need 3.11 or newer`,
    };
  }

  const checked = await Promise.all(
    suitable.map(async (p) => ({ p, r: await run(p.c, 'import spotdl') }))
  );
  const good = checked.find((x) => x.r.ok);
  if (!good) {
    return {
      ok: false,
      problem: 'SPOTDL_MISSING',
      detail: 'import spotdl failed in every suitable Python',
    };
  }
  const result: Okay = {
    ok: true,
    command: good.p.c.command,
    prefixArgs: good.p.c.prefixArgs,
    version: good.p.v.text,
  };
  const ca = await run(good.p.c, 'import certifi,sys;sys.stdout.write(certifi.where())');
  const caPath = ca.ok ? ca.out.trim() : '';
  if (caPath && path.isAbsolute(caPath) && fs.existsSync(caPath)) result.caBundle = caPath;
  cached = result;
  g.__ypuPython = result;
  return result;
}
