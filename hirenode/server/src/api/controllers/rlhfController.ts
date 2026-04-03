import { RLHFLog, Candidate } from '../../models/index.js';

// POST /api/rlhf/override
export const createOverride = async (req, res, next) => {
  try {
    const { candidateId, newDecision, feedback } = req.body;

    if (!candidateId || !newDecision) {
      return res.status(400).json({ error: 'candidateId and newDecision are required' });
    }

    const candidate = await Candidate.findOne({
      _id: candidateId,
      tenantId: req.tenantId,
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    if (!candidate.scores.aiVerdict) {
      return res.status(400).json({ error: 'Candidate has not been evaluated yet' });
    }

    // Log the override
    const rlhfLog = await RLHFLog.create({
      tenantId: req.tenantId,
      candidateId: candidate._id,
      jobId: candidate.jobId,
      originalAiVerdict: candidate.scores.aiVerdict,
      hrNewDecision: newDecision,
      hrFeedback: feedback || '',
      overriddenBy: req.user._id,
      transcriptSnapshot: candidate.interview.conversationHistory,
      scoresSnapshot: candidate.scores,
    });

    // Update candidate
    candidate.hrOverride = {
      overridden: true,
      newDecision,
      overriddenBy: req.user._id,
      reason: feedback || '',
      timestamp: new Date(),
    };

    // Update pipeline stage based on decision
    if (newDecision === 'shortlist') {
      candidate.pipelineStage = 'reviewed';
    } else if (newDecision === 'reject') {
      candidate.pipelineStage = 'rejected';
    }

    await candidate.save();

    res.json({
      message: 'Override recorded',
      rlhfLogId: rlhfLog._id,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/rlhf/logs
export const getLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const logs = await RLHFLog.find({ tenantId: req.tenantId })
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('candidateId', 'personal')
      .populate('overriddenBy', 'name email')
      .populate('jobId', 'title');

    const total = await RLHFLog.countDocuments({ tenantId: req.tenantId });

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/rlhf/apply-calibration
export const applyCalibration = async (req, res, next) => {
  try {
    const unprocessedLogs = await RLHFLog.find({
      tenantId: req.tenantId,
      processedForTraining: false,
    });

    if (unprocessedLogs.length === 0) {
      return res.json({ message: 'No new overrides to process' });
    }

    // Analyze override patterns
    const analysis = {
      totalOverrides: unprocessedLogs.length,
      overridePatterns: {},
    };

    unprocessedLogs.forEach(log => {
      const key = `${log.originalAiVerdict}_to_${log.hrNewDecision}`;
      analysis.overridePatterns[key] = (analysis.overridePatterns[key] || 0) + 1;
    });

    // Mark as processed
    await RLHFLog.updateMany(
      { _id: { $in: unprocessedLogs.map(l => l._id) } },
      { processedForTraining: true }
    );

    res.json({
      message: 'Calibration applied',
      analysis,
    });
  } catch (error) {
    next(error);
  }
};
