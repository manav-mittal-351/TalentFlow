// ─── test-users.mjs ───────────────────────────────────────────────────────────
// Module 9 — User / Profile: comprehensive integration test suite.
// Run: node test-users.mjs  (server must be running on port 5000)
//
// Covers:
//   PUT /users/profile: validations, portfolio/GitHub/LinkedIn format checks,
//     partial update semantics, role protection, isProfileComplete automatic updates.
//   POST /users/resume: file upload limits, invalid types, profile resumeUrl
//     updates, isProfileComplete automatic updates.
//   POST /users/saved-jobs/:jobId: save job, $addToSet validation (no duplicates).
//   DELETE /users/saved-jobs/:jobId: unsave job, $pull validation.
//   GET /users/saved-jobs: paginated list, check populate company and recruiter.

const BASE  = 'http://localhost:5000/api/v1';
const GREEN = '\x1b[32m'; const RED  = '\x1b[31m';
const CYAN  = '\x1b[36m'; const DIM  = '\x1b[2m'; const RESET = '\x1b[0m';

let passed = 0; let failed = 0;

function section(t) {
  console.log(`\n${CYAN}${'─'.repeat(64)}${RESET}\n${CYAN}  ${t}${RESET}\n${CYAN}${'─'.repeat(64)}${RESET}`);
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
  let data; try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, data };
}

// ─── Setup ────────────────────────────────────────────────────────────────────
const ts = Date.now();
const E = {
  recruiter: `usr_${ts}@test.com`,
  candidate: `usc_${ts}@test.com`,
  candidate2:`usc2_${ts}@test.com`,
};

let rToken = '', cToken = '', c2Token = '';
let jobId = '';
const DUMMY_PDF = Buffer.from('%PDF-1.4 test');
const DUMMY_PNG = Buffer.from('\x89PNG\r\n\x1a\n png dummy');

console.log('\n  Setting up users and jobs...');

{
  const [r, c, c2] = await Promise.all([
    req('POST', '/auth/register', { name: 'US Recruiter', email: E.recruiter, password: 'pass1234!', role: 'recruiter' }),
    req('POST', '/auth/register', { name: 'US Candidate', email: E.candidate, password: 'pass1234!', role: 'candidate' }),
    req('POST', '/auth/register', { name: 'US Candidate 2', email: E.candidate2, password: 'pass1234!', role: 'candidate' }),
  ]);

  rToken  = r.data.data?.token;
  cToken  = c.data.data?.token;
  c2Token = c2.data.data?.token;

  if (!rToken || !cToken) {
    console.error('  ❌ Setup failed: registration error'); process.exit(1);
  }

  // Recruiter creates company
  await req('POST', '/company', { name: 'US Test Co', website: 'https://ustest.co' }, { Authorization: `Bearer ${rToken}` });

  // Recruiter creates job
  const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const j = await req('POST', '/jobs', {
    title: 'Profile Engineer', department: 'Engineering',
    location: 'Remote', jobType: 'remote', status: 'published',
    description: 'Build user profiles', applicationDeadline: deadline,
  }, { Authorization: `Bearer ${rToken}` });
  jobId = j.data.data?._id;

  if (!jobId) { console.error('  ❌ Job creation failed'); process.exit(1); }

  console.log('  Setup complete.\n');
}

// ─────────────────────────────────────────────────────────────────────────────
section('PUT /users/profile — Candidate Profile updates');

// 1. No token → 401
{
  const { status } = await req('PUT', '/users/profile', { headline: 'Test' });
  if (status === 401) pass('PUT /users/profile without token → 401');
  else fail('No token guard', `${status}`);
}

// 2. Recruiter cannot update candidate profile → 403
{
  const { status, data } = await req('PUT', '/users/profile', { headline: 'Test' }, { Authorization: `Bearer ${rToken}` });
  if (status === 403 && data.errorCode === 'FORBIDDEN_ROLE')
    pass('Recruiter → PUT /users/profile → 403 FORBIDDEN_ROLE');
  else fail('Recruiter block', `${status}: ${JSON.stringify(data)}`);
}

