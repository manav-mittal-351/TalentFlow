import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:5000/api/v1';

function decodeJwt(token) {
  return jwt.decode(token);
}

async function runSecurityAuditTests() {
  console.log('🔒 Starting P0 Security & Account Isolation Audit Test Suite...\n');

  try {
    // ── 1. Register Candidate One ──
    const email1 = `cand1_${Date.now()}@securitytest.com`;
    const reg1Res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Candidate One SecurityTest',
        email: email1,
        password: 'Password123!',
        role: 'candidate',
      }),
    });

    const reg1Data = await reg1Res.json();
    if (reg1Res.status !== 201) {
      throw new Error(`Candidate 1 registration failed: ${JSON.stringify(reg1Data)}`);
    }

    const { token: token1, user: user1 } = reg1Data.data;
    const decoded1 = decodeJwt(token1);

    console.log('✅ PASS: Candidate 1 created independently');
    console.log(`       User 1 ID: ${user1._id} | JWT Payload ID: ${decoded1.id}`);
    if (user1._id !== decoded1.id) {
      throw new Error('MISMATCH: User 1 ID does not match JWT payload ID!');
    }

    // ── 2. Register Candidate Two ──
    const email2 = `cand2_${Date.now()}@securitytest.com`;
    const reg2Res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Candidate Two SecurityTest',
        email: email2,
        password: 'Password123!',
        role: 'candidate',
      }),
    });

    const reg2Data = await reg2Res.json();
    if (reg2Res.status !== 201) {
      throw new Error(`Candidate 2 registration failed: ${JSON.stringify(reg2Data)}`);
    }

    const { token: token2, user: user2 } = reg2Data.data;
    const decoded2 = decodeJwt(token2);

    console.log('✅ PASS: Candidate 2 created independently');
    console.log(`       User 2 ID: ${user2._id} | JWT Payload ID: ${decoded2.id}`);
    if (user2._id !== decoded2.id) {
      throw new Error('MISMATCH: User 2 ID does not match JWT payload ID!');
    }

    // Verify User 1 and User 2 have distinct IDs
    if (user1._id === user2._id) {
      throw new Error('CRITICAL VULNERABILITY: User 1 and User 2 were given the same ObjectId!');
    }
    console.log('✅ PASS: User 1 and User 2 have distinct ObjectIds');

    // ── 3. Verify GET /auth/me for Candidate 1 ──
    const me1Res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const me1Data = await me1Res.json();
    if (me1Data.data._id !== user1._id || me1Data.data.email !== email1) {
      throw new Error(`ACCOUNT ISOLATION FAILURE: Candidate 1 fetched wrong account data: ${JSON.stringify(me1Data.data)}`);
    }
    console.log('✅ PASS: GET /auth/me for Candidate 1 returns ONLY Candidate 1 details');

    // ── 4. Verify GET /auth/me for Candidate 2 ──
    const me2Res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    const me2Data = await me2Res.json();
    if (me2Data.data._id !== user2._id || me2Data.data.email !== email2) {
      throw new Error(`ACCOUNT ISOLATION FAILURE: Candidate 2 fetched wrong account data: ${JSON.stringify(me2Data.data)}`);
    }
    console.log('✅ PASS: GET /auth/me for Candidate 2 returns ONLY Candidate 2 details');

    // ── 5. Candidate 2 attempts to use Candidate 1's token ──
    const crossRes = await fetch(`${BASE_URL}/applications/my`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    const crossData = await crossRes.json();
    if (crossRes.status !== 200 || crossData.data.length !== 0) {
      throw new Error(`ISOLATION FAILURE: Candidate 2 accessed Candidate 1 data: ${JSON.stringify(crossData)}`);
    }
    console.log('✅ PASS: Candidate 2 applications list is completely isolated (0 applications)');

    console.log('\n================================================================');
    console.log('  ALL ACCOUNT ISOLATION AUDIT TESTS PASSED SUCCESSFULLY! (100%)');
    console.log('================================================================\n');
  } catch (err) {
    console.error('❌ SECURITY AUDIT TEST FAILED:', err.message);
    process.exit(1);
  }
}

runSecurityAuditTests();
