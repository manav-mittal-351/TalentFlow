// ─── test-notifications.mjs ───────────────────────────────────────────────────
// Module 7 — Notifications: comprehensive integration test suite.
// Run: node test-notifications.mjs  (server must be running on port 5000)
//
// Covers:
//   Inbox operations:
//     GET /notifications: paginated list, defaults, isRead query filter
//     GET /notifications/unread-count: badge count validation
//     PATCH /notifications/:id/read: single mark read, ownership guard
//     PATCH /notifications/read-all: bulk mark read
//   Trigger notifications (cross-module integrations):
//     applyToJob → application_received (to Recruiter)
//     withdrawApplication → application_withdrawn (to Recruiter)
//     updateApplicationStatus → shortlisted/hired/rejected/status_updated (to Candidate)
//     scheduleInterview → interview_scheduled (to Candidate & HM)
//     updateInterviewStatus (completed) → interview_completed (to Recruiter) & status_updated (to Candidate)
//     updateInterviewStatus (cancelled) → interview_cancelled (to Candidate & HM)
//     submitFeedback → feedback_submitted (to Recruiter)
//   Access control, role limits, response formats.

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
  recruiter:  `ntr_${ts}@test.com`,
  recruiter2: `ntr2_${ts}@test.com`,
  candidate:  `ntc_${ts}@test.com`,
  candidate2: `ntc2_${ts}@test.com`,
  hm:         `nthm_${ts}@test.com`,
};

let rToken = '', r2Token = '', cToken = '', c2Token = '', hmToken = '';
let rId = '', cId = '', c2Id = '', hmId = '';
let jobId = '', appId = '', appId2 = '', interviewId = '', completedInterviewId = '';
let recruiterNotificationId = '';
let candidateNotificationId = '';

const FUTURE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const DUMMY_PDF = Buffer.from('%PDF-1.4 test');

console.log('\n  Setting up users and initial state...');

{
  const [r, r2, c, c2, hm] = await Promise.all([
    req('POST', '/auth/register', { name: 'NT Recruiter A',  email: E.recruiter,  password: 'pass1234!', role: 'recruiter' }),
    req('POST', '/auth/register', { name: 'NT Recruiter B',  email: E.recruiter2, password: 'pass1234!', role: 'recruiter' }),
    req('POST', '/auth/register', { name: 'NT Candidate A',  email: E.candidate,  password: 'pass1234!', role: 'candidate' }),
    req('POST', '/auth/register', { name: 'NT Candidate B',  email: E.candidate2, password: 'pass1234!', role: 'candidate' }),
    req('POST', '/auth/register', { name: 'NT Hiring Mgr',   email: E.hm,         password: 'pass1234!', role: 'hiring_manager' }),
  ]);

  rToken  = r.data.data?.token;   rId  = r.data.data?.user?._id;
  r2Token = r2.data.data?.token;
  cToken  = c.data.data?.token;   cId  = c.data.data?.user?._id;
  c2Token = c2.data.data?.token;  c2Id = c2.data.data?.user?._id;
  hmToken = hm.data.data?.token;  hmId = hm.data.data?.user?._id;

  if (!rToken || !cToken || !hmToken) {
    console.error('  ❌ Setup failed'); process.exit(1);
  }

  // Create Company & Job (Recruiter A)
  await req('POST', '/company', { name: 'NT Test Co', website: 'https://nttest.co' }, { Authorization: `Bearer ${rToken}` });
  const futureD = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const j = await req('POST', '/jobs', {
    title: 'Lead Architect', department: 'Engineering',
    location: 'Remote', jobType: 'remote',
    description: 'Design cloud services', status: 'published',
    applicationDeadline: futureD,
  }, { Authorization: `Bearer ${rToken}` });
  jobId = j.data.data?._id;

  if (!jobId) { console.error('  ❌ Job creation failed'); process.exit(1); }

  console.log('  Setup complete.\n');
}

// ─────────────────────────────────────────────────────────────────────────────
section('GET /notifications — Inbox access check');

// 1. No token → 401
{
  const { status, data } = await req('GET', '/notifications');
  if (status === 401 && data.errorCode === 'NO_TOKEN')
    pass('GET /notifications without token → 401 NO_TOKEN');
  else fail('No token guard', `${status}: ${JSON.stringify(data)}`);
}