// 3. Invalid field formats: invalid github link → 400
{
  const { status, data } = await req('PUT', '/users/profile', { githubUrl: 'https://gitlab.com/test' }, { Authorization: `Bearer ${cToken}` });
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('Invalid githubUrl → 400 VALIDATION_ERROR');
  else fail('Github validation', `${status}: ${JSON.stringify(data)}`);
}

// 4. Invalid field formats: invalid phone → 400
{
  const { status } = await req('PUT', '/users/profile', { phone: 'not-a-number' }, { Authorization: `Bearer ${cToken}` });
  if (status === 400) pass('Invalid phone → 400');
  else fail('Phone validation', `${status}`);
}

// 5. Successful partial profile update (all fields valid)
{
  const { status, data } = await req('PUT', '/users/profile',
    {
      headline:     'Full Stack Architect',
      bio:          '8+ years building enterprise APIs.',
      phone:        '+1-555-0199',
      location:     'Austin, TX',
      portfolioUrl: 'https://myport.dev',
      githubUrl:    'https://github.com/dbarchitect',
      linkedinUrl:  'https://linkedin.com/in/dbarchitect',
    },
    { Authorization: `Bearer ${cToken}` }
  );

  if (status === 200 && data.success && data.data?.profile) {
    pass('PUT /users/profile → 200 (Success)');
    const p = data.data.profile;
    if (p.headline === 'Full Stack Architect' && p.location === 'Austin, TX')
      pass('Profile fields correctly saved in user document');
    else fail('Profile fields mismatch', JSON.stringify(p));

    // resumeUrl is still empty, so isProfileComplete must be false
    if (p.isProfileComplete === false)
      pass('isProfileComplete stays false because resumeUrl is missing');
    else fail('isProfileComplete premature true', p.isProfileComplete);
  } else {
    fail('Successful update', `${status}: ${JSON.stringify(data)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
section('POST /users/resume — Resume Uploads');

// 6. Recruiter cannot upload resume → 403
{
  const fd = new FormData();
  fd.append('resume', new Blob([DUMMY_PDF], { type: 'application/pdf' }), 'cv.pdf');
  const res = await fetch(`${BASE}/users/resume`, {
    method: 'POST', headers: { Authorization: `Bearer ${rToken}` }, body: fd,
  });
  if (res.status === 403) pass('Recruiter upload resume → 403');
  else fail('Recruiter upload block', `${res.status}`);
}

// 7. Invalid file type (PNG) → 400 INVALID_FILE_TYPE
{
  const fd = new FormData();
  fd.append('resume', new Blob([DUMMY_PNG], { type: 'image/png' }), 'avatar.png');
  const res = await fetch(`${BASE}/users/resume`, {
    method: 'POST', headers: { Authorization: `Bearer ${cToken}` }, body: fd,
  });
  const data = await res.json();
  if (res.status === 400 && data.errorCode === 'INVALID_FILE_TYPE')
    pass('Upload PNG → 400 INVALID_FILE_TYPE');
  else fail('PNG validation', `${res.status}: ${JSON.stringify(data)}`);
}

// 8. Successful resume upload → updates profile.resumeUrl & completes profile
{
  const fd = new FormData();
  fd.append('resume', new Blob([DUMMY_PDF], { type: 'application/pdf' }), 'mycv.pdf');
  const res = await fetch(`${BASE}/users/resume`, {
    method: 'POST', headers: { Authorization: `Bearer ${cToken}` }, body: fd,
  });
  const data = await res.json();

  if (res.status === 200 && data.success && data.data?.resumeUrl) {
    pass('POST /users/resume → 200 (Success)');
    const p = data.data.profile;
    if (p.resumeUrl.includes('uploads/resumes/'))
      pass('resumeUrl contains uploads path');
    else fail('resumeUrl path incorrect', p.resumeUrl);

    // Headline, phone, location are filled, and now resumeUrl is set → isProfileComplete becomes true!
    if (p.isProfileComplete === true)
      pass('isProfileComplete toggles to true automatically');
    else fail('isProfileComplete did not toggle to true', JSON.stringify(p));
  } else {
    fail('Resume upload success', `${res.status}: ${JSON.stringify(data)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
section('POST/DELETE/GET saved-jobs — Saved Jobs list');

// 9. Recruiter cannot save a job → 403
{
  const { status } = await req('POST', `/users/saved-jobs/${jobId}`, null, { Authorization: `Bearer ${rToken}` });
  if (status === 403) pass('Recruiter save job → 403');
  else fail('Recruiter save job block', `${status}`);
}

// 10. Candidate 2 saves Job 1 → 200
{
  const { status, data } = await req('POST', `/users/saved-jobs/${jobId}`, null, { Authorization: `Bearer ${c2Token}` });
  if (status === 200 && Array.isArray(data.data) && data.data.includes(jobId))
    pass('POST /users/saved-jobs/:jobId → 200 (includes jobId)');
  else fail('Save job', `${status}: ${JSON.stringify(data)}`);
}

// 11. Duplicate save (POST again) → 200 and no duplicates ($addToSet check)
{
  const { status, data } = await req('POST', `/users/saved-jobs/${jobId}`, null, { Authorization: `Bearer ${c2Token}` });
  if (status === 200 && Array.isArray(data.data)) {
    const occ = data.data.filter(x => x === jobId).length;
    if (occ === 1) pass('Mongoose $addToSet restricts duplicates in savedJobs array');
    else fail('Duplicate array occurrences', `Got: ${occ}`);
  } else {
    fail('Duplicate save POST', `${status}: ${JSON.stringify(data)}`);
  }
}

// 12. Non-existent jobId save → 404
{
  const { status, data } = await req('POST', '/users/saved-jobs/6a000000000000000000000a', null, { Authorization: `Bearer ${c2Token}` });
  if (status === 404 && data.errorCode === 'JOB_NOT_FOUND')
    pass('Save non-existent job → 404 JOB_NOT_FOUND');
  else fail('Non-existent job save', `${status}: ${JSON.stringify(data)}`);
}

// 13. GET /users/saved-jobs → 200 paginated list populated correctly
{
  const { status, data } = await req('GET', '/users/saved-jobs', null, { Authorization: `Bearer ${c2Token}` });
  if (status === 200 && Array.isArray(data.data) && data.data.length === 1) {
    pass('GET /users/saved-jobs → 200 (Success)');
    const jobObj = data.data[0];
    if (jobObj.title === 'Profile Engineer' && typeof jobObj.company?.name === 'string' && jobObj.company?.name.length > 0)
      pass('Saved job item populated nested company details');
    else fail('Saved job item population', JSON.stringify(jobObj));

    if (data.pagination)
      pass('Pagination block populated');
    else fail('Missing pagination');
  } else {
    fail('GET saved jobs', `${status}: ${JSON.stringify(data)}`);
  }
}

// 14. Candidate 2 deletes saved job → 200
{
  const { status, data } = await req('DELETE', `/users/saved-jobs/${jobId}`, null, { Authorization: `Bearer ${c2Token}` });
  if (status === 200 && Array.isArray(data.data) && !data.data.includes(jobId)) {
    pass('DELETE /users/saved-jobs/:jobId → 200 (unsaved)');

    // Verify GET list now empty
    const check = await req('GET', '/users/saved-jobs', null, { Authorization: `Bearer ${c2Token}` });
    if (check.data.data?.length === 0)
      pass('GET saved jobs list verified empty after deletion');
    else fail('Saved jobs list after deletion', JSON.stringify(check.data));
  } else {
    fail('DELETE saved job', `${status}: ${JSON.stringify(data)}`);
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────
const total = passed + failed;
console.log(`\n${'═'.repeat(64)}`);
console.log(`  RESULTS:  ${GREEN}${passed} passed${RESET}  |  ${failed > 0 ? RED : GREEN}${failed} failed${RESET}  |  ${total} total`);
console.log(`${'═'.repeat(64)}\n`);

if (failed > 0) process.exit(1);
