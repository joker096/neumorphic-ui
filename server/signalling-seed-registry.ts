import express from 'express';
import { createServer } from 'node:http';

const app = express();
const PORT = parseInt(process.env.SEED_REGISTRY_PORT || '3001', 10);

const SEEDS = [
  { url: 'wss://signaling1.messanger.app/ws', region: 'eu-west', latency: 12 },
  { url: 'wss://signaling2.messanger.app/ws', region: 'us-east', latency: 45 },
  { url: 'wss://signaling3.messanger.app/ws', region: 'asia-east', latency: 120 },
];

app.get('/seeds', (_req, res) => {
  const shuffled = [...SEEDS].sort(() => Math.random() - 0.5);
  res.json({ seeds: shuffled, signed: false });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const server = createServer(app);
server.listen(PORT, () => {
  console.log(`[Seed Registry] Listening on port ${PORT}`);
});
