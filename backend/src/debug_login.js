const { User } = require('./models');
const bcrypt = require('bcryptjs');

const debugLogin = async () => {
    try {
        console.log('Debugging Login for MGR001...');

        const user = await User.findOne({ where: { nik: 'MGR001' } });
        if (!user) {
            console.log('❌ User MGR001 not found in database!');
            process.exit(1);
        }

        console.log('✓ User found:', user.nama_lengkap);
        console.log('Stored Hash:', user.password_hash);

        const passwordToTest = 'manager123';
        const isMatch = await bcrypt.compare(passwordToTest, user.password_hash);

        if (isMatch) {
            console.log('✓ Password "manager123" matches correctly!');
        } else {
            console.log('❌ Password "manager123" DOES NOT match!');

            // Try comparing without hash (in case hooks failed and stored plain text)
            if (user.password_hash === passwordToTest) {
                console.log('⚠️ Password stored as PLAIN TEXT! Hook did not run?');
            } else {
                console.log('Status: Hash mismatch.');
            }
        }
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

debugLogin();
