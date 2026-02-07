const API_URL = 'http://localhost:3000/api';
const { User } = require('./models');

async function testFlow() {
    try {
        console.log('🚀 TESTING FLOW + RESET CMD...');

        // RESET
        const emp = await User.findOne({ where: { nik: 'EMP001' } });
        if (emp) { emp.password_hash = '123456'; await emp.save(); console.log('Reset EMP001 Done'); }

        const mgr = await User.findOne({ where: { nik: 'MGR001' } });
        if (mgr) { mgr.password_hash = '123456'; await mgr.save(); console.log('Reset MGR001 Done'); }


        // Helper
        const post = async (url, body, token) => {
            const res = await fetch(API_URL + url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            return { status: res.status, data };
        };

        const get = async (url, token) => {
            const res = await fetch(API_URL + url, {
                headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
            });
            const data = await res.json();
            return { status: res.status, data };
        };


        // 1. LOGIN JOHN DOE (EMP001)
        let res = await post('/auth/login', { nik: 'EMP001', password: '123456' });
        if (!res.data.token) return console.log('❌ Login John Gagal', res.data);
        const tokenJohn = res.data.token;
        console.log('✅ Login John OK.');

        // 2. CEK REQUEST
        let myReq = await get('/koreksi/my-requests', tokenJohn);
        console.log(`📄 Pending Requests John: ${myReq.data.data ? myReq.data.data.length : 0}`);

        // 3. LOGIN MGR001
        let resYudi = await post('/auth/login', { nik: 'MGR001', password: '123456' });
        if (!resYudi.data.token) return console.log('❌ Login MGR Gagal');
        const tokenMgr = resYudi.data.token;
        console.log('✅ Login Manager OK.');

        // 4. CEK APPROVALS
        const appRes = await get('/koreksi/approvals', tokenMgr);
        const approvals = appRes.data.data || [];
        console.log(`📝 Manager Approvals Found: ${approvals.length}`);

        if (approvals.length > 0) {
            console.log('✅✅ SUKSES! API RETURN DATA.');
            console.log(`    Detail Request ID: ${approvals[0].id}, Untuk Tanggal: ${approvals[0].tanggal}, User: ${approvals[0].user?.nama_lengkap}`);
        } else {
            console.log('❌❌ GAGAL! Approval Kosong.');
        }

        process.exit(0);

    } catch (err) {
        console.error('CRASH:', err);
        process.exit(1);
    }
}

testFlow();
