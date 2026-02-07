import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';

const HOST = process.env.HOST ?? '127.0.0.1';
const PORT = Number(process.env.PORT ?? 8789);

const app = express();
app.use(express.json({ limit: '5mb' }));

let wsClient = null; // single connected extension for now
let nextId = 1;
const pending = new Map(); // id -> { resolve, reject, timeout }

function wsSend(msg) {
  if (!wsClient || wsClient.readyState !== wsClient.OPEN) {
    throw new Error('No extension connected (WebSocket not open).');
  }
  wsClient.send(JSON.stringify(msg));
}

function callExt(payload, { timeoutMs = 10_000 } = {}) {
  const id = String(nextId++);
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timeout waiting for extension response (id=${id})`));
    }, timeoutMs);
    pending.set(id, { resolve, reject, timeout });
    wsSend({ id, ...payload });
  });
}

app.get('/health', (req, res) => {
  res.json({ ok: true, connected: !!wsClient });
});

// Raw CDP pass-through
app.post('/cdp', async (req, res) => {
  try {
    const { method, params } = req.body ?? {};
    if (!method || typeof method !== 'string') {
      return res.status(400).json({ ok: false, error: 'Missing method (string).' });
    }
    const result = await callExt({ type: 'cdp', method, params: params ?? {} });
    res.json({ ok: true, result });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message ?? e) });
  }
});

// Non-CDP extension relay endpoints (still “thin”):
app.get('/tabs', async (req, res) => {
  try {
    const result = await callExt({ type: 'tabs_list' });
    res.json({ ok: true, tabs: result });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message ?? e) });
  }
});

app.get('/bookmarks', async (req, res) => {
  try {
    const result = await callExt({ type: 'bookmarks_tree' });
    res.json({ ok: true, bookmarks: result });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message ?? e) });
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  console.log('extension ws connected', req?.socket?.remoteAddress);
  wsClient = ws;

  ws.on('close', (code, reason) => {
    console.log('extension ws closed', code, reason?.toString?.() ?? '');
  });

  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(String(data));
    } catch {
      return;
    }

    // Expected: { type: 'response', id, result?, error? }
    if (msg?.type === 'response' && msg?.id != null) {
      const p = pending.get(String(msg.id));
      if (!p) return;
      clearTimeout(p.timeout);
      pending.delete(String(msg.id));
      if (msg.error) p.reject(new Error(msg.error));
      else p.resolve(msg.result);
    }
  });
  ws.on('close', () => {
    if (wsClient === ws) wsClient = null;
    // fail all pending
    for (const [id, p] of pending) {
      clearTimeout(p.timeout);
      p.reject(new Error('Extension disconnected'));
    }
    pending.clear();
  });
});

server.listen(PORT, HOST, () => {
  console.log(`browser-adaptor server listening on http://${HOST}:${PORT}`);
  console.log(`ws endpoint: ws://${HOST}:${PORT}/ws`);
});
