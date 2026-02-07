const selfsigned = require('selfsigned');
const attrs = [{ name: 'commonName', value: '192.168.18.15' }];
const pems = selfsigned.generate(attrs, { days: 365 });
console.log('Key length:', pems.private.length);
console.log('Cert length:', pems.cert.length);
console.log('Keys:', Object.keys(pems));
