import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { exportedServer } from '../services/export.service.js';

test('standalone exported server renders pages and stores validated submissions without platform dependencies', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'builder-export-test-'));
  let child;
  try {
    const site = { name: 'Independent site', slug: 'independent', pages: [{ name: 'Home', slug: 'home', isHome: true, published: true, content: { sections: [{ heading: 'Independent website' }] } }], forms: [{ id: 'contact', name: 'Contact', fields: [{ key: 'email', label: 'Email', type: 'EMAIL', required: true }] }], collections: [] };
    await Promise.all([
      writeFile(path.join(folder, 'package.json'), '{"type":"module"}'),
      writeFile(path.join(folder, 'server.js'), exportedServer),
      writeFile(path.join(folder, 'project.json'), JSON.stringify(site)),
      readFile(new URL('../services/render.service.js', import.meta.url)).then(source => writeFile(path.join(folder, 'render.js'), source)),
    ]);
    child = spawn(process.execPath, ['server.js'], { cwd: folder, env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
    const port = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Export server did not start')), 10000);
      child.stdout.on('data', data => { const match = String(data).match(/localhost:(\d+)/); if (match) { clearTimeout(timer); resolve(match[1]); } });
      child.on('error', error => { clearTimeout(timer); reject(error); });
      child.on('exit', code => { clearTimeout(timer); reject(new Error(`Export server exited: ${code}`)); });
    });
    const base = `http://127.0.0.1:${port}`;
    let r = await fetch(base); assert.equal(r.status, 200); assert.ok((await r.text()).includes('Independent website'));
    r = await fetch(`${base}/project.json`); assert.equal(r.status, 404);
    r = await fetch(`${base}/api/public/forms/contact/submissions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"email":"invalid"}' }); assert.equal(r.status, 400);
    r = await fetch(`${base}/api/public/forms/contact/submissions`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'email=reader%40example.com' }); assert.equal(r.status, 201);
    const submission = JSON.parse((await readFile(path.join(folder, 'data/submissions.jsonl'), 'utf8')).trim());
    assert.equal(submission.data.email, 'reader@example.com');
    assert.equal(submission.formId, 'contact');
  } finally {
    if (child && child.exitCode === null) { const closed = new Promise(resolve => child.once('exit', resolve)); child.kill(); await closed; }
    const resolved = path.resolve(folder);
    if (resolved.startsWith(path.resolve(tmpdir()) + path.sep) && path.basename(resolved).startsWith('builder-export-test-')) await rm(resolved, { recursive: true, force: true });
  }
});
