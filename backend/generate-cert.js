const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const certDir = path.join(__dirname, 'certs');
if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
}

const keyFile = path.join(certDir, 'key.pem');
const certFile = path.join(certDir, 'cert.pem');

console.log('Generating SSL certificate using OpenSSL...');

try {
    // Generate private key and certificate in one command
    const command = `openssl req -x509 -newkey rsa:2048 -keyout "${keyFile}" -out "${certFile}" -days 365 -nodes -subj "/CN=192.168.18.15"`;
    execSync(command, { stdio: 'inherit' });

    console.log('✓ SSL certificate generated successfully!');
    console.log(`  Key: ${keyFile}`);
    console.log(`  Cert: ${certFile}`);
} catch (error) {
    console.error('Error generating certificate:', error.message);
    throw error;
}
