#!/usr/bin/env node
/**
 * Build script — run by CloudCLI as `npm run build` right after it installs the
 * plugin, and by hand during development.
 *
 * Two bundles:
 *   1. dist/index.js  — the frontend, mounted on both of this plugin's surfaces:
 *                       the host's resident layer and its settings page.
 *   2. dist/server.js — a dependency-free Node server, so the plugin can read
 *                       the workspace's on-disk creation time over the host RPC
 *                       proxy. It prints the ready line the host waits for.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const watch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const frontend = {
  entryPoints: [path.join(root, 'src', 'index.ts')],
  outfile: path.join(root, 'dist', 'index.js'),
  bundle: true,
  format: 'esm',
  target: ['es2020'],
  platform: 'browser',
  minify: !watch,
  sourcemap: watch ? 'inline' : false,
  legalComments: 'none',
  logLevel: 'info',
};

/** @type {import('esbuild').BuildOptions} */
const backend = {
  entryPoints: [path.join(root, 'src', 'server.ts')],
  outfile: path.join(root, 'dist', 'server.js'),
  bundle: true,
  format: 'esm',
  target: ['node18'],
  platform: 'node',
  minify: false,
  sourcemap: false,
  logLevel: 'info',
};

async function main() {
  fs.mkdirSync(path.join(root, 'dist'), { recursive: true });

  if (watch) {
    const contexts = await Promise.all([esbuild.context(frontend), esbuild.context(backend)]);
    await Promise.all(contexts.map((context) => context.watch()));
    console.log('[build] watching for changes…');
    return;
  }

  await Promise.all([esbuild.build(frontend), esbuild.build(backend)]);
  const bytes = fs.statSync(path.join(root, 'dist', 'index.js')).size;
  console.log(`[build] dist/index.js ${(bytes / 1024).toFixed(0)} kB`);
}

main().catch((error) => {
  console.error('[build] failed:', error);
  process.exit(1);
});
