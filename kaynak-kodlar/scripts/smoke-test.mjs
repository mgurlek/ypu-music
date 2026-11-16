// Smoke test for YPU Music. Plain Node ESM, no dependencies, Node >= 20.
//
//   node scripts/smoke-test.mjs                  starts "next start" on a free port, tests it, stops it
//   node scripts/smoke-test.mjs http://127.0.0.1:3000   tests a server that is already running
//
// Needs a finished build (npm run build) when it starts its own server.
// No network access to Spotify or YouTube is used. Exit code 0 = all checks passed.

import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const externalUrl = process.argv[2];

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer(base, child, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child && child.exitCode !== null) throw new Error(`server exited early (code ${child.exitCode})`);
    try {
      const res = await fetch(base + '/', { signal: AbortSignal.timeout(5000) });
      if (res.status > 0) return;
    } catch {
      // not up yet
    }
    await sleep(500);
  }
  throw new Error(`server did not answer within ${timeoutMs / 1000} s`);
}

// Kill the server and everything it started.
function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      process.kill(-child.pid, 'SIGTERM'); // whole process group (server was started detached)
    } catch {
      child.kill('SIGTERM');
    }
  }
}

const results = [];
async function check(name, fn) {
  try {
    await fn();
    console.log(`PASS  ${name}`);
    results.push(true);
  } catch (err) {
    console.log(`FAIL  ${name} -> ${err.message}`);
    results.push(false);
  }
}

function expect(cond, message) {
  if (!cond) throw new Error(message);
}

async function request(base, method, route, { body, contentType = 'application/json' } = {}) {
  const res = await fetch(base + route, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': contentType },
    body,
    signal: AbortSignal.timeout(30000),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // not JSON
  }
  return { status: res.status, text, json };
}

async function runChecks(base) {
  await check('GET / -> 200 with app title', async () => {
    const r = await request(base, 'GET', '/');
    expect(r.status === 200, `status ${r.status}`);
    expect(/YPU Music/i.test(r.text), 'HTML does not contain "YPU Music"');
  });

  await check('GET /api/queue -> 200 {queue[], status, logs[]}', async () => {
    const r = await request(base, 'GET', '/api/queue');
    expect(r.status === 200, `status ${r.status}`);
    expect(r.json && Array.isArray(r.json.queue), 'queue is not an array');
    expect(typeof r.json.status === 'string', 'status is not a string');
    expect(Array.isArray(r.json.logs), 'logs is not an array');
  });

  await check('GET /api/library -> 200 {success:true, playlists[]}', async () => {
    const r = await request(base, 'GET', '/api/library');
    expect(r.status === 200, `status ${r.status}`);
    expect(r.json && r.json.success === true, 'success is not true');
    expect(Array.isArray(r.json.playlists), 'playlists is not an array');
  });

  await check('POST /api/metadata {"url":"hello"} -> 4xx {success:false, code, error}', async () => {
    const r = await request(base, 'POST', '/api/metadata', { body: JSON.stringify({ url: 'hello' }) });
    expect(r.status >= 400 && r.status < 500, `status ${r.status}`);
    expect(r.json && r.json.success === false, 'success is not false');
    expect(typeof r.json.code === 'string', 'code is not a string');
    expect(typeof r.json.error === 'string', 'error is not a string');
  });

  await check('POST /api/queue with invalid track -> 400', async () => {
    const body = JSON.stringify({
      tracks: [{ id: 'x', name: 'x', artist: 'x', url: 'web' }],
      playlistName: 'x',
    });
    const r = await request(base, 'POST', '/api/queue', { body });
    expect(r.status === 400, `status ${r.status}`);
  });

  await check('POST /api/metadata as text/plain -> 415', async () => {
    const r = await request(base, 'POST', '/api/metadata', { body: 'hello', contentType: 'text/plain' });
    expect(r.status === 415, `status ${r.status}`);
  });
}

async function main() {
  let child = null;
  let base = externalUrl ? externalUrl.replace(/\/+$/, '') : '';

  try {
    if (!externalUrl) {
      const port = Number(process.env.SMOKE_PORT) || (await freePort()); // SMOKE_PORT: optional override
      base = `http://127.0.0.1:${port}`;
      const nextBin = path.join(appDir, 'node_modules', 'next', 'dist', 'bin', 'next');
      console.log(`Starting server on ${base} ...`);
      child = spawn(process.execPath, [nextBin, 'start', '-H', '127.0.0.1', '-p', String(port)], {
        cwd: appDir,
        stdio: ['ignore', 'inherit', 'inherit'],
        detached: process.platform !== 'win32',
        env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
      });
    }
    await waitForServer(base, child);
    await runChecks(base);
  } catch (err) {
    console.log(`FAIL  setup -> ${err.message}`);
    results.push(false);
  } finally {
    stopServer(child);
  }

  const passed = results.filter(Boolean).length;
  console.log(`\n${passed}/${results.length} checks passed`);
  process.exit(results.length > 0 && passed === results.length ? 0 : 1);
}

main();
