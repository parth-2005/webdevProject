import { v4 as uuidv4 } from 'uuid';
import { Candidate, Job } from '../../models/index.js';
import { parseCV } from '../../agents/ParserAgent.js';

// POST /api/candidates/apply — Public endpoint
export const apply = async (req, res, next) => {
  try {
    const { jobId, name, email, phone } = req.body;

    if (!jobId || !name || !email) {
      return res.status(400).json({ error: 'jobId, name, and email are required' });
    }

    const job = await Job.findById(jobId);
    if (!job || job.status !== 'active') {
      return res.status(404).json({ error: 'Job not found or not accepting applications' });
    }

    // Check if already applied
    const existing = await Candidate.findOne({ 'personal.email': email.toLowerCase(), jobId });
    if (existing) {
      return res.status(409).json({ error: 'You have already applied for this role' });
    }

    let cvText = '';
    let cvData = {};
    let shortlistStatus = false;
    let shortlistReason = '';

    // Extract text from CV if uploaded
    if (req.file) {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(req.file.buffer);
        cvText = pdfData.text;
      } catch (parseError) {
        cvText = req.file.buffer.toString('utf-8');
      }
    }

    // Create candidate
    const candidate = await Candidate.create({
      tenantId: job.tenantId,
      jobId,
      personal: {
        name,
        email: email.toLowerCase(),
        phone: phone || '',
      },
      cvText,
      pipelineStage: 'applied',
    });

    // Update job stats
    await Job.findByIdAndUpdate(jobId, { $inc: { 'stats.applied': 1 } });

    // AI shortlisting (async — don't block the response)
    if (cvText && job.rubric.length > 0) {
      setImmediate(async () => {
        try {
          const result = await parseCV(cvText, job.rubric, job.title);
          candidate.cvData = result.cvData || {};
          candidate.shortlistStatus = result.isShortlisted;
          candidate.shortlistReason = result.shortlistReason;

          if (result.isShortlisted) {
            candidate.pipelineStage = 'shortlisted';
            candidate.interviewToken = {
              token: uuidv4(),
              expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
              usedAt: null,
            };
            await Job.findByIdAndUpdate(jobId, { $inc: { 'stats.shortlisted': 1 } });
          }

          await candidate.save();
        } catch (aiError) {
          console.error('CV parsing failed for candidate:', candidate._id, aiError.message);
        }
      });
    }

    res.status(201).json({
      message: 'Application submitted successfully',
      candidateId: candidate._id,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/candidates/:jobId/list
export const getCandidatesByJob = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      stage,
      sort = 'createdAt',
      order = 'desc',
      search,
    } = req.query;

    const query: any = {
      jobId: req.params.jobId,
      tenantId: req.tenantId,
    };

    if (stage) query.pipelineStage = stage;
    if (search) {
      query.$or = [
        { 'personal.name': { $regex: search, $options: 'i' } },
        { 'personal.email': { $regex: search, $options: 'i' } },
      ];
    }

    const sortObj: any = {};
    if (sort === 'score') {
      sortObj['scores.overall'] = order === 'asc' ? 1 : -1;
    } else {
      sortObj[sort] = order === 'asc' ? 1 : -1;
    }

    const candidates = await Candidate.find(query)
      .sort(sortObj)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select('-interview.conversationHistory -cvText');

    const total = await Candidate.countDocuments(query);

    res.json({
      candidates,
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

// GET /api/candidates/:candidateId
export const getCandidate = async (req, res, next) => {
  try {
    const candidate = await Candidate.findOne({
      _id: req.params.candidateId,
      tenantId: req.tenantId,
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json({ candidate });
  } catch (error) {
    next(error);
  }
};

// POST /api/candidates/bulk-action
export const bulkAction = async (req, res, next) => {
  try {
    const { candidateIds, action, newStage } = req.body;

    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ error: 'candidateIds array is required' });
    }

    if (!action) {
      return res.status(400).json({ error: 'action is required (advance, reject, export)' });
    }

    let updateResult;
    switch (action) {
      case 'reject':
        updateResult = await Candidate.updateMany(
          { _id: { $in: candidateIds }, tenantId: req.tenantId },
          { pipelineStage: 'rejected' }
        );
        break;
      case 'advance':
        if (!newStage) {
          return res.status(400).json({ error: 'newStage is required for advance action' });
        }
        updateResult = await Candidate.updateMany(
          { _id: { $in: candidateIds }, tenantId: req.tenantId },
          { pipelineStage: newStage }
        );
        break;
      case 'export':
        const candidates = await Candidate.find({
          _id: { $in: candidateIds },
          tenantId: req.tenantId,
        }).select('personal scores pipelineStage');
        return res.json({ candidates });
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.json({
      message: `Bulk ${action} completed`,
      modifiedCount: updateResult?.modifiedCount || 0,
    });
  } catch (error) {
    next(error);
  }
};
