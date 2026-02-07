const https = require('https');
const selfsigned = require('selfsigned');
const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 365 });
const options = { key: pems.private, cert: pems.cert };
https.createServer(options, (req, res) => {
    res.writeHead(200);
    res.end('hello world\n');
}).listen(8000, () => {
    console.log('Server running at https://localhost:8000/');
});
