import { Job, Candidate } from '../../models/index.js';
import XLSX from 'xlsx';

// GET /api/hr/dashboard
export const getDashboard = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;

    const [totalJobs, activeJobs, totalCandidates, interviewsToday, pendingReviews] = await Promise.all([
      Job.countDocuments({ tenantId, isTemplate: false }),
      Job.countDocuments({ tenantId, status: 'active', isTemplate: false }),
      Candidate.countDocuments({ tenantId }),
      Candidate.countDocuments({
        tenantId,
        'interview.completedAt': {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      }),
      Candidate.countDocuments({
        tenantId,
        pipelineStage: 'completed',
        'scores.overall': null,
      }),
    ]);

    // Pipeline distribution
    const pipelineStats = await Candidate.aggregate([
      { $match: { tenantId: req.user.tenantId } },
      { $group: { _id: '$pipelineStage', count: { $sum: 1 } } },
    ]);

    // Recent candidates
    const recentCandidates = await Candidate.find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('personal pipelineStage scores.overall scores.aiVerdict jobId createdAt')
      .populate('jobId', 'title');

    // Average scores per job
    const avgScores = await Candidate.aggregate([
      { $match: { tenantId: req.user.tenantId, 'scores.overall': { $ne: null } } },
      {
        $group: {
          _id: '$jobId',
          avgScore: { $avg: '$scores.overall' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      metrics: {
        totalJobs,
        activeJobs,
        totalCandidates,
        interviewsToday,
        pendingReviews,
      },
      pipelineStats,
      recentCandidates,
      avgScores,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/hr/pipeline/:jobId
export const getPipeline = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const stages = ['applied', 'shortlisted', 'interview_scheduled', 'completed', 'reviewed', 'hired', 'rejected'];
    const pipeline = {};

    for (const stage of stages) {
      pipeline[stage] = await Candidate.find({
        jobId,
        tenantId: req.tenantId,
        pipelineStage: stage,
      })
        .select('personal scores.overall scores.aiVerdict pipelineStage createdAt')
        .sort({ 'scores.overall': -1 })
        .limit(50);
    }

    res.json({ pipeline });
  } catch (error) {
    next(error);
  }
};

// GET /api/hr/export-report/:jobId
export const exportReport = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const candidates = await Candidate.find({
      jobId,
      tenantId: req.tenantId,
    }).select('personal scores pipelineStage interview.duration flags');

    const data = candidates.map(c => ({
      Name: c.personal.name,
      Email: c.personal.email,
      Phone: c.personal.phone,
      Stage: c.pipelineStage,
      'Overall Score': c.scores.overall || 'N/A',
      'AI Verdict': c.scores.aiVerdict || 'N/A',
      'AI Summary': c.scores.aiSummary || '',
      'Integrity Score': c.scores.integrityScore,
      'Interview Duration (min)': c.interview?.duration ? Math.round(c.interview.duration / 60) : 'N/A',
      'Flags Count': c.flags?.length || 0,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Candidates');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=candidates_report_${jobId}.xlsx`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// POST /api/hr/share-report
export const shareReport = async (req, res, next) => {
  try {
    const { candidateIds, recipientEmail, message } = req.body;

    if (!candidateIds || !recipientEmail) {
      return res.status(400).json({ error: 'candidateIds and recipientEmail are required' });
    }

    // In production, this would generate PDF reports and email them
    // For MVP, we return the data that would be shared
    const candidates = await Candidate.find({
      _id: { $in: candidateIds },
      tenantId: req.tenantId,
    }).select('personal scores pipelineStage');

    res.json({
      message: 'Reports shared successfully',
      sharedWith: recipientEmail,
      candidateCount: candidates.length,
    });
  } catch (error) {
    next(error);
  }
};
