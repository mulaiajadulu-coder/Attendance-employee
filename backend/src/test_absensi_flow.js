// Node fetch is global in v24
// Use dynamic import for node-fetch usually, but let's try standard require if installed, 
// if not installed we might need to use http module, but let's assume availability or use built-in fetch in newer User Node versions.
// Since user node version is v24.11.0, global fetch is available!

// Config
const BASE_URL = 'http://localhost:3000/api';
const CREDENTIALS = {
    nik: 'EMP001',
    password: '123456'
};

// Mock Data
const MOCK_LOCATION = '-6.200000,106.816666';
const MOCK_PHOTO = 'base64_mock_string';

async function runTest() {
    console.log('🚀 Starting Absensi Flow Test...\n');

    try {
        // 1. Login
        console.log('1. Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(CREDENTIALS)
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.statusText}`);
        const loginData = await loginRes.json();
        const token = loginData.data.token;
        console.log('✅ Login Successful. Token acquired.\n');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 2. Get Today Status (Before Check-in)
        console.log('2. Checking Status (Initial)...');
        const status1Res = await fetch(`${BASE_URL}/absensi/today`, { headers });
        const status1 = await status1Res.json();
        console.log('Current Status:', JSON.stringify(status1.data, null, 2));

        if (status1.data.has_checked_in) {
            console.warn('⚠️ User already checked in today! Test might fail or behave unexpectedly. Skipping Check-In test if necessary.');
            // Proceeding anyway but expect potential "Already checked in" error
        }
        console.log('');

        if (!status1.data.has_checked_in) {
            // 3. Check In
            console.log('3. Performing Check-In...');
            const checkInRes = await fetch(`${BASE_URL}/absensi/masuk`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    foto: MOCK_PHOTO,
                    lokasi: MOCK_LOCATION
                })
            });

            const checkInData = await checkInRes.json();
            if (checkInRes.ok) {
                console.log('✅ Check-In SUCCESS:', checkInData.message);
                console.log('Data:', checkInData.data);
            } else {
                console.error('❌ Check-In FAILED:', checkInData);
            }
            console.log('');
        }

        // 4. Check IN Again (Should Fail)
        console.log('4. Testing Double Check-In (Should Fail)...');
        const doubleInRes = await fetch(`${BASE_URL}/absensi/masuk`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ foto: MOCK_PHOTO, lokasi: MOCK_LOCATION })
        });
        const doubleInData = await doubleInRes.json();
        if (!doubleInRes.ok && doubleInData.error.code === 'ALREADY_CHECKED_IN') {
            console.log('✅ Duplicate Check-In correctly rejected.');
        } else {
            console.error('❌ Unexpected response for double check-in:', doubleInData);
        }
        console.log('');

        // 5. Check Out
        console.log('5. Performing Check-Out...');
        const checkOutRes = await fetch(`${BASE_URL}/absensi/pulang`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                foto: MOCK_PHOTO,
                lokasi: MOCK_LOCATION,
                catatan: 'Testing absensi system'
            })
        });

        const checkOutData = await checkOutRes.json();
        if (checkOutRes.ok) {
            console.log('✅ Check-Out SUCCESS:', checkOutData.message);
            console.log('Data:', checkOutData.data);
        } else {
            console.error('❌ Check-Out FAILED:', checkOutData);
        }
        console.log('');

        // 6. Final Status Check
        console.log('6. Checking Final Status...');
        const finalStatusRes = await fetch(`${BASE_URL}/absensi/today`, { headers });
        const finalStatus = await finalStatusRes.json();
        console.log('Final Status:', finalStatus.data);

        if (finalStatus.data.has_checked_in && finalStatus.data.has_checked_out) {
            console.log('\n✨ TEST COMPLETED SUCCESSFULLY! ✨');
        } else {
            console.warn('\n⚠️ Test completed with warnings.');
        }

    } catch (error) {
        console.error('\n💥 TEST ERROR:', error);
    }
}

runTest();
