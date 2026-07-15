import express from 'express';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';

const app = express();
const PORT = parseInt(process.env.SEED_REGISTRY_PORT || '3001', 10);

const SEEDS = [
  { url: 'wss://signaling1.messanger.app/ws', region: 'eu-west', latency: 12 },
  { url: 'wss://signaling2.messanger.app/ws', region: 'us-east', latency: 45 },
  { url: 'wss://signaling3.messanger.app/ws', region: 'asia-east', latency: 120 },
];

function secureShuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

app.get('/seeds', (_req, res) => {
  const shuffled = secureShuffle(SEEDS);
  res.json({ seeds: shuffled, signed: false });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const server = createServer(app);
server.listen(PORT, () => {
  console.log(`[Seed Registry] Listening on port ${PORT}`);
});
