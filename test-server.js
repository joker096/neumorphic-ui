const { spawn } = require('child_process');
const http = require('http');

// Start the server
const server = spawn('npx', ['tsx', 'server/signaling-server.ts'], {
  cwd: process.cwd(),
  shell: true,
  stdio: ['pipe', 'inherit', 'inherit']
});

let resolved = false;

// Wait for server to start
server.stdout?.on('data', (data) => {
  console.log('SERVER:', data.toString());
  if (data.toString().includes('REST API listening on port')) {
    // Wait a bit more for the server to be ready
    setTimeout(() => {
      if (resolved) return;
      resolved = true;
      
      // Test 1: Login
      const loginData = JSON.stringify({
        username: process.env.TEST_ADMIN_USERNAME || 'admin_dev',
        password: process.env.TEST_ADMIN_PASSWORD || 'DevPass_test123'
      });
      const loginReq = http.request({
        hostname: 'localhost',
        port: 8766,
        path: '/api/admin/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          console.log('\n=== LOGIN ===');
          console.log('Status:', res.statusCode);
          console.log('Body:', body);
          
          // Test 2: Dashboard (no auth)
          const dashReq = http.request({
            hostname: 'localhost',
            port: 8766,
            path: '/api/admin/dashboard',
            method: 'GET'
          }, (res2) => {
            let body2 = '';
            res2.on('data', (chunk) => { body2 += chunk; });
            res2.on('end', () => {
              console.log('\n=== DASHBOARD (no auth) ===');
              console.log('Status:', res2.statusCode);
              console.log('Body:', body2);
              
              server.kill('SIGTERM');
            });
          });
          dashReq.on('error', (e) => { console.log('Dashboard error:', e.message); });
          dashReq.end();
        });
      });
      loginReq.on('error', (e) => { console.log('Login error:', e.message); });
      loginReq.write(loginData);
      loginReq.end();
    }, 1000);
  }
});

server.stdout?.on('data', (data) => {
  if (data.toString().includes('REST API listening on port')) {
    // Already handled above
  }
});