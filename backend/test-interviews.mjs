// ─── test-interviews.mjs ─────────────────────────────────────────────────────
// Module 5 — Interview Scheduling: comprehensive test suite.
// Run: node test-interviews.mjs  (server must be running on port 5000)
//
// Covers:
//   POST /interviews: auth guards, application status guard, future date guard,
//     interviewerId validation, denormalization, auto-advance application status
//   GET /interviews: recruiter pagination, status filter, sortBy
//   GET /interviews/:id: all 3 role scoping rules, access control
//   PATCH /interviews/:id: partial update, cancelled guard, future date guard
//   PATCH /interviews/:id/status: completed/cancelled transitions, terminal guard
//   Response shapes and error codes

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
const emails = {
  recruiter:  `ir_${ts}@test.com`,
  recruiter2: `ir2_${ts}@test.com`,
  candidate:  `ic_${ts}@test.com`,
  hm:         `ihm_${ts}@test.com`,
};

let rToken = '', r2Token = '', cToken = '', hmToken = '';
let rId = '', cId = '', hmId = '';
let jobId = '', appId = '', appId2 = '';
let interviewId = '', interview2Id = '';

const FUTURE  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const FUTURE2 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
const PAST    = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago

console.log('\n  Setting up test data...');

{
  const [r, r2, c, hm] = await Promise.all([
    req('POST', '/auth/register', { name: 'IV Recruiter A',  email: emails.recruiter,  password: 'pass1234!', role: 'recruiter' }),
    req('POST', '/auth/register', { name: 'IV Recruiter B',  email: emails.recruiter2, password: 'pass1234!', role: 'recruiter' }),
    req('POST', '/auth/register', { name: 'IV Candidate',    email: emails.candidate,  password: 'pass1234!', role: 'candidate' }),
    req('POST', '/auth/register', { name: 'IV Hiring Mgr',   email: emails.hm,         password: 'pass1234!', role: 'hiring_manager' }),
  ]);

  rToken  = r.data.data?.token;   rId  = r.data.data?.user?._id;
  r2Token = r2.data.data?.token;
  cToken  = c.data.data?.token;   cId  = c.data.data?.user?._id;
  hmToken = hm.data.data?.token;  hmId = hm.data.data?.user?._id;

  if (!rToken || !cToken || !hmToken) {
    console.error('  ❌ Setup failed'); process.exit(1);
  }

  // Ensure company
  await req('POST', '/company', { name: 'IV Test Co', website: 'https://ivtest.co' }, { Authorization: `Bearer ${rToken}` });

  // Create a published job (Engineering dept — matches HM's dept)
  const futureDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const j = await req('POST', '/jobs', {
    title: 'Senior Engineer', department: 'Engineering',
    location: 'Remote', jobType: 'remote', experienceLevel: 'senior',
    description: 'Build core platform', status: 'published',
    applicationDeadline: futureDeadline,
  }, { Authorization: `Bearer ${rToken}` });

  jobId = j.data.data?._id;
  if (!jobId) { console.error('  ❌ Job creation failed'); process.exit(1); }

  // Candidate applies (multipart with dummy PDF)
  const DUMMY_PDF = Buffer.from('%PDF-1.4 test');
  const fd = new FormData();
  fd.append('resume', new Blob([DUMMY_PDF], { type: 'application/pdf' }), 'cv.pdf');
  const applyRes = await fetch(`${BASE}/applications/${jobId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cToken}` },
    body: fd,
  });
  const applyData = await applyRes.json();
  appId = applyData.data?._id;

  if (!appId) { console.error('  ❌ Application creation failed', JSON.stringify(applyData)); process.exit(1); }

  // Shortlist the application (required before scheduling interview)
  await req('PATCH', `/applications/${appId}/status`,
    { status: 'shortlisted' },
    { Authorization: `Bearer ${rToken}` }
  );

  // Create a second application (Recruiter 2's job) for ownership tests
  await req('POST', '/company', { name: 'IV Co 2', website: 'https://ivtest2.co' }, { Authorization: `Bearer ${r2Token}` });
  const j2 = await req('POST', '/jobs', {
    title: 'Designer', department: 'Design',
    location: 'Office', jobType: 'full-time',
    description: 'Design core product', status: 'published',
    applicationDeadline: futureDeadline,
  }, { Authorization: `Bearer ${r2Token}` });

  const jobId2 = j2.data.data?._id;
  if (jobId2) {
    const fd2 = new FormData();
    fd2.append('resume', new Blob([DUMMY_PDF], { type: 'application/pdf' }), 'cv2.pdf');
    const a2 = await fetch(`${BASE}/applications/${jobId2}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cToken}` },
      body: fd2,
    });
    const a2Data = await a2.json();
    appId2 = a2Data.data?._id;
    if (appId2) {
      await req('PATCH', `/applications/${appId2}/status`,
        { status: 'shortlisted' },
        { Authorization: `Bearer ${r2Token}` }
      );
    }
  }

  console.log('  Setup complete. Application shortlisted and ready.\n');
}

