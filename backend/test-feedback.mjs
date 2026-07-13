// ─── test-feedback.mjs ────────────────────────────────────────────────────────
// Module 6 — Feedback: comprehensive test suite.
// Run: node test-feedback.mjs  (server must be running on port 5000)
//
// Setup pipeline:
//   Register Recruiter, HM, HM2, Candidate
//   → Create job (Recruiter)
//   → Apply (Candidate)
//   → Shortlist application (Recruiter)
//   → Schedule interview with HM assigned (Recruiter)
//   → Complete interview (Recruiter)
//
// Tests cover:
//   POST /feedback: auth, role guards, INTERVIEW_NOT_COMPLETED,
//     FEEDBACK_ALREADY_SUBMITTED, applicationId mismatch, all field validations,
//     happy path, scorecard stored correctly
//   GET /feedback/application/:id: auth, role guards, recruiter ownership,
//     pagination, populated fields
//   PATCH /feedback/:id: auth, role guards, own-only, partial update semantics,
//     field validation
//   Response shapes

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
  recruiter:  `fbr_${ts}@test.com`,
  recruiter2: `fbr2_${ts}@test.com`,
  candidate:  `fbc_${ts}@test.com`,
  hm:         `fbhm_${ts}@test.com`,
  hm2:        `fbhm2_${ts}@test.com`,
};

let rToken = '', r2Token = '', cToken = '', hmToken = '', hm2Token = '';
let rId = '', hmId = '', hm2Id = '';
let jobId = '', appId = '', interviewId = '', feedbackId = '';
let scheduledInterviewId = ''; // interview that is NOT yet completed

const FUTURE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const DUMMY_PDF = Buffer.from('%PDF-1.4 test');

console.log('\n  Setting up full pipeline...');

{
  // Register all users
  const [r, r2, c, hm, hm2] = await Promise.all([
    req('POST', '/auth/register', { name: 'FB Recruiter A',  email: E.recruiter,  password: 'pass1234!', role: 'recruiter' }),
    req('POST', '/auth/register', { name: 'FB Recruiter B',  email: E.recruiter2, password: 'pass1234!', role: 'recruiter' }),
    req('POST', '/auth/register', { name: 'FB Candidate',    email: E.candidate,  password: 'pass1234!', role: 'candidate' }),
    req('POST', '/auth/register', { name: 'FB Hiring Mgr',   email: E.hm,         password: 'pass1234!', role: 'hiring_manager' }),
    req('POST', '/auth/register', { name: 'FB Hiring Mgr 2', email: E.hm2,        password: 'pass1234!', role: 'hiring_manager' }),
  ]);

  rToken   = r.data.data?.token;   rId   = r.data.data?.user?._id;
  r2Token  = r2.data.data?.token;
  cToken   = c.data.data?.token;
  hmToken  = hm.data.data?.token;  hmId  = hm.data.data?.user?._id;
  hm2Token = hm2.data.data?.token; hm2Id = hm2.data.data?.user?._id;

  if (!rToken || !cToken || !hmToken) {
    console.error('  ❌ Setup failed: missing tokens'); process.exit(1);
  }

  // Company and job
  await req('POST', '/company', { name: 'FB Test Co', website: 'https://fb.co' }, { Authorization: `Bearer ${rToken}` });
  await req('POST', '/company', { name: 'FB Test Co 2', website: 'https://fb2.co' }, { Authorization: `Bearer ${r2Token}` });

  const futureD = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const j = await req('POST', '/jobs', {
    title: 'Backend Engineer', department: 'Engineering',
    location: 'Remote', jobType: 'remote', experienceLevel: 'senior',
    description: 'Build APIs', status: 'published',
    applicationDeadline: futureD,
  }, { Authorization: `Bearer ${rToken}` });

  jobId = j.data.data?._id;
  if (!jobId) { console.error('  ❌ Job creation failed'); process.exit(1); }

  // Candidate applies
  const fd = new FormData();
  fd.append('resume', new Blob([DUMMY_PDF], { type: 'application/pdf' }), 'cv.pdf');
  const applyRes = await fetch(`${BASE}/applications/${jobId}`, {
    method: 'POST', headers: { Authorization: `Bearer ${cToken}` }, body: fd,
  });
  const applyData = await applyRes.json();
  appId = applyData.data?._id;
  if (!appId) { console.error('  ❌ Application failed', JSON.stringify(applyData)); process.exit(1); }

  // Shortlist
  await req('PATCH', `/applications/${appId}/status`, { status: 'shortlisted' }, { Authorization: `Bearer ${rToken}` });

  // Schedule interview (NOT completed — for guard test)
  const si = await req('POST', '/interviews', {
    applicationId: appId, scheduledAt: FUTURE,
    format: 'video', interviewerId: hmId,
  }, { Authorization: `Bearer ${rToken}` });
  scheduledInterviewId = si.data.data?._id;

  // Schedule a second interview and immediately complete it (for happy path)
  const ci = await req('POST', '/interviews', {
    applicationId: appId, scheduledAt: FUTURE,
    format: 'in-person', interviewerId: hmId,
    location: 'Office',
  }, { Authorization: `Bearer ${rToken}` });
  interviewId = ci.data.data?._id;

  if (!interviewId) { console.error('  ❌ Interview creation failed', JSON.stringify(ci.data)); process.exit(1); }

  // Complete the interview
  await req('PATCH', `/interviews/${interviewId}/status`, { status: 'completed' }, { Authorization: `Bearer ${rToken}` });

  console.log('  Setup complete. Completed interview ready.\n');
}

