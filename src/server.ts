/**
 * web-ui-customizer plugin backend.
 *
 * Minutes of work: the frontend needs the on-disk creation time of a workspace,
 * which the browser cannot read. This server answers `GET /info?path=<absolute
 * path>` with that directory's timestamps, through the host's RPC proxy
 * (`/api/plugins/<name>/rpc/*`), and prints the ready line the host waits for
 * before it uses the port.
 *
 * It has no dependencies and opens no outbound connection: the only things it
 * touches are `fs.stat` on the paths the frontend names.
 */

import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import type { AddressInfo } from 'node:net';

type InfoResponse = {
  /** ISO instant the directory was created, or null when the filesystem reports none. */
  createdAt: string | null;
  /** ISO instant of the directory's last modification, or null when it cannot be read. */
  modifiedAt: string | null;
};

/**
 * Filesystems differ here: NTFS records a creation time, while ext4 usually
 * reports a `birthtime` of `0` or mirrors `ctime`. Reporting `null` is honest,
 * and the card simply omits the line.
 */
function toCreationInstant(stats: { birthtimeMs: number; birthtime: Date }): string | null {
  if (!Number.isFinite(stats.birthtimeMs) || stats.birthtimeMs <= 0) return null;
  const instant = stats.birthtime;
  return Number.isNaN(instant.getTime()) || instant.getTime() <= 0 ? null : instant.toISOString();
}

function sendJson(res: http.ServerResponse, statusCode: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    // Timestamps are live filesystem state; a cached answer would be a lie the
    // first time a workspace is deleted and recreated.
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

async function readInfo(rawPath: string | null): Promise<InfoResponse> {
  if (!rawPath) return { createdAt: null, modifiedAt: null };

  // Only absolute paths are meaningful, and a relative one would silently
  // resolve against the plugin directory.
  if (!path.isAbsolute(rawPath)) return { createdAt: null, modifiedAt: null };

  try {
    const stats = await fs.stat(rawPath);
    if (!stats.isDirectory()) return { createdAt: null, modifiedAt: null };

    return {
      createdAt: toCreationInstant(stats),
      modifiedAt: stats.mtime instanceof Date && !Number.isNaN(stats.mtime.getTime())
        ? stats.mtime.toISOString()
        : null,
    };
  } catch {
    // Missing, deleted or unreadable directory: the card shows the path only.
    return { createdAt: null, modifiedAt: null };
  }
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1');

  if (req.method === 'GET' && requestUrl.pathname === '/info') {
    void readInfo(requestUrl.searchParams.get('path'))
      .then((info) => sendJson(res, 200, info))
      .catch(() => sendJson(res, 500, { createdAt: null, modifiedAt: null }));
    return;
  }

  // Everything else is a route this plugin does not serve. The host health-checks
  // nothing, so a plain 404 is the whole contract.
  sendJson(res, 404, { error: 'not_found' });
});

server.on('error', (error: Error) => {
  console.error('[web-ui-customizer] server error:', error.message);
  process.exit(1);
});

// Port 0: the host reads the port from the ready line below and proxies to it.
server.listen(0, '127.0.0.1', () => {
  const address = server.address() as AddressInfo | null;
  if (address && typeof address !== 'string') {
    process.stdout.write(`${JSON.stringify({ ready: true, port: address.port })}\n`);
  }
});
