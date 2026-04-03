import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true,
  },
  personal: {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
  },
  cvUrl: {
    type: String,
    default: null,
  },
  cvText: {
    type: String,
    default: '',
  },
  cvData: {
    skills: [String],
    experience: { type: Number, default: 0 },
    companies: [String],
    education: { type: String, default: '' },
  },
  shortlistStatus: {
    type: Boolean,
    default: false,
  },
  shortlistReason: {
    type: String,
    default: '',
  },
  pipelineStage: {
    type: String,
    enum: ['applied', 'shortlisted', 'interview_scheduled', 'completed', 'reviewed', 'hired', 'rejected'],
    default: 'applied',
  },
  interviewToken: {
    token: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    usedAt: { type: Date, default: null },
  },
  interview: {
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'expired'],
      default: 'pending',
    },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    duration: { type: Number, default: 0 },
    conversationHistory: [{
      role: { type: String, enum: ['ai', 'candidate'], required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      competencyAssessed: { type: String, default: null },
      preliminaryScore: { type: Number, default: null },
    }],
    questionCount: { type: Number, default: 0 },
    audioSegmentRefs: [String],
  },
  scores: {
    overall: { type: Number, default: null },
    breakdown: [{
      competency: String,
      score: Number,
      reasoning: String,
    }],
    integrityScore: { type: Number, default: 100 },
    aiVerdict: {
      type: String,
      enum: ['shortlist', 'hold', 'reject', null],
      default: null,
    },
    aiSummary: { type: String, default: '' },
    confidence: { type: Number, default: null },
    redFlags: [String],
  },
  hrOverride: {
    overridden: { type: Boolean, default: false },
    newDecision: { type: String, default: null },
    overriddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reason: { type: String, default: '' },
    timestamp: { type: Date, default: null },
  },
  candidateFeedback: {
    rating: { type: Number, min: 1, max: 5, default: null },
    text: { type: String, default: '' },
  },
  flags: [{
    type: {
      type: String,
      enum: ['tab_switch', 'copy_paste', 'background_voice', 'left_frame'],
    },
    timestamp: { type: Date, default: Date.now },
    detail: { type: String, default: '' },
  }],
}, {
  timestamps: true,
});

candidateSchema.index({ tenantId: 1, jobId: 1 });
candidateSchema.index({ 'personal.email': 1, jobId: 1 });
candidateSchema.index({ 'interviewToken.token': 1 });
candidateSchema.index({ pipelineStage: 1 });

const Candidate = mongoose.model('Candidate', candidateSchema);
export default Candidate;