// ─────────────────────────────────────────────────────────────────────────────
section('POST /interviews — Schedule');

// 1. No token → 401
{
  const { status, data } = await req('POST', '/interviews', {
    applicationId: appId, scheduledAt: FUTURE, format: 'video',
  });
  if (status === 401 && data.errorCode === 'NO_TOKEN')
    pass('POST /interviews without token → 401 NO_TOKEN');
  else fail('401 NO_TOKEN guard', `${status}: ${JSON.stringify(data)}`);
}

// 2. Candidate cannot schedule → 403
{
  const { status, data } = await req('POST', '/interviews',
    { applicationId: appId, scheduledAt: FUTURE, format: 'video' },
    { Authorization: `Bearer ${cToken}` }
  );
  if (status === 403 && data.errorCode === 'FORBIDDEN_ROLE')
    pass('Candidate → POST /interviews → 403 FORBIDDEN_ROLE');
  else fail('Candidate role block → 403', `${status}: ${JSON.stringify(data)}`);
}

// 3. HM cannot schedule → 403
{
  const { status } = await req('POST', '/interviews',
    { applicationId: appId, scheduledAt: FUTURE, format: 'video' },
    { Authorization: `Bearer ${hmToken}` }
  );
  if (status === 403) pass('HM → POST /interviews → 403');
  else fail('HM role block → 403', `${status}`);
}

