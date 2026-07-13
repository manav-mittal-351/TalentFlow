// ─── services/dashboard.service.js ────────────────────────────────────────────
// Business logic for Recruiter, Candidate, and Hiring Manager Dashboards.
// Doc reference: Document 5 — API Design §16 (Dashboard Routes)
//
// Optimizations implemented:
// 1. MongoDB Aggregation Pipelines to aggregate pipeline breakdowns and
//    compute hired-this-month stats in a single pass.
// 2. Parallel query execution (Promise.all) to minimize latency and database
//    round trips.

import mongoose     from 'mongoose';
import Job          from '../models/Job.model.js';
import Application  from '../models/Application.model.js';
import Interview    from '../models/Interview.model.js';
import Feedback     from '../models/Feedback.model.js';
import Notification from '../models/Notification.model.js';
import User         from '../models/User.model.js';

// ─── GET /dashboard/recruiter ────────────────────────────────────────────────
/**
 * Gathers recruiter statistics, recent applications, upcoming interviews,
 * and application pipeline breakdowns.
 *
 * @param {string} recruiterId
 * @returns {Promise<object>} Recruiter dashboard data
 */
export const getRecruiterDashboard = async (recruiterId) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Fetch all job IDs created by this recruiter
  const recruiterJobs = await Job.find({ createdBy: recruiterId, isDeleted: false }).select('_id');
  const jobIds = recruiterJobs.map(j => j._id);

  // 2. Aggregate application stats (total count, hired this month, and pipeline status breakdown)
  // We run this as a single optimized MongoDB aggregation pipeline.
  const appStatsPipeline = [
    {
      $match: {
        job:       { $in: jobIds },
        isDeleted: false,
      },
    },
    {
      $facet: {
        total: [{ $count: 'count' }],
        hiredThisMonth: [
          {
            $match: {
              status:        'hired',
              statusHistory: {
                $elemMatch: {
                  status:    'hired',
                  changedAt: { $gte: startOfMonth },
                },
              },
            },
          },
          { $count: 'count' },
        ],
        breakdown: [
          {
            $group: {
              _id:   '$status',
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ];

  // 3. Execute all independent statistics, lists, and counts in parallel (Promise.all)
  const [
    openJobs,
    scheduledInterviews,
    unreadNotifications,
    appStatsResult,
    recentApplications,
    upcomingInterviews,
  ] = await Promise.all([
    Job.countDocuments({ createdBy: recruiterId, status: 'published', isDeleted: false }),
    Interview.countDocuments({ scheduledBy: recruiterId, status: 'scheduled' }),
    Notification.countDocuments({ recipient: recruiterId, isRead: false }),
    Application.aggregate(appStatsPipeline),
    // Limit 5 most recent applications
    Application.find({ job: { $in: jobIds }, isDeleted: false })
      .populate('candidate', 'name')
      .populate('job', 'title')
      .sort({ appliedAt: -1 })
      .limit(5)
      .lean(),
    // Limit 5 upcoming interviews (scheduled format, in the future)
    Interview.find({ scheduledBy: recruiterId, status: 'scheduled', scheduledAt: { $gte: now } })
      .populate('candidate', 'name')
      .populate('job', 'title')
      .sort({ scheduledAt: 1 })
      .limit(5)
      .lean(),
  ]);

  // Parse aggregation results
  const totalApplications = appStatsResult[0]?.total[0]?.count || 0;
  const hiredThisMonth    = appStatsResult[0]?.hiredThisMonth[0]?.count || 0;
  const rawBreakdown      = appStatsResult[0]?.breakdown || [];

  // Initialize pipeline status breakdown with defaults (Doc 05 lists all 8 statuses)
  const pipelineBreakdown = {
    applied:      0,
    under_review: 0,
    shortlisted:  0,
    interview:    0,
    offer:        0,
    hired:        0,
    rejected:     0,
    withdrawn:    0,
  };

  rawBreakdown.forEach((item) => {
    if (pipelineBreakdown[item._id] !== undefined) {
      pipelineBreakdown[item._id] = item.count;
    }
  });

  return {
    stats: {
      openJobs,
      totalApplications,
      scheduledInterviews,
      hiredThisMonth,
    },
    recentApplications,
    upcomingInterviews,
    pipelineBreakdown,
    unreadNotifications,
  };
};

// ─── GET /dashboard/candidate ────────────────────────────────────────────────
/**
 * Gathers candidate stats (total applications, active applications, upcoming
 * interviews, saved jobs count), recent applications, and the single next upcoming interview.
 *
 * @param {string} candidateId
 * @returns {Promise<object>} Candidate dashboard data
 */
export const getCandidateDashboard = async (candidateId) => {
  const now = new Date();
  const candIdObj = new mongoose.Types.ObjectId(candidateId);

  // 1. Aggregate candidate's application metrics in a single pass
  const appStatsPipeline = [
    {
      $match: {
        candidate: candIdObj,
        isDeleted: false,
      },
    },
    {
      $facet: {
        total: [{ $count: 'count' }],
        active: [
          {
            $match: {
              status: { $nin: ['hired', 'rejected', 'withdrawn'] },
            },
          },
          { $count: 'count' },
        ],
      },
    },
  ];

  // 2. Execute all candidate dashboard queries in parallel (Promise.all)
  const [
    userProfile,
    interviewsCount,
    unreadNotifications,
    appStatsResult,
    recentApplications,
    upcomingInterview,
  ] = await Promise.all([
    User.findById(candidateId).select('savedJobs'),
    Interview.countDocuments({ candidate: candidateId, status: 'scheduled', scheduledAt: { $gte: now } }),
    Notification.countDocuments({ recipient: candidateId, isRead: false }),
    Application.aggregate(appStatsPipeline),
    // Limit 5 recent applications. Nested populate to resolve job's company name.
    Application.find({ candidate: candidateId, isDeleted: false })
      .populate({
        path: 'job',
        select: 'title company',
        populate: {
          path:   'company',
          select: 'name',
        },
      })
      .sort({ appliedAt: -1 })
      .limit(5)
      .lean(),
    // Single most upcoming scheduled interview
    Interview.findOne({ candidate: candidateId, status: 'scheduled', scheduledAt: { $gte: now } })
      .populate('job', 'title')
      .sort({ scheduledAt: 1 })
      .lean(),
  ]);

  const totalApplications  = appStatsResult[0]?.total[0]?.count || 0;
  const activeApplications = appStatsResult[0]?.active[0]?.count || 0;
  const savedJobsCount     = userProfile?.savedJobs?.length || 0;

  // Formatting output to match Doc 05 §16 shape (upcomingInterview is null if none)
  const formattedUpcomingInterview = upcomingInterview
    ? {
        scheduledAt:           upcomingInterview.scheduledAt,
        format:                upcomingInterview.format,
        candidateInstructions: upcomingInterview.candidateInstructions || '',
        job:                   { title: upcomingInterview.job?.title || '' },
      }
    : null;

  return {
    stats: {
      totalApplications,
      activeApplications,
      interviews: interviewsCount,
      savedJobs:  savedJobsCount,
    },
    recentApplications,
    upcomingInterview: formattedUpcomingInterview,
    unreadNotifications,
  };
};

// ─── GET /dashboard/hiring-manager ───────────────────────────────────────────
/**
 * Gathers hiring manager statistics, upcoming interviews, and candidates pending review.
 * Stats: assignedJobs (published jobs in HM department), pendingReview,
 * feedbackSubmitted, scheduledInterviews.
 *
 * @param {string} hmId
 * @returns {Promise<object>} HM dashboard data
 */
export const getHiringManagerDashboard = async (hmId) => {
  const now = new Date();

  // 1. Fetch HM profile to discover department scoping
  const hm = await User.findById(hmId).select('department');
  if (!hm) {
    const err = new Error('User not found');
    err.statusCode = 404; err.errorCode = 'USER_NOT_FOUND'; throw err;
  }

  const dept = hm.department || '';

  // If HM has no department assigned, return empty dashboard payload immediately
  if (!dept) {
    return {
      stats: {
        assignedJobs:        0,
        pendingReview:       0,
        feedbackSubmitted:   0,
        scheduledInterviews: 0,
      },
      candidatesPendingReview: [],
      upcomingInterviews:      [],
      unreadNotifications:     0,
    };
  }

  // 2. Fetch all job IDs in HM's department
  const deptJobs = await Job.find({ department: dept, status: 'published', isDeleted: false }).select('_id');
  const jobIds = deptJobs.map(j => j._id);

  // 3. Execute HM counts and list queries in parallel (Promise.all)
  const [
    pendingReview,
    feedbackSubmitted,
    scheduledInterviews,
    candidatesPendingReview,
    upcomingInterviews,
    unreadNotifications,
  ] = await Promise.all([
    // pendingReview: shortlisted/interview status applications in HM department
    Application.countDocuments({ job: { $in: jobIds }, status: { $in: ['shortlisted', 'interview'] }, isDeleted: false }),
    // feedbackSubmitted: total scorecards filed by this HM
    Feedback.countDocuments({ submittedBy: hmId }),
    // scheduledInterviews count: upcoming interviews conducted by this HM
    Interview.countDocuments({ interviewer: hmId, status: 'scheduled', scheduledAt: { $gte: now } }),
    // candidatesPendingReview: limit 5. shortlisted/interview status applications in HM department
    Application.find({ job: { $in: jobIds }, status: { $in: ['shortlisted', 'interview'] }, isDeleted: false })
      .populate('candidate', 'name')
      .populate('job', 'title')
      .limit(5)
      .lean(),
    // upcomingInterviews list: limit 5. scheduled format, interviewer == hmId, in the future
    Interview.find({ interviewer: hmId, status: 'scheduled', scheduledAt: { $gte: now } })
      .populate('candidate', 'name')
      .populate('job', 'title')
      .sort({ scheduledAt: 1 })
      .limit(5)
      .lean(),
    Notification.countDocuments({ recipient: hmId, isRead: false }),
  ]);

  return {
    stats: {
      assignedJobs: jobIds.length,
      pendingReview,
      feedbackSubmitted,
      scheduledInterviews,
    },
    candidatesPendingReview,
    upcomingInterviews,
    unreadNotifications,
  };
};