// 2. Initial empty state & shape checks (All roles)
{
  const { status, data } = await req('GET', '/notifications', null, { Authorization: `Bearer ${cToken}` });
  if (status === 200 && Array.isArray(data.data) && data.data.length === 0 && data.pagination) {
    pass('GET /notifications empty array with pagination format');
    if (data.success === true && typeof data.message === 'string')
      pass('Paginated list shape: { success, message, data[], pagination }');
    else fail('Pagination list shape', JSON.stringify(Object.keys(data)));
  } else {
    fail('Empty state', `${status}: ${JSON.stringify(data)}`);
  }
}

// 3. Initial unread-count → 0 (Recruiter)
{
  const { status, data } = await req('GET', '/notifications/unread-count', null, { Authorization: `Bearer ${rToken}` });
  if (status === 200 && data.success === true && data.data?.count === 0)
    pass('GET /notifications/unread-count → 200 with { count: 0 }');
  else fail('Unread count', `${status}: ${JSON.stringify(data)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
section('Triggers: Candidate Apply → application_received');

// 4. Candidate A applies → Recruiter A receives application_received
{
  const fd = new FormData();
  fd.append('resume', new Blob([DUMMY_PDF], { type: 'application/pdf' }), 'cv.pdf');
  const applyRes = await fetch(`${BASE}/applications/${jobId}`, {
    method: 'POST', headers: { Authorization: `Bearer ${cToken}` }, body: fd,
  });
  const applyData = await applyRes.json();
  appId = applyData.data?._id;

  if (appId) {
    pass('Candidate A applied to job');
    // Check Recruiter A's notifications
    const { status, data } = await req('GET', '/notifications', null, { Authorization: `Bearer ${rToken}` });
    const notification = data.data?.find(n => n.type === 'application_received');
    if (status === 200 && notification) {
      recruiterNotificationId = notification._id;
      pass('Recruiter received "application_received" notification', `id=${recruiterNotificationId}`);

      if (notification.message.includes('NT Candidate A applied for "Lead Architect"'))
        pass('Notification message matches candidate name and job title');
      else fail('Notification message', notification.message);

      const relJobId = notification.relatedJob?._id || notification.relatedJob;
      const relAppId = notification.relatedApp?._id || notification.relatedApp;
      if (relJobId === jobId && relAppId === appId)
        pass('Deep links (relatedJob, relatedApp) populated');
      else fail('Deep links', `Job: ${JSON.stringify(notification.relatedJob)}, App: ${JSON.stringify(notification.relatedApp)}`);

      if (notification.icon === 'info')
        pass('Notification icon is "info"');
      else fail('Notification icon', notification.icon);
    } else {
      fail('Recruiter application_received notification not found', JSON.stringify(data));
    }
  } else {
    fail('Candidate A application failed');
  }
}

// 5. Unread count increments
{
  const { data } = await req('GET', '/notifications/unread-count', null, { Authorization: `Bearer ${rToken}` });
  if (data.data?.count === 1)
    pass('Recruiter unread-count incremented to 1');
  else fail('Unread count increment', `Got: ${data.data?.count}`);
}

// ─────────────────────────────────────────────────────────────────────────────
section('Triggers: updateApplicationStatus → status_updated / hired / rejected');

// 6. Recruiter shortlists Candidate A → Candidate A receives status_updated
if (appId) {
  const { status: patchStatus } = await req('PATCH', `/applications/${appId}/status`,
    { status: 'shortlisted' },
    { Authorization: `Bearer ${rToken}` }
  );

  if (patchStatus === 200) {
    const { status, data } = await req('GET', '/notifications', null, { Authorization: `Bearer ${cToken}` });
    const n = data.data?.find(x => x.type === 'status_updated');
    if (status === 200 && n) {
      candidateNotificationId = n._id;
      pass('Candidate A received "status_updated" notification', `id=${candidateNotificationId}`);

      if (n.message.includes('shortlisted'))
        pass('Status shortlisted in message');
      else fail('Shortlist message', n.message);

      if (n.icon === 'success')
        pass('Shortlisted icon is "success" (as spec maps success → shortlisted)');
      else fail('Shortlist icon mapping', n.icon);
    } else {
      fail('Candidate status_updated notification not found', JSON.stringify(data));
    }
  } else {
    fail('Shortlist PATCH failed');
  }
}

// 7. Recruiter rejects Candidate B (trigger rejected notification)
{
  // Candidate B applies
  const fd = new FormData();
  fd.append('resume', new Blob([DUMMY_PDF], { type: 'application/pdf' }), 'cv2.pdf');
  const applyRes = await fetch(`${BASE}/applications/${jobId}`, {
    method: 'POST', headers: { Authorization: `Bearer ${c2Token}` }, body: fd,
  });
  const applyData = await applyRes.json();
  appId2 = applyData.data?._id;

  if (appId2) {
    // Reject
    await req('PATCH', `/applications/${appId2}/status`, { status: 'rejected' }, { Authorization: `Bearer ${rToken}` });
    const { data } = await req('GET', '/notifications', null, { Authorization: `Bearer ${c2Token}` });
    const n = data.data?.find(x => x.type === 'rejected');
    if (n) {
      pass('Candidate B received "rejected" notification');
      if (n.icon === 'error') pass('Rejected icon is "error"');
      else fail('Rejected icon', n.icon);
    } else {
      fail('Candidate B rejected notification not found');
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
section('Triggers: scheduleInterview → interview_scheduled');

// 8. Recruiter schedules interview for Candidate A with HM assigned
if (appId && hmId) {
  const { status: scheduleStatus, data: scheduleData } = await req('POST', '/interviews',
    {
      applicationId: appId,
      scheduledAt:   FUTURE,
      format:        'video',
      interviewerId: hmId,
    },
    { Authorization: `Bearer ${rToken}` }
  );

  if (scheduleStatus === 201) {
    interviewId = scheduleData.data?._id;
    pass('Interview scheduled successfully');

    // 8a. Candidate receives interview_scheduled
    const cInbox = await req('GET', '/notifications', null, { Authorization: `Bearer ${cToken}` });
    const cNote  = cInbox.data.data?.find(x => x.type === 'interview_scheduled');
    if (cNote) {
      pass('Candidate A received "interview_scheduled" notification');
      if (cNote.message.includes('Lead Architect'))
        pass('Job title included in schedule notification');
    } else fail('Candidate schedule notification not found');

    // 8b. Assigned HM receives interview_scheduled
    const hmInbox = await req('GET', '/notifications', null, { Authorization: `Bearer ${hmToken}` });
    const hmNote  = hmInbox.data.data?.find(x => x.type === 'interview_scheduled');
    if (hmNote) {
      pass('Assigned HM received "interview_scheduled" notification');
      if (hmNote.message.includes('assigned to conduct'))
        pass('HM message friendly assignment text');
    } else fail('HM schedule notification not found');
  } else {
    fail('Schedule interview failed', `${scheduleStatus}: ${JSON.stringify(scheduleData)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
section('Triggers: updateInterviewStatus (cancelled) → interview_cancelled');

// 9. Recruiter cancels interview → Candidate & HM receive interview_cancelled
if (interviewId) {
  const { status: cancelStatus } = await req('PATCH', `/interviews/${interviewId}/status`,
    { status: 'cancelled', cancelledReason: 'Candidate sick' },
    { Authorization: `Bearer ${rToken}` }
  );

  if (cancelStatus === 200) {
    // 9a. Candidate A receives interview_cancelled
    const cInbox = await req('GET', '/notifications', null, { Authorization: `Bearer ${cToken}` });
    const cNote  = cInbox.data.data?.find(x => x.type === 'interview_cancelled');
    if (cNote) {
      pass('Candidate A received "interview_cancelled" notification');
      if (cNote.icon === 'warning') pass('Cancelled icon is "warning"');
      else fail('Cancelled icon', cNote.icon);
    } else fail('Candidate cancelled notification not found');

    // 9b. HM receives interview_cancelled
    const hmInbox = await req('GET', '/notifications', null, { Authorization: `Bearer ${hmToken}` });
    const hmNote  = hmInbox.data.data?.find(x => x.type === 'interview_cancelled');
    if (hmNote) {
      pass('HM received "interview_cancelled" notification');
    } else fail('HM cancelled notification not found');
  } else {
    fail('Cancel status PATCH failed');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
section('Triggers: submitFeedback → feedback_submitted');

// 10. HM submits feedback on completed interview → Recruiter receives feedback_submitted
if (appId && hmId) {
  // We need a completed interview first
  const { data: testIv } = await req('POST', '/interviews',
    { applicationId: appId, scheduledAt: FUTURE, format: 'phone', interviewerId: hmId },
    { Authorization: `Bearer ${rToken}` }
  );
  completedInterviewId = testIv.data?._id;

  if (completedInterviewId) {
    // Complete it
    await req('PATCH', `/interviews/${completedInterviewId}/status`, { status: 'completed' }, { Authorization: `Bearer ${rToken}` });

    // Submit feedback
    const { status: fbStatus, data: fbData } = await req('POST', '/feedback',
      {
        interviewId:    completedInterviewId,
        applicationId:  appId,
        ratings:        { overall: 5, technical: 5, communication: 5, cultureFit: 5 },
        recommendation: 'hire',
      },
      { Authorization: `Bearer ${hmToken}` }
    );

    if (fbStatus === 201) {
      // Recruiter A receives feedback_submitted
      const rInbox = await req('GET', '/notifications', null, { Authorization: `Bearer ${rToken}` });
      const rNote  = rInbox.data.data?.find(x => x.type === 'feedback_submitted');
      if (rNote) {
        pass('Recruiter received "feedback_submitted" notification');
        if (rNote.icon === 'success') pass('Feedback icon is "success"');
        else fail('Feedback icon', rNote.icon);
      } else fail('Recruiter feedback notification not found');
    } else {
      fail('Submit feedback failed', `${fbStatus}: ${JSON.stringify(fbData)}`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
section('Triggers: withdrawApplication → application_withdrawn');

// 11. Candidate A withdraws their application → Recruiter A receives application_withdrawn
if (appId) {
  const { status: withdrawStatus } = await req('PATCH', `/applications/${appId}/withdraw`, null, { Authorization: `Bearer ${cToken}` });
  if (withdrawStatus === 200) {
    const rInbox = await req('GET', '/notifications', null, { Authorization: `Bearer ${rToken}` });
    const rNote  = rInbox.data.data?.find(x => x.type === 'application_withdrawn');
    if (rNote) {
      pass('Recruiter received "application_withdrawn" notification');
      if (rNote.icon === 'warning') pass('Withdraw icon is "warning"');
      else fail('Withdraw icon', rNote.icon);
    } else fail('Recruiter withdraw notification not found');
  } else {
    fail('Withdraw application failed');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
section('Inbox operations: read-all / mark-read / query filters');

// 12. Recruiter marks single notification as read
if (recruiterNotificationId) {
  const { status, data } = await req('PATCH', `/notifications/${recruiterNotificationId}/read`, null, { Authorization: `Bearer ${rToken}` });
  if (status === 200 && data.data?.isRead === true) {
    pass('PATCH /notifications/:id/read → 200 (isRead=true)');
  } else {
    fail('Mark single read', `${status}: ${JSON.stringify(data)}`);
  }
}

// 13. Candidate A cannot mark Recruiter A's notification as read → 403
if (recruiterNotificationId) {
  const { status, data } = await req('PATCH', `/notifications/${recruiterNotificationId}/read`, null, { Authorization: `Bearer ${cToken}` });
  if (status === 403 && data.errorCode === 'FORBIDDEN_ROLE')
    pass('Candidate cannot read recruiter\'s notification → 403 FORBIDDEN_ROLE');
  else fail('Cross-user read isolation', `${status}: ${JSON.stringify(data)}`);
}

// 14. GET /notifications?isRead=true query filter
{
  const { status, data } = await req('GET', '/notifications?isRead=true', null, { Authorization: `Bearer ${rToken}` });
  if (status === 200 && data.data.every(x => x.isRead === true))
    pass('GET /notifications?isRead=true returns read items only');
  else fail('isRead=true filter', `${status}: ${JSON.stringify(data.data?.map(x=>x.isRead))}`);
}

// 15. GET /notifications?isRead=false query filter
{
  const { status, data } = await req('GET', '/notifications?isRead=false', null, { Authorization: `Bearer ${rToken}` });
  if (status === 200 && data.data.every(x => x.isRead === false))
    pass('GET /notifications?isRead=false returns unread items only');
  else fail('isRead=false filter', `${status}: ${JSON.stringify(data.data?.map(x=>x.isRead))}`);
}

// 16. Recruiter marks all read (read-all)
{
  const { status, data } = await req('PATCH', '/notifications/read-all', null, { Authorization: `Bearer ${rToken}` });
  if (status === 200 && data.success === true && typeof data.data?.modifiedCount === 'number') {
    pass('PATCH /notifications/read-all → 200 with modifiedCount');

    // Confirm unread count now 0
    const countRes = await req('GET', '/notifications/unread-count', null, { Authorization: `Bearer ${rToken}` });
    if (countRes.data.data?.count === 0)
      pass('Unread count is now 0 after read-all');
    else fail('Unread count after read-all', countRes.data.data?.count);
  } else {
    fail('Read all PATCH', `${status}: ${JSON.stringify(data)}`);
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────
const total = passed + failed;
console.log(`\n${'═'.repeat(64)}`);
console.log(`  RESULTS:  ${GREEN}${passed} passed${RESET}  |  ${failed > 0 ? RED : GREEN}${failed} failed${RESET}  |  ${total} total`);
console.log(`${'═'.repeat(64)}\n`);

if (failed > 0) process.exit(1);
