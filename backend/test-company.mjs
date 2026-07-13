// ─── test-company.mjs ─────────────────────────────────────────────────────────
// Company Profile test suite — Module 2.
// Run while server is running: node test-company.mjs
// Covers all 3 documented endpoints + auth/authorization edge cases.

import mongoose from 'mongoose';
const MONGO_URI = 'mongodb+srv://manavmittal451:Manav-351-Mittal@cluster0.ucywxac.mongodb.net/talentflow';
console.log('Clearing companies collection to ensure POST /company succeeds...');
await mongoose.connect(MONGO_URI);
await mongoose.connection.collection('companies').deleteMany({});
await mongoose.disconnect();
console.log('Companies collection cleared.');

const BASE = 'http://localhost:5000/api/v1';

const GREEN  = '\x1b[32m'; const RED  = '\x1b[31m';
const CYAN   = '\x1b[36m'; const DIM  = '\x1b[2m'; const RESET = '\x1b[0m';

let passed = 0; let failed = 0;

function section(title) {
  console.log(`\n${CYAN}${'─'.repeat(60)}${RESET}\n${CYAN}  ${title}${RESET}\n${CYAN}${'─'.repeat(60)}${RESET}`);
}
function pass(label, detail = '') {
  passed++;
  console.log(`${GREEN}  ✅ PASS${RESET}  ${label}${detail ? `  ${DIM}${detail}${RESET}` : ''}`);
}
function fail(label, detail = '') {
  failed++;
  console.log(`${RED}  ❌ FAIL${RESET}  ${label}${detail ? `\n       ${RED}${detail}${RESET}` : ''}`);
}

async function req(method, path, body, headers = {}) {
  const opts = { method, headers: { 'Content-Type': 'application/json', ...headers } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  let data;
  try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, data };
}

// ─── Step 1: Register a recruiter + a candidate + a hiring_manager for tests ──
const ts = Date.now();
const recruiterEmail = `recruiter_${ts}@test.com`;
const candidateEmail = `candidate_${ts}@test.com`;
const hmEmail        = `hm_${ts}@test.com`;

let recruiterToken = '';
let candidateToken = '';
let hmToken        = '';

{
  const r1 = await req('POST', '/auth/register', { name: 'Test Recruiter', email: recruiterEmail, password: 'securePass123', role: 'recruiter' });
  recruiterToken = r1.data.data?.token ?? '';

  const r2 = await req('POST', '/auth/register', { name: 'Test Candidate', email: candidateEmail, password: 'securePass123', role: 'candidate' });
  candidateToken = r2.data.data?.token ?? '';

  const r3 = await req('POST', '/auth/register', { name: 'Test HM', email: hmEmail, password: 'securePass123', role: 'hiring_manager' });
  hmToken = r3.data.data?.token ?? '';

  if (recruiterToken && candidateToken && hmToken) {
    console.log(`\n  ${DIM}Test users registered. Running company tests...${RESET}`);
  } else {
    console.error(`  ❌ Failed to register test users. Aborting.`);
    process.exit(1);
  }
}

// ─── GET /company — Public ────────────────────────────────────────────────────
section('GET /company — Public');

// 1. GET with no auth — should always return 200
{
  const { status, data } = await req('GET', '/company');
  if (status === 200 && data.success) {
    pass('GET /company (public, no auth) → 200', data.data ? 'Company exists' : 'No company yet (null)');
  } else {
    fail('GET /company (public, no auth) → 200', `Got ${status}: ${JSON.stringify(data)}`);
  }
}

// 2. GET with a valid token also works (public route)
{
  const { status, data } = await req('GET', '/company', null, { Authorization: `Bearer ${candidateToken}` });
  if (status === 200 && data.success) {
    pass('GET /company (with valid token) → 200');
  } else {
    fail('GET /company (with valid token) → 200', `Got ${status}: ${JSON.stringify(data)}`);
  }
}

// ─── POST /company — Recruiter only ──────────────────────────────────────────
section('POST /company — Recruiter only');

// 3. No token → 401 NO_TOKEN
{
  const { status, data } = await req('POST', '/company', { name: 'TalentFlow Inc.' });
  if (status === 401 && data.errorCode === 'NO_TOKEN') {
    pass('POST /company without token → 401 NO_TOKEN');
  } else {
    fail('POST /company without token → 401 NO_TOKEN', `Got ${status}: ${JSON.stringify(data)}`);
  }
}

