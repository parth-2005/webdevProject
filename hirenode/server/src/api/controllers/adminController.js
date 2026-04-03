import { Tenant, User, Candidate } from '../../models/index.js';

// GET /api/admin/usage
export const getUsage = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const totalInterviews = await Candidate.countDocuments({
      tenantId: req.tenantId,
      'interview.status': 'completed',
    });

    res.json({
      plan: tenant.plan,
      usage: {
        interviewsUsed: tenant.plan.interviewsUsed,
        interviewsLimit: tenant.plan.interviewsLimit,
        percentUsed: Math.round((tenant.plan.interviewsUsed / tenant.plan.interviewsLimit) * 100),
        totalCompletedInterviews: totalInterviews,
      },
      renewalDate: tenant.plan.renewalDate,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/settings
export const updateSettings = async (req, res, next) => {
  try {
    const { companyName, primaryColor, interviewWindowHours, reminderEnabled, brandingEnabled } = req.body;

    const updateObj = {};
    if (companyName) updateObj.companyName = companyName;
    if (primaryColor) updateObj.primaryColor = primaryColor;
    if (interviewWindowHours !== undefined) updateObj['settings.interviewWindowHours'] = interviewWindowHours;
    if (reminderEnabled !== undefined) updateObj['settings.reminderEnabled'] = reminderEnabled;
    if (brandingEnabled !== undefined) updateObj['settings.brandingEnabled'] = brandingEnabled;

    const tenant = await Tenant.findByIdAndUpdate(req.tenantId, updateObj, { new: true });

    res.json({ message: 'Settings updated', tenant });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/api-keys
export const updateApiKeys = async (req, res, next) => {
  try {
    const { groq, gemini, googleTts } = req.body;

    const updateObj = {};
    if (groq) updateObj['apiKeys.groq'] = groq;
    if (gemini) updateObj['apiKeys.gemini'] = gemini;
    if (googleTts) updateObj['apiKeys.googleTts'] = googleTts;

    await Tenant.findByIdAndUpdate(req.tenantId, updateObj);

    res.json({ message: 'API keys updated' });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/team
export const getTeam = async (req, res, next) => {
  try {
    const team = await User.find({ tenantId: req.tenantId })
      .select('-passwordHash -refreshToken')
      .sort({ createdAt: -1 });

    res.json({ team });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/team/:userId
export const removeTeamMember = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }

    const user = await User.findOneAndDelete({
      _id: userId,
      tenantId: req.tenantId,
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Team member removed' });
  } catch (error) {
    next(error);
  }
};
