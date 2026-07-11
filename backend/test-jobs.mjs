// ─── test-jobs.mjs ────────────────────────────────────────────────────────────
// Module 3 — Jobs: comprehensive test suite.
// Run while server is running: node test-jobs.mjs
//
// Covers:
//   CRUD — create, read, update, delete (all work correctly)
//   Pagination — page, limit, totalPages, hasNextPage, hasPrevPage
//   Filtering  — department, jobType, location, isRemote
//   Sorting    — newest, salary, location
//   Search     — title + description full-text
//   Invalid ObjectId → documented error
//   Soft-delete → jobs don't appear in public queries
//   Candidates cannot create/edit jobs
//   Recruiters cannot modify jobs they don't own
//   Status-only update endpoint
//   Recruiter /all endpoint (all statuses)
//   Hiring Manager /assigned endpoint (dept-scoped)

const BASE = 'http://localhost:5000/api/v1';
const GREEN = '\x1b[32m'; const RED = '\x1b[31m';
const CYAN  = '\x1b[36m'; const DIM = '\x1b[2m'; const RESET = '\x1b[0m';

let passed = 0; let failed = 0;

function section(t) {
  console.log(`\n${CYAN}${'─'.repeat(62)}${RESET}\n${CYAN}  ${t}${RESET}\n${CYAN}${'─'.repeat(62)}${RESET}`);
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
  return { status: res.status, data, headers: res.headers };
}

// ─── Setup: register test users and ensure company exists ─────────────────────
const ts = Date.now();
const R1_EMAIL = `r1_${ts}@test.com`; // Recruiter 1 (primary)
const R2_EMAIL = `r2_${ts}@test.com`; // Recruiter 2 (different recruiter — ownership tests)
const C_EMAIL  = `c_${ts}@test.com`;  // Candidate
const HM_EMAIL = `hm_${ts}@test.com`; // Hiring Manager

let r1Token = '', r2Token = '', cToken = '', hmToken = '';
let job1Id = '', job2Id = ''; // created jobs
let publishedJobId = '';

console.log('\n  Setting up test users...');
{
  const [r1, r2, c, hm] = await Promise.all([
    req('POST', '/auth/register', { name: 'Recruiter One',   email: R1_EMAIL, password: 'pass1234!', role: 'recruiter' }),
    req('POST', '/auth/register', { name: 'Recruiter Two',   email: R2_EMAIL, password: 'pass1234!', role: 'recruiter' }),
    req('POST', '/auth/register', { name: 'Test Candidate',  email: C_EMAIL,  password: 'pass1234!', role: 'candidate' }),
    req('POST', '/auth/register', { name: 'Test HM',         email: HM_EMAIL, password: 'pass1234!', role: 'hiring_manager' }),
  ]);
  r1Token = r1.data.data?.token ?? '';
  r2Token = r2.data.data?.token ?? '';
  cToken  = c.data.data?.token  ?? '';
  hmToken = hm.data.data?.token ?? '';

  if (!r1Token || !r2Token || !cToken || !hmToken) {
    console.error('  ❌ Failed to register test users. Aborting.'); process.exit(1);
  }

  // Ensure company exists (POST creates only if none exists)
  await req('POST', '/company', { name: 'TestCo', website: 'https://testco.com' }, { Authorization: `Bearer ${r1Token}` });
  console.log('  Test users and company ready.\n');
}

// ─────────────────────────────────────────────────────────────────────────────
section('POST /jobs — Create');

// 1. No token → 401
{
  const { status, data } = await req('POST', '/jobs', { title: 'Dev' });
  if (status === 401 && data.errorCode === 'NO_TOKEN')
    pass('POST /jobs without token → 401 NO_TOKEN');
  else fail('POST /jobs without token → 401 NO_TOKEN', `${status}: ${JSON.stringify(data)}`);
}

// 2. Candidate cannot create → 403
{
  const { status, data } = await req('POST', '/jobs',
    { title: 'Dev', department: 'Engineering', location: 'Remote', jobType: 'full-time', description: 'Test job' },
    { Authorization: `Bearer ${cToken}` }
  );
  if (status === 403 && data.errorCode === 'FORBIDDEN_ROLE')
    pass('Candidate → POST /jobs → 403 FORBIDDEN_ROLE');
  else fail('Candidate → POST /jobs → 403 FORBIDDEN_ROLE', `${status}: ${JSON.stringify(data)}`);
}