// 4. Candidate cannot create company → 403 FORBIDDEN_ROLE
{
  const { status, data } = await req('POST', '/company', { name: 'TalentFlow Inc.' }, { Authorization: `Bearer ${candidateToken}` });
  if (status === 403 && data.errorCode === 'FORBIDDEN_ROLE') {
    pass('Candidate → POST /company → 403 FORBIDDEN_ROLE');
  } else {
    fail('Candidate → POST /company → 403 FORBIDDEN_ROLE', `Got ${status}: ${JSON.stringify(data)}`);
  }
}

// 5. Hiring Manager cannot create company → 403 FORBIDDEN_ROLE
{
  const { status, data } = await req('POST', '/company', { name: 'TalentFlow Inc.' }, { Authorization: `Bearer ${hmToken}` });
  if (status === 403 && data.errorCode === 'FORBIDDEN_ROLE') {
    pass('Hiring Manager → POST /company → 403 FORBIDDEN_ROLE');
  } else {
    fail('Hiring Manager → POST /company → 403 FORBIDDEN_ROLE', `Got ${status}: ${JSON.stringify(data)}`);
  }
}

// 6. Recruiter — missing name → 400 VALIDATION_ERROR
{
  const { status, data } = await req('POST', '/company', {}, { Authorization: `Bearer ${recruiterToken}` });
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR') {
    pass('POST /company without name → 400 VALIDATION_ERROR');
  } else {
    fail('POST /company without name → 400 VALIDATION_ERROR', `Got ${status}: ${JSON.stringify(data)}`);
  }
}

