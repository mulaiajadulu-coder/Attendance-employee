const http = require('http');

const data = JSON.stringify({
    nik: 'ADMIN001',
    password: 'admin123'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Body:', body);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