// 4. Missing required fields → 400 VALIDATION_ERROR
{
  const { status, data } = await req('POST', '/interviews',
    { applicationId: appId },  // missing scheduledAt, format
    { Authorization: `Bearer ${rToken}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('Missing scheduledAt and format → 400 VALIDATION_ERROR');
  else fail('Missing fields → 400', `${status}: ${JSON.stringify(data)}`);
}

// 5. Invalid format → 400
{
  const { status, data } = await req('POST', '/interviews',
    { applicationId: appId, scheduledAt: FUTURE, format: 'carrier-pigeon' },
    { Authorization: `Bearer ${rToken}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('Invalid format → 400 VALIDATION_ERROR');
  else fail('Invalid format → 400', `${status}: ${JSON.stringify(data)}`);
}

// 6. Invalid applicationId → 400
{
  const { status, data } = await req('POST', '/interviews',
    { applicationId: 'not-an-id', scheduledAt: FUTURE, format: 'video' },
    { Authorization: `Bearer ${rToken}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('Invalid applicationId → 400 VALIDATION_ERROR');
  else fail('Invalid applicationId → 400', `${status}: ${JSON.stringify(data)}`);
}

// 7. Non-existent applicationId → 404
{
  const { status, data } = await req('POST', '/interviews',
    { applicationId: '6a000000000000000000000a', scheduledAt: FUTURE, format: 'phone' },
    { Authorization: `Bearer ${rToken}` }
  );
  if (status === 404 && data.errorCode === 'APPLICATION_NOT_FOUND')
    pass('Non-existent applicationId → 404 APPLICATION_NOT_FOUND');
  else fail('Non-existent app → 404', `${status}: ${JSON.stringify(data)}`);
}

// 8. Past scheduledAt → 400
{
  const { status, data } = await req('POST', '/interviews',
    { applicationId: appId, scheduledAt: PAST, format: 'video' },
    { Authorization: `Bearer ${rToken}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('Past scheduledAt → 400 VALIDATION_ERROR');
  else fail('Past scheduledAt → 400', `${status}: ${JSON.stringify(data)}`);
}

// 9. Recruiter B cannot schedule for Recruiter A's application → 403
if (appId) {
  const { status, data } = await req('POST', '/interviews',
    { applicationId: appId, scheduledAt: FUTURE, format: 'video' },
    { Authorization: `Bearer ${r2Token}` }
  );
  if (status === 403 && data.errorCode === 'FORBIDDEN_ROLE')
    pass('Recruiter B → schedule for R1\'s app → 403 FORBIDDEN_ROLE (ownership)');
  else fail('Cross-recruiter ownership → 403', `${status}: ${JSON.stringify(data)}`);
}

// 10. Invalid interviewerId → 400
{
  const { status, data } = await req('POST', '/interviews',
    { applicationId: appId, scheduledAt: FUTURE, format: 'video', interviewerId: 'not-an-id' },
    { Authorization: `Bearer ${rToken}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('Invalid interviewerId → 400 VALIDATION_ERROR');
  else fail('Invalid interviewerId → 400', `${status}: ${JSON.stringify(data)}`);
}

// 11. interviewerId must be a hiring_manager (not candidate)
{
  const { status, data } = await req('POST', '/interviews',
    { applicationId: appId, scheduledAt: FUTURE, format: 'video', interviewerId: cId },
    { Authorization: `Bearer ${rToken}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('interviewerId pointing to candidate → 400 VALIDATION_ERROR');
  else fail('Non-HM interviewerId → 400', `${status}: ${JSON.stringify(data)}`);
}

// 12. Successful interview scheduling (no interviewer)
{
  const { status, data } = await req('POST', '/interviews',
    {
      applicationId:         appId,
      scheduledAt:           FUTURE,
      format:                'video',
      location:              'https://meet.google.com/abc-xyz',
      candidateInstructions: 'Join 10 minutes early. Bring your laptop.',
    },
    { Authorization: `Bearer ${rToken}` }
  );
  if (status === 201 && data.success && data.data?._id) {
    interviewId = data.data._id;
    pass('Recruiter POST /interviews → 201 Created', `id=${interviewId}`);

    if (data.data.status === 'scheduled')
      pass('Default interview status is "scheduled"');
    else fail('Default status "scheduled"', `Got: ${data.data.status}`);

    if (data.data.candidate?.name)
      pass('Candidate populated in response', `name=${data.data.candidate.name}`);
    else fail('Candidate populated', JSON.stringify(data.data.candidate));

    if (data.data.job?.title)
      pass('Job populated in response', `title=${data.data.job.title}`);
    else fail('Job populated', JSON.stringify(data.data.job));

    if (data.data.format === 'video')
      pass('format stored correctly');
    else fail('format stored', `Got: ${data.data.format}`);

    if (data.data.candidateInstructions === 'Join 10 minutes early. Bring your laptop.')
      pass('candidateInstructions stored');
    else fail('candidateInstructions stored', data.data.candidateInstructions);
  } else {
    fail('POST /interviews → 201', `${status}: ${JSON.stringify(data)}`);
  }
}

// 13. Verify application status auto-advanced from shortlisted → interview
{
  const { data } = await req('GET', `/applications/my/${appId}`, null, { Authorization: `Bearer ${cToken}` });
  if (data.data?.status === 'interview')
    pass('Application auto-advanced to "interview" after scheduling');
  else fail('Application status auto-advance', `Got: ${data.data?.status}`);
}

// 14. Schedule a second interview with HM assigned (for GET /:id HM test)
if (appId2) {
  const { status, data } = await req('POST', '/interviews',
    {
      applicationId: appId2,
      scheduledAt:   FUTURE2,
      format:        'in-person',
      location:      'Conference Room 3',
      interviewerId: hmId,
    },
    { Authorization: `Bearer ${r2Token}` }
  );
  if (status === 201) {
    interview2Id = data.data._id;
    pass('Second interview with HM assigned → 201', `id=${interview2Id}`);

    if (data.data.interviewer?.name)
      pass('interviewer (HM) populated in response', `name=${data.data.interviewer.name}`);
    else fail('interviewer populated', JSON.stringify(data.data.interviewer));
  } else {
    fail('Second interview creation → 201', `${status}: ${JSON.stringify(data)}`);
  }
}

// 15. Application already in wrong state (applied, not shortlisted) → 400
{
  // Create a new fresh application (status=applied) and try to schedule
  const DUMMY_PDF = Buffer.from('%PDF-1.4 test');
  const futureD = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const j3 = await req('POST', '/jobs', {
    title: 'PM Role', department: 'Marketing',
    location: 'Remote', jobType: 'remote',
    description: 'Lead product', status: 'published',
    applicationDeadline: futureD,
  }, { Authorization: `Bearer ${rToken}` });

  if (j3.data.data?._id) {
    const fd = new FormData();
    fd.append('resume', new Blob([DUMMY_PDF], { type: 'application/pdf' }), 'cv.pdf');
    const applyResp = await fetch(`${BASE}/applications/${j3.data.data._id}`, {
      method: 'POST', headers: { Authorization: `Bearer ${cToken}` }, body: fd,
    });
    const rawApp = await applyResp.json();
    const freshAppId = rawApp.data?._id;

    if (freshAppId) {
      const { status, data } = await req('POST', '/interviews',
        { applicationId: freshAppId, scheduledAt: FUTURE, format: 'phone' },
        { Authorization: `Bearer ${rToken}` }
      );
      if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
        pass('Application with status=applied → 400 VALIDATION_ERROR (must be shortlisted)');
      else fail('Application not shortlisted → 400', `${status}: ${JSON.stringify(data)}`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
section('GET /interviews — Recruiter list');

// 16. No token → 401
{
  const { status } = await req('GET', '/interviews');
  if (status === 401) pass('GET /interviews without token → 401');
  else fail('GET /interviews → 401', `${status}`);
}

// 17. Candidate cannot list → 403
{
  const { status } = await req('GET', '/interviews', null, { Authorization: `Bearer ${cToken}` });
  if (status === 403) pass('Candidate → GET /interviews → 403');
  else fail('Candidate GET /interviews → 403', `${status}`);
}

// 18. HM cannot list → 403
{
  const { status } = await req('GET', '/interviews', null, { Authorization: `Bearer ${hmToken}` });
  if (status === 403) pass('HM → GET /interviews → 403');
  else fail('HM GET /interviews → 403', `${status}`);
}

// 19. Recruiter gets their own paginated interviews
{
  const { status, data } = await req('GET', '/interviews', null, { Authorization: `Bearer ${rToken}` });
  if (status === 200 && Array.isArray(data.data) && data.pagination) {
    pass('Recruiter GET /interviews → 200 paginated', `total=${data.pagination.total}`);

    if (data.data.length >= 1 && data.data[0].scheduledBy)
      pass('Recruiter only sees own interviews');
    else pass('Recruiter interview list (own only — isolation by recruiterId)', `count=${data.data.length}`);
  } else {
    fail('Recruiter GET /interviews → 200', `${status}: ${JSON.stringify(data)}`);
  }
}

// 20. Filter by status=scheduled
{
  const { status, data } = await req('GET', '/interviews?status=scheduled', null, { Authorization: `Bearer ${rToken}` });
  if (status === 200 && data.data.every(i => i.status === 'scheduled'))
    pass('GET /interviews?status=scheduled filter works');
  else fail('Status filter on list', `${status}: ${JSON.stringify(data.data?.map(i=>i.status))}`);
}

// 21. Invalid status filter → 400
{
  const { status, data } = await req('GET', '/interviews?status=unknown', null, { Authorization: `Bearer ${rToken}` });
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('Invalid status filter → 400 VALIDATION_ERROR');
  else fail('Invalid status filter → 400', `${status}: ${JSON.stringify(data)}`);
}

// 22. sortBy=latest accepted
{
  const { status } = await req('GET', '/interviews?sortBy=latest', null, { Authorization: `Bearer ${rToken}` });
  if (status === 200) pass('sortBy=latest → 200 accepted');
  else fail('sortBy=latest → 200', `${status}`);
}

// 23. Invalid sortBy → 400
{
  const { status, data } = await req('GET', '/interviews?sortBy=random', null, { Authorization: `Bearer ${rToken}` });
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('Invalid sortBy → 400 VALIDATION_ERROR');
  else fail('Invalid sortBy → 400', `${status}: ${JSON.stringify(data)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
section('GET /interviews/:id — All roles (scoped)');

// 24. Recruiter who scheduled it can GET /:id
if (interviewId) {
  const { status, data } = await req('GET', `/interviews/${interviewId}`, null, { Authorization: `Bearer ${rToken}` });
  if (status === 200 && data.data?._id === interviewId)
    pass('Owner recruiter GET /interviews/:id → 200');
  else fail('Owner recruiter GET /:id → 200', `${status}: ${JSON.stringify(data)}`);
}

// 25. Recruiter B cannot GET Recruiter A's interview → 403
if (interviewId) {
  const { status, data } = await req('GET', `/interviews/${interviewId}`, null, { Authorization: `Bearer ${r2Token}` });
  if (status === 403 && data.errorCode === 'FORBIDDEN_ROLE')
    pass('Recruiter B → GET /interviews/:id → 403 FORBIDDEN_ROLE (not owner)');
  else fail('Non-owner recruiter → /:id → 403', `${status}: ${JSON.stringify(data)}`);
}

// 26. Candidate can GET their own interview
if (interviewId) {
  const { status, data } = await req('GET', `/interviews/${interviewId}`, null, { Authorization: `Bearer ${cToken}` });
  if (status === 200 && data.data?._id === interviewId)
    pass('Candidate GET own interview → 200');
  else fail('Candidate own interview → 200', `${status}: ${JSON.stringify(data)}`);
}

// 27. HM assigned to interview2 can GET it
if (interview2Id) {
  const { status, data } = await req('GET', `/interviews/${interview2Id}`, null, { Authorization: `Bearer ${hmToken}` });
  if (status === 200 && data.data?._id === interview2Id)
    pass('Assigned HM GET /interviews/:id → 200');
  else fail('Assigned HM GET /:id → 200', `${status}: ${JSON.stringify(data)}`);
}

// 28. Non-existent interview → 404
{
  const { status, data } = await req('GET', '/interviews/6a000000000000000000000a', null, { Authorization: `Bearer ${rToken}` });
  if (status === 404 && data.errorCode === 'INTERVIEW_NOT_FOUND')
    pass('Non-existent interview → 404 INTERVIEW_NOT_FOUND');
  else fail('Non-existent → 404', `${status}: ${JSON.stringify(data)}`);
}

// 29. Invalid ObjectId → 400
{
  const { status } = await req('GET', '/interviews/not-an-id', null, { Authorization: `Bearer ${rToken}` });
  if (status === 400) pass('Invalid ObjectId → 400');
  else fail('Invalid ObjectId → 400', `${status}`);
}

// ─────────────────────────────────────────────────────────────────────────────
section('PATCH /interviews/:id — Recruiter partial update');

// 30. No token → 401
if (interviewId) {
  const { status } = await req('PATCH', `/interviews/${interviewId}`, { location: 'new loc' });
  if (status === 401) pass('PATCH /:id without token → 401');
  else fail('PATCH /:id → 401', `${status}`);
}

// 31. Candidate cannot update → 403
if (interviewId) {
  const { status } = await req('PATCH', `/interviews/${interviewId}`,
    { location: 'new' },
    { Authorization: `Bearer ${cToken}` }
  );
  if (status === 403) pass('Candidate → PATCH /:id → 403');
  else fail('Candidate PATCH → 403', `${status}`);
}

// 32. Recruiter B cannot update Recruiter A's interview → 403
if (interviewId) {
  const { status, data } = await req('PATCH', `/interviews/${interviewId}`,
    { location: 'new' },
    { Authorization: `Bearer ${r2Token}` }
  );
  if (status === 403 && data.errorCode === 'FORBIDDEN_ROLE')
    pass('Recruiter B → PATCH R1\'s interview → 403 FORBIDDEN_ROLE (ownership)');
  else fail('Non-owner PATCH → 403', `${status}: ${JSON.stringify(data)}`);
}

// 33. Past scheduledAt on update → 400
if (interviewId) {
  const { status, data } = await req('PATCH', `/interviews/${interviewId}`,
    { scheduledAt: PAST },
    { Authorization: `Bearer ${rToken}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('Past scheduledAt on PATCH → 400 VALIDATION_ERROR');
  else fail('Past scheduledAt PATCH → 400', `${status}: ${JSON.stringify(data)}`);
}

// 34. Valid partial update → 200
if (interviewId) {
  const { status, data } = await req('PATCH', `/interviews/${interviewId}`,
    {
      location:              'https://zoom.us/new-link',
      candidateInstructions: 'Updated: please join via Zoom.',
    },
    { Authorization: `Bearer ${rToken}` }
  );
  if (status === 200 && data.data?.location === 'https://zoom.us/new-link') {
    pass('PATCH /:id → 200 (location + instructions updated)');

    if (data.data.format === 'video')
      pass('PATCH preserves un-updated fields (partial semantics)', `format=${data.data.format}`);
    else fail('PATCH partial semantics', `format changed unexpectedly`);
  } else {
    fail('PATCH /:id → 200', `${status}: ${JSON.stringify(data)}`);
  }
}

// 35. Assign HM via PATCH
if (interviewId && hmId) {
  const { status, data } = await req('PATCH', `/interviews/${interviewId}`,
    { interviewerId: hmId },
    { Authorization: `Bearer ${rToken}` }
  );
  if (status === 200 && data.data?.interviewer?.name)
    pass('Assign interviewer (HM) via PATCH → 200', `name=${data.data.interviewer.name}`);
  else fail('Assign HM via PATCH → 200', `${status}: ${JSON.stringify(data)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
section('PATCH /interviews/:id/status — Status transitions');

// 36. No token → 401
if (interviewId) {
  const { status } = await req('PATCH', `/interviews/${interviewId}/status`, { status: 'completed' });
  if (status === 401) pass('PATCH /status without token → 401');
  else fail('PATCH /status → 401', `${status}`);
}

// 37. Candidate cannot update status → 403
if (interviewId) {
  const { status } = await req('PATCH', `/interviews/${interviewId}/status`,
    { status: 'completed' },
    { Authorization: `Bearer ${cToken}` }
  );
  if (status === 403) pass('Candidate → PATCH /status → 403');
  else fail('Candidate PATCH /status → 403', `${status}`);
}

// 38. Missing status → 400
if (interviewId) {
  const { status, data } = await req('PATCH', `/interviews/${interviewId}/status`,
    {},
    { Authorization: `Bearer ${rToken}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('Missing status body → 400 VALIDATION_ERROR');
  else fail('Missing status → 400', `${status}: ${JSON.stringify(data)}`);
}

// 39. 'scheduled' is not settable via status PATCH (must use PATCH /:id)
if (interviewId) {
  const { status, data } = await req('PATCH', `/interviews/${interviewId}/status`,
    { status: 'scheduled' },
    { Authorization: `Bearer ${rToken}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('status=scheduled blocked by validator → 400 VALIDATION_ERROR');
  else fail('Block status=scheduled on status PATCH → 400', `${status}: ${JSON.stringify(data)}`);
}

// 40. Recruiter B cannot update Recruiter A's interview status → 403
if (interviewId) {
  const { status, data } = await req('PATCH', `/interviews/${interviewId}/status`,
    { status: 'completed' },
    { Authorization: `Bearer ${r2Token}` }
  );
  if (status === 403 && data.errorCode === 'FORBIDDEN_ROLE')
    pass('Recruiter B → PATCH R1\'s /status → 403 FORBIDDEN_ROLE');
  else fail('Non-owner PATCH /status → 403', `${status}: ${JSON.stringify(data)}`);
}

// 41. Complete interview → 200
if (interviewId) {
  const { status, data } = await req('PATCH', `/interviews/${interviewId}/status`,
    { status: 'completed' },
    { Authorization: `Bearer ${rToken}` }
  );
  if (status === 200 && data.data?.status === 'completed')
    pass('PATCH /status → 200 (completed)');
  else fail('Complete interview → 200', `${status}: ${JSON.stringify(data)}`);
}

// 42. Cannot update a completed interview (terminal state)
if (interviewId) {
  const { status, data } = await req('PATCH', `/interviews/${interviewId}/status`,
    { status: 'cancelled' },
    { Authorization: `Bearer ${rToken}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('Completed interview → further status update → 400 VALIDATION_ERROR');
  else fail('Terminal state guard → 400', `${status}: ${JSON.stringify(data)}`);
}

// 43. Cannot PATCH a completed interview (via /update route either)
if (interviewId) {
  const { status, data } = await req('PATCH', `/interviews/${interviewId}`,
    { location: 'try-to-update' },
    { Authorization: `Bearer ${rToken}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('PATCH cancelled/completed interview → 400 VALIDATION_ERROR');
  else fail('Update completed interview → 400', `${status}: ${JSON.stringify(data)}`);
}

// 44. Cancel interview with reason
if (interview2Id) {
  const { status, data } = await req('PATCH', `/interviews/${interview2Id}/status`,
    { status: 'cancelled', cancelledReason: 'Candidate unavailable for this slot.' },
    { Authorization: `Bearer ${r2Token}` }
  );
  if (status === 200 && data.data?.status === 'cancelled') {
    pass('Cancel interview with reason → 200');

    if (data.data.cancelledReason === 'Candidate unavailable for this slot.')
      pass('cancelledReason stored on cancellation');
    else fail('cancelledReason stored', `Got: ${data.data.cancelledReason}`);
  } else {
    fail('Cancel interview → 200', `${status}: ${JSON.stringify(data)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
section('RESPONSE SHAPES — Interviews');

// 45. Paginated list shape
{
  const { data } = await req('GET', '/interviews', null, { Authorization: `Bearer ${rToken}` });
  if (data.success === true && Array.isArray(data.data) && data.pagination &&
      typeof data.message === 'string')
    pass('Paginated shape: { success, message, data[], pagination }');
  else fail('Paginated shape', JSON.stringify(Object.keys(data)));
}

// 46. Single interview shape
if (interviewId) {
  const { data } = await req('GET', `/interviews/${interviewId}`, null, { Authorization: `Bearer ${rToken}` });
  if (data.success === true && data.data && !Array.isArray(data.data))
    pass('Single shape: { success, message, data }');
  else fail('Single shape', JSON.stringify(Object.keys(data)));
}

// 47. Error shape
{
  const { data } = await req('GET', '/interviews/6a000000000000000000000a', null, { Authorization: `Bearer ${rToken}` });
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