// 7. Recruiter — invalid website URL → 400 VALIDATION_ERROR
{
  const { status, data } = await req('POST', '/company',
    { name: 'TalentFlow Inc.', website: 'not-a-url' },
    { Authorization: `Bearer ${recruiterToken}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR') {
    pass('POST /company with invalid website → 400 VALIDATION_ERROR');
  } else {
    fail('POST /company with invalid website → 400 VALIDATION_ERROR', `Got ${status}: ${JSON.stringify(data)}`);
  }
}

// 8. Recruiter — successful company creation
let companyCreated = false;
{
  const { status, data } = await req('POST', '/company', {
    name:        'TalentFlow Inc.',
    website:     'https://talentflow.app',
    location:    'Bangalore, India',
    industry:    'HR Technology',
    description: 'Next-generation recruitment management platform.',
  }, { Authorization: `Bearer ${recruiterToken}` });

  if (status === 201 && data.success && data.data?.name === 'TalentFlow Inc.') {
    companyCreated = true;
    pass('Recruiter POST /company → 201 Created', `name=${data.data.name}`);

    // Check response shape
    const c = data.data;
    if (c.createdAt && c.updatedAt) {
      pass('Company timestamps present', `createdAt=${c.createdAt}`);
    } else {
      fail('Company timestamps present', `createdAt=${c.createdAt}, updatedAt=${c.updatedAt}`);
    }

    if (c.isDeleted === false) {
      pass('isDeleted defaults to false');
    } else {
      fail('isDeleted defaults to false', `Got isDeleted=${c.isDeleted}`);
    }

    if (c.createdBy) {
      pass('createdBy field populated', `createdBy=${JSON.stringify(c.createdBy)}`);
    } else {
      fail('createdBy field present');
    }
  } else {
    fail('Recruiter POST /company → 201 Created', `Got ${status}: ${JSON.stringify(data)}`);
  }
}

// 9. Duplicate create → 409 COMPANY_ALREADY_EXISTS (V1: one company per instance)
if (companyCreated) {
  const { status, data } = await req('POST', '/company',
    { name: 'Another Company' },
    { Authorization: `Bearer ${recruiterToken}` }
  );
  if (status === 409 && data.errorCode === 'COMPANY_ALREADY_EXISTS') {
    pass('Duplicate POST /company → 409 COMPANY_ALREADY_EXISTS');
  } else {
    fail('Duplicate POST /company → 409 COMPANY_ALREADY_EXISTS', `Got ${status}: ${JSON.stringify(data)}`);
  }
}

// ─── GET /company (after creation) ───────────────────────────────────────────
section('GET /company — After creation');

// 10. Public GET now returns company data
{
  const { status, data } = await req('GET', '/company');
  if (status === 200 && data.data?.name === 'TalentFlow Inc.') {
    pass('GET /company returns company after creation', `name=${data.data.name}`);
    if (data.data.website === 'https://talentflow.app') {
      pass('Company website field correct');
    } else {
      fail('Company website field correct', `Got: ${data.data.website}`);
    }
  } else {
    fail('GET /company returns company after creation', `Got ${status}: ${JSON.stringify(data)}`);
  }
}

// ─── PATCH /company — Recruiter only ─────────────────────────────────────────
section('PATCH /company — Recruiter only (partial update)');

// 11. No token → 401
{
  const { status, data } = await req('PATCH', '/company', { industry: 'SaaS' });
  if (status === 401 && data.errorCode === 'NO_TOKEN') {
    pass('PATCH /company without token → 401 NO_TOKEN');
  } else {
    fail('PATCH /company without token → 401 NO_TOKEN', `Got ${status}: ${JSON.stringify(data)}`);
  }
}

// 12. Candidate → 403 FORBIDDEN_ROLE
{
  const { status, data } = await req('PATCH', '/company', { industry: 'SaaS' }, { Authorization: `Bearer ${candidateToken}` });
  if (status === 403 && data.errorCode === 'FORBIDDEN_ROLE') {
    pass('Candidate → PATCH /company → 403 FORBIDDEN_ROLE');
  } else {
    fail('Candidate → PATCH /company → 403 FORBIDDEN_ROLE', `Got ${status}: ${JSON.stringify(data)}`);
  }
}

// 13. Recruiter — invalid website in PATCH → 400
{
  const { status, data } = await req('PATCH', '/company',
    { website: 'ftp://invalid' },
    { Authorization: `Bearer ${recruiterToken}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR') {
    pass('PATCH /company with invalid website → 400 VALIDATION_ERROR');
  } else {
    fail('PATCH /company with invalid website → 400 VALIDATION_ERROR', `Got ${status}: ${JSON.stringify(data)}`);
  }
}

// 14. Recruiter — successful partial update (only update industry + description)
{
  const { status, data } = await req('PATCH', '/company', {
    industry:    'SaaS / HR Tech',
    description: 'Updated: AI-powered talent acquisition.',
  }, { Authorization: `Bearer ${recruiterToken}` });

  if (status === 200 && data.success && data.data?.industry === 'SaaS / HR Tech') {
    pass('Recruiter PATCH /company → 200 OK', `industry=${data.data.industry}`);

    // Verify other fields were NOT overwritten (partial update semantics)
    if (data.data.name === 'TalentFlow Inc.' && data.data.website === 'https://talentflow.app') {
      pass('PATCH preserves un-updated fields (partial update semantics)', `name=${data.data.name}`);
    } else {
      fail('PATCH preserves un-updated fields', `name=${data.data.name}, website=${data.data.website}`);
    }
  } else {
    fail('Recruiter PATCH /company → 200 OK', `Got ${status}: ${JSON.stringify(data)}`);
  }
}

// 15. GET confirms the update persisted
{
  const { status, data } = await req('GET', '/company');
  if (data.data?.industry === 'SaaS / HR Tech' && data.data?.description === 'Updated: AI-powered talent acquisition.') {
    pass('PATCH changes persisted in database', `industry=${data.data.industry}`);
  } else {
    fail('PATCH changes persisted in database', `industry=${data.data?.industry}`);
  }
}

// ─── Response shape checks ────────────────────────────────────────────────────
section('RESPONSE SHAPE — Company endpoints');

// 16. Success shape consistent
{
  const { data } = await req('GET', '/company');
  if (data.success === true && typeof data.message === 'string' && 'data' in data) {
    pass('Company success shape: { success, message, data }');
  } else {
    fail('Company success shape', JSON.stringify(data));
  }
}

// 17. Error shape on 403
{
  const { data } = await req('POST', '/company', { name: 'X' }, { Authorization: `Bearer ${candidateToken}` });
  if (data.success === false && data.errorCode && data.message) {
    pass('Company error shape: { success: false, message, errorCode }');
  } else {
    fail('Company error shape', JSON.stringify(data));
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────
const total = passed + failed;
console.log(`\n${'═'.repeat(60)}`);
console.log(`  RESULTS:  ${GREEN}${passed} passed${RESET}  |  ${failed > 0 ? RED : GREEN}${failed} failed${RESET}  |  ${total} total`);
console.log(`${'═'.repeat(60)}\n`);

if (failed > 0) process.exit(1);
