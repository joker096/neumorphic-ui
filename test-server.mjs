import { spawn } from 'child_process';
import { promisify } from 'util';

const exec = promisify(require('child_process').exec);

// Start the server
const server = spawn('npx', ['tsx', 'server/signaling-server.ts'], {
  cwd: process.cwd(),
  shell: true,
  stdio: 'inherit'
});

// Wait for server to start
await new Promise<void>((resolve) => {
  server.stdout?.on('data', (data) => {
    console.log('SERVER:', data.toString());
    if (data.toString().includes('REST API listening on port')) {
      resolve();
    }
  });
  setTimeout(() => resolve(), 3000);
});

// Test 1: Login
const loginRes = await fetch('http://localhost:8766/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin_dev', password: 'DevPass_' + 'test123' })
});
console.log('\n=== LOGIN ===');
console.log('Status:', loginRes.status);
console.log('Body:', await loginRes.text());

// Test 2: Invalid endpoint
const notFound = await fetch('http://localhost:8766/api/admin/dashboard', {
  method: 'GET'
});
console.log('\n=== DASHBOARD (no auth) ===');
console.log('Status:', notFound.status);
console.log('Body:', await notFound.text());

server.kill('SIGTERM');