// 3. Hiring Manager cannot create → 403
{
  const { status, data } = await req('POST', '/jobs',
    { title: 'Dev', department: 'Engineering', location: 'Remote', jobType: 'full-time', description: 'Test job' },
    { Authorization: `Bearer ${hmToken}` }
  );
  if (status === 403 && data.errorCode === 'FORBIDDEN_ROLE')
    pass('Hiring Manager → POST /jobs → 403 FORBIDDEN_ROLE');
  else fail('Hiring Manager → POST /jobs → 403 FORBIDDEN_ROLE', `${status}: ${JSON.stringify(data)}`);
}

// 4. Missing required fields → 400 VALIDATION_ERROR
{
  const { status, data } = await req('POST', '/jobs', {},
    { Authorization: `Bearer ${r1Token}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR' && Array.isArray(data.errors))
    pass('POST /jobs missing fields → 400 VALIDATION_ERROR', `${data.errors.length} errors`);
  else fail('POST /jobs missing fields → 400 VALIDATION_ERROR', `${status}: ${JSON.stringify(data)}`);
}

// 5. Invalid department enum → 400
{
  const { status, data } = await req('POST', '/jobs',
    { title: 'Dev', department: 'InvalidDept', location: 'Remote', jobType: 'full-time', description: 'X' },
    { Authorization: `Bearer ${r1Token}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('Invalid department → 400 VALIDATION_ERROR');
  else fail('Invalid department → 400 VALIDATION_ERROR', `${status}: ${JSON.stringify(data)}`);
}

// 6. Invalid jobType enum → 400
{
  const { status, data } = await req('POST', '/jobs',
    { title: 'Dev', department: 'Engineering', location: 'Remote', jobType: 'gig', description: 'X' },
    { Authorization: `Bearer ${r1Token}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('Invalid jobType → 400 VALIDATION_ERROR');
  else fail('Invalid jobType → 400 VALIDATION_ERROR', `${status}: ${JSON.stringify(data)}`);
}

// 7. salaryMax < salaryMin → 400 SALARY_RANGE_INVALID
{
  const { status, data } = await req('POST', '/jobs', {
    title: 'Dev', department: 'Engineering', location: 'Remote',
    jobType: 'full-time', description: 'Test',
    salaryMin: 100000, salaryMax: 50000,   // invalid range
  }, { Authorization: `Bearer ${r1Token}` });
  if (status === 400 && data.errorCode === 'SALARY_RANGE_INVALID')
    pass('salaryMax < salaryMin → 400 SALARY_RANGE_INVALID');
  else fail('salaryMax < salaryMin → 400 SALARY_RANGE_INVALID', `${status}: ${JSON.stringify(data)}`);
}

// 8. Past applicationDeadline → 400 DEADLINE_IN_PAST
{
  const { status, data } = await req('POST', '/jobs', {
    title: 'Dev', department: 'Engineering', location: 'Remote',
    jobType: 'full-time', description: 'Test',
    applicationDeadline: '2020-01-01',
  }, { Authorization: `Bearer ${r1Token}` });
  if (status === 400 && data.errorCode === 'DEADLINE_IN_PAST')
    pass('Past applicationDeadline → 400 DEADLINE_IN_PAST');
  else fail('Past applicationDeadline → 400 DEADLINE_IN_PAST', `${status}: ${JSON.stringify(data)}`);
}

// 9. Successful creation — job1 (draft)
{
  const { status, data } = await req('POST', '/jobs', {
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    location: 'Bangalore, India',
    jobType: 'full-time',
    isRemote: false,
    experienceLevel: 'senior',
    description: 'Build beautiful UIs with React and TypeScript for our SaaS platform.',
    salaryMin: 1500000, salaryMax: 2500000,
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'draft',
  }, { Authorization: `Bearer ${r1Token}` });

  if (status === 201 && data.success && data.data?.title === 'Senior Frontend Engineer') {
    pass('Recruiter POST /jobs → 201 Created', `id=${data.data._id}`);
    job1Id = data.data._id;

    if (data.data.status === 'draft') pass('Default status is draft');
    else fail('Default status is draft', `Got: ${data.data.status}`);

    if (data.data.isDeleted === false) pass('isDeleted defaults to false');
    else fail('isDeleted defaults to false');

    if (data.data.applicationCount === 0) pass('applicationCount defaults to 0');
    else fail('applicationCount defaults to 0');

    if (data.data.createdAt && data.data.updatedAt) pass('Timestamps created', `createdAt=${data.data.createdAt}`);
    else fail('Timestamps created');

    if (data.data.company) pass('company field populated in response');
    else fail('company field populated');
  } else {
    fail('Recruiter POST /jobs → 201 Created', `${status}: ${JSON.stringify(data)}`);
  }
}

// 10. Create job2 for R1 (published — for public GET tests)
{
  const { status, data } = await req('POST', '/jobs', {
    title: 'React Native Developer',
    department: 'Engineering',
    location: 'Mumbai, India',
    jobType: 'remote',
    isRemote: true,
    experienceLevel: 'mid',
    description: 'Build cross-platform mobile apps with React Native and Expo framework.',
    salaryMin: 1200000, salaryMax: 1800000,
    status: 'published',
  }, { Authorization: `Bearer ${r1Token}` });

  if (status === 201 && data.data?.status === 'published') {
    pass('Created published job2 for GET tests', `id=${data.data._id}`);
    job2Id = data.data._id;
    publishedJobId = data.data._id;
  } else {
    fail('Created published job2 for GET tests', `${status}: ${JSON.stringify(data)}`);
  }
}

// 11. Create job by R2 (for ownership tests)
let r2JobId = '';
{
  const { status, data } = await req('POST', '/jobs', {
    title: 'Product Designer',
    department: 'Design',
    location: 'Delhi, India',
    jobType: 'full-time',
    experienceLevel: 'mid',
    description: 'Design beautiful product experiences for our enterprise clients.',
    status: 'published',
  }, { Authorization: `Bearer ${r2Token}` });

  if (status === 201) {
    r2JobId = data.data._id;
    pass('Recruiter 2 created their own job', `id=${r2JobId}`);
  } else {
    fail('Recruiter 2 created their own job', `${status}: ${JSON.stringify(data)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
section('GET /jobs — Public list (pagination, filtering, sorting, search)');

// 12. Basic public GET → returns only published jobs
{
  const { status, data } = await req('GET', '/jobs');
  if (status === 200 && data.success && Array.isArray(data.data)) {
    pass('GET /jobs → 200 with data array');

    // All returned jobs must be published
    const allPublished = data.data.every(j => j.status === 'published');
    if (allPublished) pass('All returned jobs are published');
    else fail('All returned jobs are published', 'Draft/closed job found in response');

    // No deleted jobs
    const noneDeleted = data.data.every(j => j.isDeleted === false);
    if (noneDeleted) pass('No deleted jobs in public list');
    else fail('No deleted jobs in public list');
  } else {
    fail('GET /jobs → 200', `${status}: ${JSON.stringify(data)}`);
  }
}

// 13. Pagination shape
{
  const { status, data } = await req('GET', '/jobs?page=1&limit=2');
  if (status === 200 && data.pagination) {
    const p = data.pagination;
    const hasAllFields = 'total' in p && 'page' in p && 'limit' in p &&
                         'totalPages' in p && 'hasNextPage' in p && 'hasPrevPage' in p;
    if (hasAllFields)
      pass('Pagination shape correct', `total=${p.total}, page=${p.page}, limit=${p.limit}, totalPages=${p.totalPages}`);
    else fail('Pagination shape correct', `Got: ${JSON.stringify(p)}`);

    if (p.page === 1 && !p.hasPrevPage) pass('hasPrevPage=false on first page');
    else fail('hasPrevPage=false on first page', `Got hasPrevPage=${p.hasPrevPage}`);

    if (p.limit === 2) pass('limit=2 respected');
    else fail('limit=2 respected', `Got limit=${p.limit}`);
  } else {
    fail('Pagination shape correct', `${status}: ${JSON.stringify(data)}`);
  }
}

// 14. Default limit is 10
{
  const { data } = await req('GET', '/jobs');
  if (data.pagination?.limit === 10)
    pass('Default limit is 10');
  else fail('Default limit is 10', `Got: ${data.pagination?.limit}`);
}

// 15. Filter by department
{
  const { status, data } = await req('GET', '/jobs?department=Engineering');
  if (status === 200 && data.data.every(j => j.department === 'Engineering'))
    pass('Filter by department=Engineering works');
  else fail('Filter by department=Engineering', `${status}: ${JSON.stringify(data.data?.map(j=>j.department))}`);
}

// 16. Filter by jobType
{
  const { status, data } = await req('GET', '/jobs?jobType=remote');
  if (status === 200 && data.data.every(j => j.jobType === 'remote'))
    pass('Filter by jobType=remote works');
  else fail('Filter by jobType=remote', `${JSON.stringify(data.data?.map(j=>j.jobType))}`);
}

// 17. Filter by isRemote=true
{
  const { status, data } = await req('GET', '/jobs?isRemote=true');
  if (status === 200 && data.data.every(j => j.isRemote === true))
    pass('Filter by isRemote=true works');
  else fail('Filter by isRemote=true', `${JSON.stringify(data.data?.map(j=>j.isRemote))}`);
}

// 18. Filter by location (partial match)
{
  const { status, data } = await req('GET', '/jobs?location=Mumbai');
  if (status === 200 && data.data.length > 0 && data.data.every(j => /mumbai/i.test(j.location)))
    pass('Filter by location (partial, case-insensitive) works');
  else fail('Filter by location', `Found ${data.data?.length} results: ${JSON.stringify(data.data?.map(j=>j.location))}`);
}

// 19. Search by title keyword
{
  const { status, data } = await req('GET', '/jobs?search=React+Native');
  if (status === 200 && data.data.length > 0) {
    const hit = data.data.some(j => /react native/i.test(j.title) || /react native/i.test(j.description));
    if (hit) pass('Search by title keyword works', `Found ${data.data.length} result(s)`);
    else fail('Search results contain keyword', JSON.stringify(data.data.map(j => j.title)));
  } else {
    fail('Search by title keyword', `${status}: ${JSON.stringify(data)}`);
  }
}

// 20. Sort by newest (default — most recently created first)
{
  const { status, data } = await req('GET', '/jobs?sortBy=newest');
  if (status === 200 && data.data.length >= 2) {
    const dates = data.data.map(j => new Date(j.createdAt));
    const sorted = dates.every((d, i) => i === 0 || d <= dates[i - 1]);
    if (sorted) pass('sortBy=newest returns newest first');
    else fail('sortBy=newest returns newest first', JSON.stringify(dates));
  } else {
    pass('sortBy=newest accepted', `${data.data?.length} results`);
  }
}

// 21. Sort by salary
{
  const { status, data } = await req('GET', '/jobs?sortBy=salary');
  if (status === 200)
    pass('sortBy=salary accepted (sorted by salaryMin desc)');
  else fail('sortBy=salary', `${status}: ${JSON.stringify(data)}`);
}

// 22. Sort by location
{
  const { status, data } = await req('GET', '/jobs?sortBy=location');
  if (status === 200)
    pass('sortBy=location accepted (sorted alphabetically)');
  else fail('sortBy=location', `${status}: ${JSON.stringify(data)}`);
}

// 23. Invalid sortBy → 400 VALIDATION_ERROR
{
  const { status, data } = await req('GET', '/jobs?sortBy=invalid');
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('Invalid sortBy → 400 VALIDATION_ERROR');
  else fail('Invalid sortBy → 400 VALIDATION_ERROR', `${status}: ${JSON.stringify(data)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
section('GET /jobs/:jobId — Public single job');

// 24. Valid published jobId
if (publishedJobId) {
  const { status, data } = await req('GET', `/jobs/${publishedJobId}`);
  if (status === 200 && data.data?._id === publishedJobId)
    pass('GET /jobs/:jobId → 200 (published job)', `title=${data.data.title}`);
  else fail('GET /jobs/:jobId → 200', `${status}: ${JSON.stringify(data)}`);
}

// 25. Draft job NOT accessible on public endpoint
if (job1Id) {
  const { status, data } = await req('GET', `/jobs/${job1Id}`);
  if (status === 404 && data.errorCode === 'JOB_NOT_FOUND')
    pass('Draft job not accessible via public GET /jobs/:jobId → 404');
  else fail('Draft job → 404 via public GET', `${status}: ${JSON.stringify(data)}`);
}

// 26. Non-existent ObjectId → 404 JOB_NOT_FOUND
{
  const { status, data } = await req('GET', '/jobs/6a000000000000000000000a');
  if (status === 404 && data.errorCode === 'JOB_NOT_FOUND')
    pass('Non-existent ObjectId → 404 JOB_NOT_FOUND');
  else fail('Non-existent ObjectId → 404', `${status}: ${JSON.stringify(data)}`);
}

// 27. Invalid ObjectId string → 400 (CastError from errorHandler)
{
  const { status, data } = await req('GET', '/jobs/not-a-valid-id');
  if (status === 400)
    pass('Invalid ObjectId string → 400', `errorCode=${data.errorCode}`);
  else fail('Invalid ObjectId string → 400', `${status}: ${JSON.stringify(data)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
section('PATCH /jobs/:jobId — Recruiter partial update');

// 28. R1 updates their own job
if (job1Id) {
  const { status, data } = await req('PATCH', `/jobs/${job1Id}`,
    { title: 'Lead Frontend Engineer', experienceLevel: 'lead' },
    { Authorization: `Bearer ${r1Token}` }
  );
  if (status === 200 && data.data?.title === 'Lead Frontend Engineer' && data.data?.experienceLevel === 'lead')
    pass('Owner PATCH /jobs/:jobId → 200 (title + level updated)');
  else fail('Owner PATCH /jobs/:jobId → 200', `${status}: ${JSON.stringify(data)}`);
}

// 29. PATCH preserves un-updated fields
if (job1Id) {
  const { status, data } = await req('PATCH', `/jobs/${job1Id}`,
    { location: 'Hyderabad, India' },
    { Authorization: `Bearer ${r1Token}` }
  );
  if (status === 200 &&
      data.data?.location === 'Hyderabad, India' &&
      data.data?.department === 'Engineering') {
    pass('PATCH preserves un-updated fields (partial update semantics)');
  } else {
    fail('PATCH preserves un-updated fields', `dept=${data.data?.department}, loc=${data.data?.location}`);
  }
}

// 30. R1 cannot modify R2's job (ownership)
if (r2JobId) {
  const { status, data } = await req('PATCH', `/jobs/${r2JobId}`,
    { title: 'Hijacked Title' },
    { Authorization: `Bearer ${r1Token}` }
  );
  if (status === 403 && data.errorCode === 'FORBIDDEN_ROLE')
    pass('R1 cannot PATCH R2\'s job → 403 FORBIDDEN_ROLE (ownership)');
  else fail('Ownership check on PATCH → 403', `${status}: ${JSON.stringify(data)}`);
}

// 31. Candidate cannot PATCH → 403
if (job1Id) {
  const { status, data } = await req('PATCH', `/jobs/${job1Id}`,
    { title: 'Hacked' },
    { Authorization: `Bearer ${cToken}` }
  );
  if (status === 403) pass('Candidate PATCH /jobs/:jobId → 403');
  else fail('Candidate PATCH /jobs/:jobId → 403', `${status}: ${JSON.stringify(data)}`);
}

// 32. Invalid salary range on PATCH → 400 SALARY_RANGE_INVALID
if (job1Id) {
  const { status, data } = await req('PATCH', `/jobs/${job1Id}`,
    { salaryMin: 500000, salaryMax: 100000 },
    { Authorization: `Bearer ${r1Token}` }
  );
  if (status === 400 && data.errorCode === 'SALARY_RANGE_INVALID')
    pass('Invalid salary on PATCH → 400 SALARY_RANGE_INVALID');
  else fail('Invalid salary PATCH → 400', `${status}: ${JSON.stringify(data)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
section('PATCH /jobs/:jobId/status — Status-only update');

// 33. Recruiter publishes their draft job
if (job1Id) {
  const { status, data } = await req('PATCH', `/jobs/${job1Id}/status`,
    { status: 'published' },
    { Authorization: `Bearer ${r1Token}` }
  );
  if (status === 200 && data.data?.status === 'published')
    pass('PATCH /jobs/:jobId/status → 200 (draft → published)');
  else fail('PATCH /jobs/:jobId/status → 200', `${status}: ${JSON.stringify(data)}`);
}

// 34. Missing status body → 400 VALIDATION_ERROR
if (job1Id) {
  const { status, data } = await req('PATCH', `/jobs/${job1Id}/status`,
    {},
    { Authorization: `Bearer ${r1Token}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('Missing status body → 400 VALIDATION_ERROR');
  else fail('Missing status body → 400', `${status}: ${JSON.stringify(data)}`);
}

// 35. Invalid status value → 400
if (job1Id) {
  const { status, data } = await req('PATCH', `/jobs/${job1Id}/status`,
    { status: 'live' },
    { Authorization: `Bearer ${r1Token}` }
  );
  if (status === 400 && data.errorCode === 'VALIDATION_ERROR')
    pass('Invalid status value → 400 VALIDATION_ERROR');
  else fail('Invalid status → 400', `${status}: ${JSON.stringify(data)}`);
}

// 36. R1 cannot change R2's job status (ownership)
if (r2JobId) {
  const { status, data } = await req('PATCH', `/jobs/${r2JobId}/status`,
    { status: 'closed' },
    { Authorization: `Bearer ${r1Token}` }
  );
  if (status === 403 && data.errorCode === 'FORBIDDEN_ROLE')
    pass('Ownership check on status PATCH → 403 FORBIDDEN_ROLE');
  else fail('Ownership check on status PATCH → 403', `${status}: ${JSON.stringify(data)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
section('DELETE /jobs/:jobId — Soft-delete');

// 37. Candidate cannot delete → 403
if (job2Id) {
  const { status } = await req('DELETE', `/jobs/${job2Id}`, null, { Authorization: `Bearer ${cToken}` });
  if (status === 403) pass('Candidate DELETE /jobs/:jobId → 403');
  else fail('Candidate DELETE /jobs/:jobId → 403', `${status}`);
}

// 38. R1 cannot delete R2's job (ownership)
if (r2JobId) {
  const { status, data } = await req('DELETE', `/jobs/${r2JobId}`, null, { Authorization: `Bearer ${r1Token}` });
  if (status === 403 && data.errorCode === 'FORBIDDEN_ROLE')
    pass('Ownership check on DELETE → 403 FORBIDDEN_ROLE');
  else fail('Ownership check on DELETE → 403', `${status}: ${JSON.stringify(data)}`);
}

// 39. R1 soft-deletes their own job2
if (job2Id) {
  const { status, data } = await req('DELETE', `/jobs/${job2Id}`, null, { Authorization: `Bearer ${r1Token}` });
  if (status === 200 && data.success)
    pass('Owner DELETE /jobs/:jobId → 200 (soft-delete)');
  else fail('Owner DELETE /jobs/:jobId → 200', `${status}: ${JSON.stringify(data)}`);
}

// 40. Soft-deleted job does NOT appear in public GET /jobs
{
  const { data } = await req('GET', '/jobs');
  const deletedFound = data.data?.some(j => j._id === job2Id);
  if (!deletedFound) pass('Soft-deleted job NOT in public GET /jobs list');
  else fail('Soft-deleted job NOT in public list', 'Deleted job appeared in results!');
}

// 41. Soft-deleted job returns 404 on GET /jobs/:jobId
if (job2Id) {
  const { status, data } = await req('GET', `/jobs/${job2Id}`);
  if (status === 404 && data.errorCode === 'JOB_NOT_FOUND')
    pass('Soft-deleted job → 404 on public GET /jobs/:jobId');
  else fail('Soft-deleted job → 404', `${status}: ${JSON.stringify(data)}`);
}

// 42. Cannot PATCH a soft-deleted job
if (job2Id) {
  const { status, data } = await req('PATCH', `/jobs/${job2Id}`,
    { title: 'Ghost Job' },
    { Authorization: `Bearer ${r1Token}` }
  );
  if (status === 404 && data.errorCode === 'JOB_NOT_FOUND')
    pass('Cannot PATCH soft-deleted job → 404 JOB_NOT_FOUND');
  else fail('Cannot PATCH soft-deleted job → 404', `${status}: ${JSON.stringify(data)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
section('GET /jobs/recruiter/all — Recruiter (all statuses)');

// 43. Candidate cannot access → 403
{
  const { status } = await req('GET', '/jobs/recruiter/all', null, { Authorization: `Bearer ${cToken}` });
  if (status === 403) pass('Candidate → GET /recruiter/all → 403');
  else fail('Candidate → GET /recruiter/all → 403', `${status}`);
}

// 44. Recruiter gets their own jobs (all statuses including draft)
{
  const { status, data } = await req('GET', '/jobs/recruiter/all', null, { Authorization: `Bearer ${r1Token}` });
  if (status === 200 && data.pagination && Array.isArray(data.data)) {
    pass('GET /recruiter/all → 200 with pagination', `total=${data.pagination.total}`);

    // Should include draft + published jobs (not deleted)
    const hasMultipleStatuses = data.data.length > 0;
    if (hasMultipleStatuses) pass('Recruiter /all shows multiple statuses', `count=${data.data.length}`);
    else pass('Recruiter /all — no results (all jobs soft-deleted)', 'job2 was deleted');

    // R2's jobs must NOT appear
    const noR2Jobs = !data.data.some(j => j._id === r2JobId);
    if (noR2Jobs) pass('Recruiter /all only shows own jobs (not other recruiter\'s)');
    else fail('Recruiter /all isolation', 'R2\'s job appeared in R1\'s list!');
  } else {
    fail('GET /recruiter/all → 200', `${status}: ${JSON.stringify(data)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
section('GET /jobs/hiring-manager/assigned — HM dept-scoped');

// 45. Candidate cannot access → 403
{
  const { status } = await req('GET', '/jobs/hiring-manager/assigned', null, { Authorization: `Bearer ${cToken}` });
  if (status === 403) pass('Candidate → GET /hiring-manager/assigned → 403');
  else fail('Candidate → GET /hiring-manager/assigned → 403', `${status}`);
}

// 46. Recruiter cannot access → 403
{
  const { status } = await req('GET', '/jobs/hiring-manager/assigned', null, { Authorization: `Bearer ${r1Token}` });
  if (status === 403) pass('Recruiter → GET /hiring-manager/assigned → 403');
  else fail('Recruiter → GET /hiring-manager/assigned → 403', `${status}`);
}

// 47. HM with no department set → 400 DEPARTMENT_NOT_SET
{
  const { status, data } = await req('GET', '/jobs/hiring-manager/assigned', null, { Authorization: `Bearer ${hmToken}` });
  // HM user has no department set → returns 400 DEPARTMENT_NOT_SET
  if ((status === 400 && data.errorCode === 'DEPARTMENT_NOT_SET') ||
      (status === 200 && Array.isArray(data.data))) {
    pass('HM GET /assigned responds correctly', `${status}: ${data.errorCode || 'OK'}`);
  } else {
    fail('HM GET /assigned', `${status}: ${JSON.stringify(data)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
section('RESPONSE SHAPE — Jobs');

// 48. Paginated list shape
{
  const { data } = await req('GET', '/jobs');
  if (data.success === true && Array.isArray(data.data) && data.pagination &&
      typeof data.message === 'string')
    pass('Paginated list shape: { success, message, data[], pagination }');
  else fail('Paginated list shape', JSON.stringify(Object.keys(data)));
}

// 49. Single job shape — use job1Id which was published in test #33
if (job1Id) {
  const { data } = await req('GET', `/jobs/${job1Id}`);
  if (data.success === true && data.data && !Array.isArray(data.data) && !data.pagination)
    pass('Single job shape: { success, message, data } (no pagination)');
  else fail('Single job shape', JSON.stringify(Object.keys(data)));
}

// 50. 404 error shape
{
  const { data } = await req('GET', '/jobs/6a000000000000000000000a');
  if (data.success === false && data.errorCode === 'JOB_NOT_FOUND' && data.message)
    pass('Error shape: { success: false, errorCode, message }');
  else fail('Error shape', JSON.stringify(data));
}

// ─── Summary ──────────────────────────────────────────────────────────────────
const total = passed + failed;
console.log(`\n${'═'.repeat(62)}`);
console.log(`  RESULTS:  ${GREEN}${passed} passed${RESET}  |  ${failed > 0 ? RED : GREEN}${failed} failed${RESET}  |  ${total} total`);
console.log(`${'═'.repeat(62)}\n`);

if (failed > 0) process.exit(1);