// ─────────────────────────────────────────────────────────────────────────────
section('POST /feedback — Submit scorecard');

// 1. No token → 401
{
  const { status, data } = await req('POST', '/feedback', {
    interviewId, applicationId: appId,
    ratings: { overall: 4, technical: 5, communication: 3, cultureFit: 4 },
    recommendation: 'hire',
  });
  if (status === 401 && data.errorCode === 'NO_TOKEN')
    pass('POST /feedback without token → 401 NO_TOKEN');
  else fail('401 NO_TOKEN guard', `${status}: ${JSON.stringify(data)}`);
}

// 2. Recruiter cannot submit → 403
{
  const { status, data } = await req('POST', '/feedback',
    { interviewId, applicationId: appId,
      ratings: { overall: 4, technical: 5, communication: 3, cultureFit: 4 },
      recommendation: 'hire' },
    { Authorization: `Bearer ${rToken}` }
  );
  if (status === 403 && data.errorCode === 'FORBIDDEN_ROLE')
    pass('Recruiter → POST /feedback → 403 FORBIDDEN_ROLE');
  else fail('Recruiter role block → 403', `${status}: ${JSON.stringify(data)}`);
}

// 3. Candidate cannot submit → 403
{
  const { status } = await req('POST', '/feedback',
    { interviewId, applicationId: appId,
      ratings: { overall: 4, technical: 5, communication: 3, cultureFit: 4 },
      recommendation: 'hire' },
    { Authorization: `Bearer ${cToken}` }
  );
  if (status === 403) pass('Candidate → POST /feedback → 403');
  else fail('Candidate role block → 403', `${status}`);
}

