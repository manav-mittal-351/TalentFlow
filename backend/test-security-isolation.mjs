import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:5000/api/v1';

function decodeJwt(token) {
  return jwt.decode(token);
}

async function runSecurityAuditTests() {
  console.log('🔒 Starting Multi-Role Registration & Account Isolation Test Suite...\n');

  try {
    // ── 1. Register Candidate ──
    const emailCandidate = `cand_${Date.now()}@test.com`;
    const regCandRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Candidate Test User',
        email: emailCandidate,
        password: 'Password123!',
        role: 'candidate',
      }),
    });

    const regCandData = await regCandRes.json();
    if (regCandRes.status !== 201) throw new Error(`Candidate reg failed: ${JSON.stringify(regCandData)}`);

    const { token: tokenCand, user: userCand } = regCandData.data;
    const decodedCand = decodeJwt(tokenCand);

    console.log('✅ PASS: Candidate registered successfully');
    console.log(`       Role: ${userCand.role} | JWT Claim Role: ${decodedCand.role}`);
    if (userCand.role !== 'candidate' || decodedCand.role !== 'candidate') {
      throw new Error('Role mismatch in candidate registration!');
    }

    // ── 2. Register Recruiter ──
    const emailRecruiter = `rec_${Date.now()}@test.com`;
    const regRecRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Recruiter Test User',
        email: emailRecruiter,
        password: 'Password123!',
        role: 'recruiter',
      }),
    });

    const regRecData = await regRecRes.json();
    if (regRecRes.status !== 201) throw new Error(`Recruiter reg failed: ${JSON.stringify(regRecData)}`);

    const { token: tokenRec, user: userRec } = regRecData.data;
    const decodedRec = decodeJwt(tokenRec);

    console.log('✅ PASS: Recruiter registered successfully');
    console.log(`       Role: ${userRec.role} | JWT Claim Role: ${decodedRec.role}`);
    if (userRec.role !== 'recruiter' || decodedRec.role !== 'recruiter') {
      throw new Error('Role mismatch in recruiter registration!');
    }

    // ── 3. Register Hiring Manager ──
    const emailHM = `hm_${Date.now()}@test.com`;
    const regHMRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hiring Manager Test User',
        email: emailHM,
        password: 'Password123!',
        role: 'hiring_manager',
        department: 'Engineering',
      }),
    });

    const regHMData = await regHMRes.json();
    if (regHMRes.status !== 201) throw new Error(`HM reg failed: ${JSON.stringify(regHMData)}`);

    const { token: tokenHM, user: userHM } = regHMData.data;
    const decodedHM = decodeJwt(tokenHM);

    console.log('✅ PASS: Hiring Manager registered successfully');
    console.log(`       Role: ${userHM.role} | Dept: ${userHM.department} | JWT Claim Role: ${decodedHM.role}`);
    if (userHM.role !== 'hiring_manager' || decodedHM.role !== 'hiring_manager' || userHM.department !== 'Engineering') {
      throw new Error('Role/Department mismatch in HM registration!');
    }

    // ── 4. Reject Invalid Role ──
    const invalidRoleRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker User',
        email: `hacker_${Date.now()}@test.com`,
        password: 'Password123!',
        role: 'super_admin',
      }),
    });

    if (invalidRoleRes.status !== 400) {
      throw new Error(`SECURITY VULNERABILITY: Invalid role 'super_admin' accepted with status ${invalidRoleRes.status}!`);
    }
    console.log('✅ PASS: Invalid role "super_admin" rejected with 400 Bad Request');

    // ── 5. Verify Route Protection / Authorization Scoping ──
    // Candidate cannot access Recruiter jobs
    const candRecRouteRes = await fetch(`${BASE_URL}/jobs/recruiter/all`, {
      headers: { Authorization: `Bearer ${tokenCand}` },
    });
    if (candRecRouteRes.status !== 403) {
      throw new Error(`AUTHORIZATION VULNERABILITY: Candidate accessed recruiter route with status ${candRecRouteRes.status}`);
    }
    console.log('✅ PASS: Candidate blocked from Recruiter route (403 Forbidden)');

    // Recruiter cannot access HM dashboard route
    const recHMRouteRes = await fetch(`${BASE_URL}/dashboard/hiring-manager`, {
      headers: { Authorization: `Bearer ${tokenRec}` },
    });
    if (recHMRouteRes.status !== 403) {
      throw new Error(`AUTHORIZATION VULNERABILITY: Recruiter accessed HM dashboard route with status ${recHMRouteRes.status}`);
    }
    console.log('✅ PASS: Recruiter blocked from Hiring Manager route (403 Forbidden)');

    // HM cannot access Candidate applications route
    const hmCandRouteRes = await fetch(`${BASE_URL}/applications/my`, {
      headers: { Authorization: `Bearer ${tokenHM}` },
    });
    if (hmCandRouteRes.status !== 403) {
      throw new Error(`AUTHORIZATION VULNERABILITY: HM accessed Candidate route with status ${hmCandRouteRes.status}`);
    }
    console.log('✅ PASS: Hiring Manager blocked from Candidate route (403 Forbidden)');

    console.log('\n================================================================');
    console.log('  MULTI-ROLE REGISTRATION & ROUTE SECURITY TESTS PASSED! (100%)');
    console.log('================================================================\n');
  } catch (err) {
    console.error('❌ TEST FAILED:', err.message);
    process.exit(1);
  }
}

runSecurityAuditTests();
