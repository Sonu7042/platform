// Standalone exported server: no runtime packages or platform database required.
export const exportedServer = String.raw`import http from 'node:http';
import { readFile, appendFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { renderWebsite } from './render.js';
const root = fileURLToPath(new URL('./', import.meta.url));
const site = JSON.parse(await readFile(path.join(root, 'project.json'), 'utf8'));
const publicRoot = path.join(root, 'public');
const dataRoot = path.join(root, 'data');
await mkdir(dataRoot, { recursive: true });
const limits = new Map();
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: http:; form-action 'self'; frame-ancestors 'none'");
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/api/health') { res.setHeader('Content-Type', 'application/json'); return res.end('{"status":"ok"}'); }
    const match = url.pathname.match(/^\/api\/public\/forms\/([^/]+)\/submissions$/);
    if (req.method === 'POST' && match) {
      const ip = req.socket.remoteAddress;
      const now = Date.now();
      for (const [key, entry] of limits) if (now - entry.start > 60000) limits.delete(key);
      const entry = limits.get(ip) || { start: now, count: 0 }; entry.count++; limits.set(ip, entry);
      if (entry.count > 20) { res.writeHead(429); return res.end('Too many submissions. Try again in a minute.'); }
      const form = site.forms.find(f => f.id === match[1]);
      if (!form) { res.writeHead(404); return res.end('Form not found'); }
      let body = ''; for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 65536) { res.writeHead(413); return res.end('Submission too large'); } }
      const input = req.headers['content-type']?.includes('application/json') ? JSON.parse(body) : Object.fromEntries(new URLSearchParams(body));
      const data = {};
      for (const field of form.fields) {
        const value = input[field.key];
        if ((field.required && (value === undefined || value === '')) || (value !== undefined && (typeof value !== 'string' || value.length > 10000)) || (value && field.type === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) { res.writeHead(400); return res.end('Invalid value for ' + field.label); }
        if (value !== undefined) data[field.key] = value;
      }
      await appendFile(path.join(dataRoot, 'submissions.jsonl'), JSON.stringify({ id: randomUUID(), formId: form.id, data, createdAt: new Date().toISOString() }) + '\n');
      res.writeHead(201, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end('<!doctype html><title>Thank you</title><h1>Thank you!</h1><p>Your submission has been received.</p>');
    }
    if (req.method === 'GET' && url.pathname.startsWith('/assets/')) {
      const filename = path.basename(decodeURIComponent(url.pathname));
      if (!/^[a-zA-Z0-9-]+\.(png|jpg|webp)$/.test(filename)) { res.writeHead(404); return res.end('Not found'); }
      const data = await readFile(path.join(publicRoot, 'assets', filename));
      res.setHeader('Content-Type', { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' }[filename.split('.').pop()]); return res.end(data);
    }
    if (req.method === 'GET') {
      const slug = url.pathname.replace(/^\/|\/$/g, '').replace(/\.html$/, '');
      const page = site.pages.find(p => p.published && ((!slug || slug === 'index') ? p.isHome : p.slug === slug));
      if (page) { res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.end(renderWebsite(site, page, { base: '' })); }
    }
    res.writeHead(404); res.end('Not found');
  } catch (error) {
    res.writeHead(error instanceof SyntaxError ? 400 : error.code === 'ENOENT' ? 404 : 500);
    res.end(error instanceof SyntaxError ? 'Invalid JSON' : error.code === 'ENOENT' ? 'Not found' : 'Unable to process request');
  }
});
server.listen(Number(process.env.PORT ?? 3000), '127.0.0.1', () => console.log('Website running at http://localhost:' + server.address().port));
`;