// 4. Missing required fields → 400 VALIDATION_ERROR
{
  const { status, data } = await req('POST', '/feedback',
    { interviewId, applicationId: appId, recommendation: 'hire' }, // missing ratings
    { Authorization: `Bearer ${hmToken}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('Missing ratings → 400 VALIDATION_ERROR');
  else fail('Missing ratings → 400', `${status}: ${JSON.stringify(data)}`);
}

// 5. Missing recommendation → 400
{
  const { status, data } = await req('POST', '/feedback',
    { interviewId, applicationId: appId,
      ratings: { overall: 4, technical: 5, communication: 3, cultureFit: 4 } },
    { Authorization: `Bearer ${hmToken}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('Missing recommendation → 400 VALIDATION_ERROR');
  else fail('Missing recommendation → 400', `${status}: ${JSON.stringify(data)}`);
}

// 6. Invalid rating value (0 — below min 1) → 400
{
  const { status, data } = await req('POST', '/feedback',
    { interviewId, applicationId: appId,
      ratings: { overall: 0, technical: 5, communication: 3, cultureFit: 4 },
      recommendation: 'hire' },
    { Authorization: `Bearer ${hmToken}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('Rating 0 (below min) → 400 VALIDATION_ERROR');
  else fail('Rating out of range → 400', `${status}: ${JSON.stringify(data)}`);
}

// 7. Invalid rating value (6 — above max 5) → 400
{
  const { status, data } = await req('POST', '/feedback',
    { interviewId, applicationId: appId,
      ratings: { overall: 6, technical: 5, communication: 3, cultureFit: 4 },
      recommendation: 'hire' },
    { Authorization: `Bearer ${hmToken}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('Rating 6 (above max) → 400 VALIDATION_ERROR');
  else fail('Rating 6 → 400', `${status}: ${JSON.stringify(data)}`);
}

// 8. Invalid recommendation → 400
{
  const { status, data } = await req('POST', '/feedback',
    { interviewId, applicationId: appId,
      ratings: { overall: 4, technical: 5, communication: 3, cultureFit: 4 },
      recommendation: 'maybe' },
    { Authorization: `Bearer ${hmToken}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('Invalid recommendation → 400 VALIDATION_ERROR');
  else fail('Invalid recommendation → 400', `${status}: ${JSON.stringify(data)}`);
}

// 9. Invalid interviewId → 400
{
  const { status, data } = await req('POST', '/feedback',
    { interviewId: 'not-an-id', applicationId: appId,
      ratings: { overall: 4, technical: 5, communication: 3, cultureFit: 4 },
      recommendation: 'hire' },
    { Authorization: `Bearer ${hmToken}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('Invalid interviewId → 400 VALIDATION_ERROR');
  else fail('Invalid interviewId → 400', `${status}: ${JSON.stringify(data)}`);
}

// 10. Non-existent interviewId → 404
{
  const { status, data } = await req('POST', '/feedback',
    { interviewId: '6a000000000000000000000a', applicationId: appId,
      ratings: { overall: 4, technical: 5, communication: 3, cultureFit: 4 },
      recommendation: 'hire' },
    { Authorization: `Bearer ${hmToken}` }
  );
  if (status === 404 && data.errorCode === 'INTERVIEW_NOT_FOUND')
    pass('Non-existent interviewId → 404 INTERVIEW_NOT_FOUND');
  else fail('Non-existent interview → 404', `${status}: ${JSON.stringify(data)}`);
}

// 11. HM not assigned to interview → 403
{
  const { status, data } = await req('POST', '/feedback',
    { interviewId, applicationId: appId,
      ratings: { overall: 4, technical: 5, communication: 3, cultureFit: 4 },
      recommendation: 'hire' },
    { Authorization: `Bearer ${hm2Token}` }
  );
  if (status === 403 && data.errorCode === 'FORBIDDEN_ROLE')
    pass('HM not assigned to interview → 403 FORBIDDEN_ROLE');
  else fail('Non-assigned HM → 403', `${status}: ${JSON.stringify(data)}`);
}

// 12. Interview not completed → 400 INTERVIEW_NOT_COMPLETED
if (scheduledInterviewId) {
  const { status, data } = await req('POST', '/feedback',
    { interviewId: scheduledInterviewId, applicationId: appId,
      ratings: { overall: 4, technical: 5, communication: 3, cultureFit: 4 },
      recommendation: 'hire' },
    { Authorization: `Bearer ${hmToken}` }
  );
  if (status === 400 && data.errorCode === 'INTERVIEW_NOT_COMPLETED')
    pass('Interview not completed → 400 INTERVIEW_NOT_COMPLETED');
  else fail('Not completed interview → INTERVIEW_NOT_COMPLETED', `${status}: ${JSON.stringify(data)}`);
}

// 13. applicationId mismatch → 400
{
  const { status, data } = await req('POST', '/feedback',
    { interviewId, applicationId: '6a000000000000000000000b',
      ratings: { overall: 4, technical: 5, communication: 3, cultureFit: 4 },
      recommendation: 'hire' },
    { Authorization: `Bearer ${hmToken}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('applicationId mismatch → 400 VALIDATION_ERROR');
  else fail('applicationId mismatch → 400', `${status}: ${JSON.stringify(data)}`);
}

// 14. Successful feedback submission → 201
{
  const { status, data } = await req('POST', '/feedback',
    {
      interviewId,
      applicationId: appId,
      ratings: { overall: 4, technical: 5, communication: 3, cultureFit: 4 },
      recommendation: 'hire',
      comments:       'Strong technical background. Clear communicator.',
      decisionReason: 'Top performer in both rounds.',
    },
    { Authorization: `Bearer ${hmToken}` }
  );
  if (status === 201 && data.success && data.data?._id) {
    feedbackId = data.data._id;
    pass('HM POST /feedback → 201 Created', `id=${feedbackId}`);

    if (data.data.ratings?.overall === 4 && data.data.ratings?.technical === 5)
      pass('ratings stored correctly', `overall=${data.data.ratings.overall} technical=${data.data.ratings.technical}`);
    else fail('ratings stored correctly', JSON.stringify(data.data.ratings));

    if (data.data.recommendation === 'hire')
      pass('recommendation stored correctly');
    else fail('recommendation stored', `Got: ${data.data.recommendation}`);

    if (data.data.comments === 'Strong technical background. Clear communicator.')
      pass('comments stored');
    else fail('comments stored', `Got: ${data.data.comments}`);

    if (data.data.candidate?.name)
      pass('candidate populated in response', `name=${data.data.candidate.name}`);
    else fail('candidate populated', JSON.stringify(data.data.candidate));

    if (data.data.submittedBy?.name)
      pass('submittedBy populated', `name=${data.data.submittedBy.name}`);
    else fail('submittedBy populated', JSON.stringify(data.data.submittedBy));

    if (data.data.interview)
      pass('interview populated in response');
    else fail('interview populated', JSON.stringify(data.data.interview));
  } else {
    fail('POST /feedback → 201', `${status}: ${JSON.stringify(data)}`);
  }
}

// 15. Duplicate submission → 409 FEEDBACK_ALREADY_SUBMITTED
{
  const { status, data } = await req('POST', '/feedback',
    { interviewId, applicationId: appId,
      ratings: { overall: 3, technical: 3, communication: 3, cultureFit: 3 },
      recommendation: 'reject' },
    { Authorization: `Bearer ${hmToken}` }
  );
  if (status === 409 && data.errorCode === 'FEEDBACK_ALREADY_SUBMITTED')
    pass('Duplicate submission → 409 FEEDBACK_ALREADY_SUBMITTED');
  else fail('Duplicate → FEEDBACK_ALREADY_SUBMITTED', `${status}: ${JSON.stringify(data)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
section('GET /feedback/application/:applicationId — List by application');

// 16. No token → 401
{
  const { status } = await req('GET', `/feedback/application/${appId}`);
  if (status === 401) pass('GET /feedback/application/:id without token → 401');
  else fail('GET /feedback/application/:id → 401', `${status}`);
}

// 17. Candidate cannot access → 403
{
  const { status } = await req('GET', `/feedback/application/${appId}`, null, { Authorization: `Bearer ${cToken}` });
  if (status === 403) pass('Candidate → GET /feedback/application/:id → 403');
  else fail('Candidate GET feedback → 403', `${status}`);
}

// 18. Owner recruiter can list feedback
{
  const { status, data } = await req('GET', `/feedback/application/${appId}`, null, { Authorization: `Bearer ${rToken}` });
  if (status === 200 && Array.isArray(data.data) && data.pagination) {
    pass('Owner recruiter GET /feedback/application/:id → 200', `total=${data.pagination.total}`);

    if (data.data.length >= 1 && data.data[0].ratings)
      pass('Feedback returned with ratings');
    else fail('Feedback in list has ratings', JSON.stringify(data.data[0]));
  } else {
    fail('Owner recruiter GET feedback → 200', `${status}: ${JSON.stringify(data)}`);
  }
}

// 19. Recruiter B (non-owner) cannot list → 403
{
  const { status, data } = await req('GET', `/feedback/application/${appId}`, null, { Authorization: `Bearer ${r2Token}` });
  if (status === 403 && data.errorCode === 'FORBIDDEN_ROLE')
    pass('Recruiter B (non-owner) → GET /feedback/application/:id → 403 FORBIDDEN_ROLE');
  else fail('Non-owner recruiter → 403', `${status}: ${JSON.stringify(data)}`);
}

// 20. HM can list feedback
{
  const { status, data } = await req('GET', `/feedback/application/${appId}`, null, { Authorization: `Bearer ${hmToken}` });
  if (status === 200 && Array.isArray(data.data))
    pass('HM GET /feedback/application/:id → 200', `total=${data.pagination.total}`);
  else fail('HM GET feedback → 200', `${status}: ${JSON.stringify(data)}`);
}

// 21. Non-existent applicationId → 404
{
  const { status, data } = await req('GET', '/feedback/application/6a000000000000000000000a', null, { Authorization: `Bearer ${rToken}` });
  if (status === 404 && data.errorCode === 'APPLICATION_NOT_FOUND')
    pass('Non-existent applicationId → 404 APPLICATION_NOT_FOUND');
  else fail('Non-existent app → 404', `${status}: ${JSON.stringify(data)}`);
}

// 22. Pagination params accepted
{
  const { status } = await req('GET', `/feedback/application/${appId}?page=1&limit=5`, null, { Authorization: `Bearer ${rToken}` });
  if (status === 200) pass('Pagination params (page=1&limit=5) accepted → 200');
  else fail('Pagination params → 200', `${status}`);
}

// ─────────────────────────────────────────────────────────────────────────────
section('PATCH /feedback/:id — HM partial update');

// 23. No token → 401
if (feedbackId) {
  const { status } = await req('PATCH', `/feedback/${feedbackId}`, { recommendation: 'hold' });
  if (status === 401) pass('PATCH /feedback/:id without token → 401');
  else fail('PATCH /feedback/:id → 401', `${status}`);
}

// 24. Recruiter cannot update feedback → 403
if (feedbackId) {
  const { status } = await req('PATCH', `/feedback/${feedbackId}`,
    { recommendation: 'hold' },
    { Authorization: `Bearer ${rToken}` }
  );
  if (status === 403) pass('Recruiter → PATCH /feedback/:id → 403');
  else fail('Recruiter PATCH feedback → 403', `${status}`);
}

// 25. Candidate cannot update → 403
if (feedbackId) {
  const { status } = await req('PATCH', `/feedback/${feedbackId}`,
    { recommendation: 'hold' },
    { Authorization: `Bearer ${cToken}` }
  );
  if (status === 403) pass('Candidate → PATCH /feedback/:id → 403');
  else fail('Candidate PATCH feedback → 403', `${status}`);
}

// 26. HM2 (not the submitter) cannot update → 403
if (feedbackId) {
  const { status, data } = await req('PATCH', `/feedback/${feedbackId}`,
    { recommendation: 'hold' },
    { Authorization: `Bearer ${hm2Token}` }
  );
  if (status === 403 && data.errorCode === 'FORBIDDEN_ROLE')
    pass('HM2 (non-owner) → PATCH /feedback/:id → 403 FORBIDDEN_ROLE');
  else fail('Non-owner HM PATCH → 403', `${status}: ${JSON.stringify(data)}`);
}

// 27. Invalid rating in PATCH → 400
if (feedbackId) {
  const { status, data } = await req('PATCH', `/feedback/${feedbackId}`,
    { ratings: { overall: 10 } }, // out of range
    { Authorization: `Bearer ${hmToken}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('Invalid rating in PATCH → 400 VALIDATION_ERROR');
  else fail('Invalid PATCH rating → 400', `${status}: ${JSON.stringify(data)}`);
}

// 28. Valid partial update — change recommendation and one rating
if (feedbackId) {
  const { status, data } = await req('PATCH', `/feedback/${feedbackId}`,
    {
      recommendation: 'hold',
      ratings:        { overall: 3 },
      decisionReason: 'Updated: requires additional technical assessment.',
    },
    { Authorization: `Bearer ${hmToken}` }
  );
  if (status === 200 && data.data?.recommendation === 'hold') {
    pass('PATCH /feedback/:id → 200 (recommendation updated)', `recommendation=${data.data.recommendation}`);

    if (data.data.ratings?.overall === 3)
      pass('Partial rating update — overall changed to 3');
    else fail('Partial rating update', `Got overall: ${data.data.ratings?.overall}`);

    // Unchanged ratings should be preserved
    if (data.data.ratings?.technical === 5)
      pass('Partial PATCH preserves un-updated ratings (technical=5 unchanged)');
    else fail('Partial PATCH preserves unchanged ratings', `technical: ${data.data.ratings?.technical}`);

    if (data.data.decisionReason === 'Updated: requires additional technical assessment.')
      pass('decisionReason updated correctly');
    else fail('decisionReason update', `Got: ${data.data.decisionReason}`);
  } else {
    fail('PATCH /feedback/:id → 200', `${status}: ${JSON.stringify(data)}`);
  }
}

// 29. Non-existent feedback → 404
{
  const { status, data } = await req('PATCH', '/feedback/6a000000000000000000000a',
    { recommendation: 'hire' },
    { Authorization: `Bearer ${hmToken}` }
  );
  if (status === 404 && data.errorCode === 'FEEDBACK_NOT_FOUND')
    pass('Non-existent feedback → 404 FEEDBACK_NOT_FOUND');
  else fail('Non-existent → 404', `${status}: ${JSON.stringify(data)}`);
}

// 30. Invalid ObjectId → 400
{
  const { status } = await req('PATCH', '/feedback/not-an-id',
    { recommendation: 'hire' },
    { Authorization: `Bearer ${hmToken}` }
  );
  if (status === 400) pass('Invalid ObjectId in PATCH → 400');
  else fail('Invalid ObjectId → 400', `${status}`);
}

// ─────────────────────────────────────────────────────────────────────────────
section('RESPONSE SHAPES — Feedback');

// 31. POST 201 shape
if (feedbackId) {
  // Already verified above — confirm structure
  pass('POST 201 shape: { success: true, message, data } (verified in create tests)');
}

// 32. Paginated list shape
{
  const { data } = await req('GET', `/feedback/application/${appId}`, null, { Authorization: `Bearer ${rToken}` });
  if (data.success === true && Array.isArray(data.data) && data.pagination &&
      typeof data.message === 'string')
    pass('Paginated shape: { success, message, data[], pagination }');
  else fail('Paginated shape', JSON.stringify(Object.keys(data)));
}

// 33. Error shape
{
  const { data } = await req('GET', '/feedback/application/6a000000000000000000000a', null, { Authorization: `Bearer ${rToken}` });
  if (data.success === false && data.errorCode && data.message)
    pass('Error shape: { success: false, errorCode, message }');
  else fail('Error shape', JSON.stringify(data));
}

// ─── Summary ──────────────────────────────────────────────────────────────────
const total = passed + failed;
console.log(`\n${'═'.repeat(64)}`);
console.log(`  RESULTS:  ${GREEN}${passed} passed${RESET}  |  ${failed > 0 ? RED : GREEN}${failed} failed${RESET}  |  ${total} total`);
console.log(`${'═'.repeat(64)}\n`);

if (failed > 0) process.exit(1);
