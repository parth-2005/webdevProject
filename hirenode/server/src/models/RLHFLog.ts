import mongoose from 'mongoose';

const rlhfLogSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  originalAiVerdict: {
    type: String,
    enum: ['shortlist', 'hold', 'reject'],
    required: true,
  },
  hrNewDecision: {
    type: String,
    enum: ['shortlist', 'hold', 'reject'],
    required: true,
  },
  hrFeedback: {
    type: String,
    default: '',
  },
  overriddenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  transcriptSnapshot: {
    type: Array,
    default: [],
  },
  scoresSnapshot: {
    type: Object,
    default: {},
  },
  processedForTraining: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

rlhfLogSchema.index({ tenantId: 1, processedForTraining: 1 });

const RLHFLog = mongoose.model('RLHFLog', rlhfLogSchema);
export default RLHFLog;
