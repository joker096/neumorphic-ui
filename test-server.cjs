const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve({ status: res.statusCode, body: data }); });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function test() {
  try {
    const login = await request({
      hostname: 'localhost',
      port: 8766,
      path: '/api/admin/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ username: 'admin_dev', password: 'DevPass_' + 'test123' }));
    console.log('LOGIN:', login.status, login.body);
  } catch (e) {
    console.log('LOGIN ERROR:', e.message);
  }
  try {
    const dashboard = await request({
      hostname: 'localhost',
      port: 8766,
      path: '/api/admin/dashboard',
      method: 'GET'
    });
    console.log('DASHBOARD:', dashboard.status, dashboard.body);
  } catch (e) {
    console.log('DASHBOARD ERROR:', e.message);
  }
}

test();