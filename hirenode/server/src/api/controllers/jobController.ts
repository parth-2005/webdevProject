import { Job, Candidate } from '../../models/index.js';
import { parseJD } from '../../agents/ParserAgent.js';

// POST /api/jobs/create
export const createJob = async (req, res, next) => {
  try {
    const { title, description, candidatesRequired } = req.body;
    const tenantId = req.tenantId;
    let rawJdText = description || '';

    // If file uploaded, extract text from it
    if (req.file) {
      rawJdText = req.file.buffer.toString('utf-8');
    }

    // Create the job first
    const job = await Job.create({
      tenantId,
      title,
      description: description || rawJdText.substring(0, 500),
      rawJdText,
      candidatesRequired: candidatesRequired || 5,
      createdBy: req.user._id,
    });

    // Parse JD with AI to generate rubric and question bank
    if (rawJdText) {
      try {
        const parsed = await parseJD(rawJdText, title);
        job.rubric = parsed.rubric || [];
        job.questionBank = parsed.questionBank || [];
        await job.save();
      } catch (aiError) {
        console.error('AI parsing failed, job created without rubric:', aiError.message);
      }
    }

    res.status(201).json({
      message: 'Job created successfully',
      job,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs — List all jobs for tenant
export const getJobs = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query: any = { tenantId: req.tenantId, isTemplate: false };

    if (status) query.status = status;

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');

    const total = await Job.countDocuments(query);

    res.json({
      jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs/:jobId
export const getJob = async (req, res, next) => {
  try {
    const job = await Job.findOne({
      _id: req.params.jobId,
      tenantId: req.tenantId,
    }).populate('createdBy', 'name email');

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get candidate stats
    const candidateCounts = await Candidate.aggregate([
      { $match: { jobId: job._id } },
      { $group: { _id: '$pipelineStage', count: { $sum: 1 } } },
    ]);

    const stats = {};
    candidateCounts.forEach(c => { stats[c._id] = c.count; });

    res.json({ job, candidateStats: stats });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/jobs/:jobId
export const updateJob = async (req, res, next) => {
  try {
    const { title, description, rubric, questionBank, candidatesRequired } = req.body;

    const job = await Job.findOneAndUpdate(
      { _id: req.params.jobId, tenantId: req.tenantId },
      {
        ...(title && { title }),
        ...(description && { description }),
        ...(rubric && { rubric }),
        ...(questionBank && { questionBank }),
        ...(candidatesRequired && { candidatesRequired }),
      },
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ message: 'Job updated', job });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/jobs/:jobId/status
export const updateJobStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['active', 'paused', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const job = await Job.findOneAndUpdate(
      { _id: req.params.jobId, tenantId: req.tenantId },
      { status },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ message: `Job status updated to ${status}`, job });
  } catch (error) {
    next(error);
  }
};

// POST /api/jobs/generate-jd
export const generateJD = async (req, res, next) => {
  try {
    const { roleName, teamContext, techStack } = req.body;

    if (!roleName) {
      return res.status(400).json({ error: 'roleName is required' });
    }

    const { generateJobDescription } = await import('../../agents/ParserAgent.js');
    const jd = await generateJobDescription(roleName, teamContext, techStack);

    res.json({ generatedJD: jd });
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs/templates
export const getTemplates = async (req, res, next) => {
  try {
    const templates = await Job.find({
      tenantId: req.tenantId,
      isTemplate: true,
    }).sort({ createdAt: -1 });

    res.json({ templates });
  } catch (error) {
    next(error);
  }
};

// POST /api/jobs/templates
export const saveAsTemplate = async (req, res, next) => {
  try {
    const { jobId, templateName } = req.body;

    const job = await Job.findOne({ _id: jobId, tenantId: req.tenantId });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const template = await Job.create({
      tenantId: req.tenantId,
      title: job.title,
      description: job.description,
      rawJdText: job.rawJdText,
      rubric: job.rubric,
      questionBank: job.questionBank,
      isTemplate: true,
      templateName: templateName || `${job.title} Template`,
      createdBy: req.user._id,
    });

    res.status(201).json({ message: 'Template saved', template });
  } catch (error) {
    next(error);
  }
};
