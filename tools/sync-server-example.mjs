/**
 * Servidor mínimo solo para API /dashboard (sin servir la web).
 * Para página estática + API en un solo proceso: node tools/local-server.mjs
 *
 * Por defecto solo 127.0.0.1. LAN: HOST=0.0.0.0
 * Basic auth opcional: START_PAGE_AUTH_USER + START_PAGE_AUTH_PASS (igual que local-server.mjs)
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'data', 'remote-dashboard.json');
const PORT = Number(process.env.PORT || 3847);
const HOST = process.env.HOST || '127.0.0.1';

const AUTH_USER = (process.env.START_PAGE_AUTH_USER || '').trim();
const AUTH_PASS = (process.env.START_PAGE_AUTH_PASS || '').trim();
const authEnabled = AUTH_USER !== '' && AUTH_PASS !== '';

function parseBasicAuth(header) {
  if (!header || !header.startsWith('Basic ')) return null;
  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const colon = decoded.indexOf(':');
    if (colon === -1) return null;
    return { user: decoded.slice(0, colon), pass: decoded.slice(colon + 1) };
  } catch {
    return null;
  }
}

function send(res, code, body, extraHeaders = {}) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', ...extraHeaders });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (authEnabled) {
    const parsed = parseBasicAuth(req.headers.authorization);
    if (!parsed || parsed.user !== AUTH_USER || parsed.pass !== AUTH_PASS) {
      res.writeHead(401, {
        'WWW-Authenticate': 'Basic realm="Start Page"',
        'Content-Type': 'text/plain; charset=utf-8',
      });
      res.end('Unauthorized');
      return;
    }
  }

  const host = req.headers.host || `${HOST === '0.0.0.0' ? '127.0.0.1' : HOST}:${PORT}`;
  const u = new URL(req.url || '/', `http://${host}`);
  if (u.pathname !== '/dashboard') {
    return send(res, 404, 'Not found');
  }

  if (req.method === 'GET') {
    try {
      const data = fs.readFileSync(FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(data);
    } catch {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end('null');
    }
    return;
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    let chunks = '';
    req.on('data', c => {
      chunks += c;
    });
    req.on('end', () => {
      try {
        JSON.parse(chunks);
        fs.mkdirSync(path.dirname(FILE), { recursive: true });
        fs.writeFileSync(FILE, chunks, 'utf8');
        res.writeHead(204);
        res.end();
      } catch {
        send(res, 400, 'Invalid JSON');
      }
    });
    return;
  }

  send(res, 405, 'Method not allowed');
});

server.listen(PORT, HOST, () => {
  console.log(`Sincronización: http://127.0.0.1:${PORT}/dashboard → ${FILE}`);
  if (HOST === '0.0.0.0') {
    console.log('ATENCION: HOST=0.0.0.0 — accesible en la red local.');
  }
  if (authEnabled) console.log('HTTP Basic activo.');
});
