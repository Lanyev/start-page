/**
 * Servidor local: sirve la start page y persiste el dashboard en data/remote-dashboard.json (GET/PUT/POST /dashboard).
 *
 * Privacidad (solo esta PC):
 * - Por defecto escucha en 127.0.0.1 (no en la red local). Para permitir LAN: HOST=0.0.0.0
 * - Sin cabeceras CORS permisivas: otros orígenes no pueden leer la API desde el navegador.
 *
 * Protección opcional (HTTP Basic):
 * - Variables de entorno START_PAGE_AUTH_USER y START_PAGE_AUTH_PASS (ambas).
 * - El navegador pedirá usuario y contraseña al abrir la página; /dashboard usa las mismas credenciales.
 *
 * Uso: node tools/local-server.mjs
 * Puerto: PORT (por defecto 8080).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DASHBOARD_FILE = path.join(ROOT, 'data', 'remote-dashboard.json');
const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '127.0.0.1';

const AUTH_USER = (process.env.START_PAGE_AUTH_USER || '').trim();
const AUTH_PASS = (process.env.START_PAGE_AUTH_PASS || '').trim();
const authEnabled = AUTH_USER !== '' && AUTH_PASS !== '';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

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

function unauthorized(res) {
  res.writeHead(401, {
    'WWW-Authenticate': 'Basic realm="Start Page"',
    'Content-Type': 'text/plain; charset=utf-8',
  });
  res.end('Se requiere iniciar sesion');
}

function checkAuth(req, res) {
  if (!authEnabled) return true;
  const parsed = parseBasicAuth(req.headers.authorization);
  if (parsed && parsed.user === AUTH_USER && parsed.pass === AUTH_PASS) return true;
  unauthorized(res);
  return false;
}

function safeFilePath(urlPathname) {
  if (!urlPathname || urlPathname.includes('\0')) return null;
  let rel = urlPathname;
  try {
    rel = decodeURIComponent(rel);
  } catch {
    return null;
  }
  rel = rel.replace(/^\/+/, '');
  const segments = rel.split('/').filter(s => s && s !== '.');
  if (segments.some(s => s === '..')) return null;
  const fsPath = path.join(ROOT, ...segments);
  const rootResolved = path.resolve(ROOT);
  const resolved = path.resolve(fsPath);
  const rootPrefix = rootResolved + path.sep;
  if (resolved !== rootResolved && !resolved.startsWith(rootPrefix)) return null;
  return resolved;
}

function extMime(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function sendText(res, code, body, headers = {}) {
  res.writeHead(code, headers);
  res.end(body);
}

function handleDashboard(req, res) {
  if (!checkAuth(req, res)) return;

  if (req.method === 'GET') {
    try {
      const data = fs.readFileSync(DASHBOARD_FILE, 'utf8');
      return sendText(res, 200, data, { 'Content-Type': 'application/json; charset=utf-8' });
    } catch {
      return sendText(res, 404, 'null', { 'Content-Type': 'application/json; charset=utf-8' });
    }
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    let chunks = '';
    req.on('data', c => {
      chunks += c;
    });
    req.on('end', () => {
      try {
        JSON.parse(chunks);
        fs.mkdirSync(path.dirname(DASHBOARD_FILE), { recursive: true });
        fs.writeFileSync(DASHBOARD_FILE, chunks, 'utf8');
        sendText(res, 204, '');
      } catch {
        sendText(res, 400, 'Invalid JSON', { 'Content-Type': 'text/plain; charset=utf-8' });
      }
    });
    return;
  }

  sendText(res, 405, 'Method not allowed', { 'Content-Type': 'text/plain; charset=utf-8' });
}

const server = http.createServer((req, res) => {
  const host = req.headers.host || `${HOST === '0.0.0.0' ? '127.0.0.1' : HOST}:${PORT}`;
  const u = new URL(req.url || '/', `http://${host}`);

  if (u.pathname === '/dashboard') {
    return handleDashboard(req, res);
  }

  if (!checkAuth(req, res)) return;

  let filePath = safeFilePath(u.pathname);
  if (!filePath) {
    return sendText(res, 400, 'Bad path', { 'Content-Type': 'text/plain; charset=utf-8' });
  }

  try {
    let st = fs.statSync(filePath);
    if (st.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      st = fs.statSync(filePath);
    }
  } catch {
    return sendText(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
  }

  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    if (!res.headersSent) sendText(res, 500, 'Error', { 'Content-Type': 'text/plain; charset=utf-8' });
  });
  res.writeHead(200, { 'Content-Type': extMime(filePath) });
  stream.pipe(res);
});

server.listen(PORT, HOST, () => {
  const localUrl = `http://127.0.0.1:${PORT}/`;
  console.log(`Start Page:  ${localUrl}`);
  console.log(`Dashboard:   http://127.0.0.1:${PORT}/dashboard  →  ${DASHBOARD_FILE}`);
  if (HOST === '0.0.0.0') {
    console.log('ATENCION: escuchando en todas las interfaces (HOST=0.0.0.0). Accesible en la red local.');
  } else {
    console.log('Solo este equipo (127.0.0.1). Para LAN: variable de entorno HOST=0.0.0.0');
  }
  if (authEnabled) {
    console.log('Autenticacion HTTP Basic activa (usuario configurado).');
  }
});
