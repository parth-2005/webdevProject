import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    default: '',
  },
  rawJdText: {
    type: String,
    default: '',
  },
  rubric: [{
    competency: {
      type: String,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    description: {
      type: String,
      default: '',
    },
  }],
  questionBank: [{
    questionText: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['technical', 'behavioral', 'situational', 'warmup'],
      default: 'technical',
    },
    targetCompetency: {
      type: String,
      default: '',
    },
  }],
  status: {
    type: String,
    enum: ['active', 'paused', 'closed'],
    default: 'active',
  },
  candidatesRequired: {
    type: Number,
    default: 5,
  },
  stats: {
    applied: { type: Number, default: 0 },
    shortlisted: { type: Number, default: 0 },
    interviewed: { type: Number, default: 0 },
    avgScore: { type: Number, default: 0 },
  },
  isTemplate: {
    type: Boolean,
    default: false,
  },
  templateName: {
    type: String,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

jobSchema.index({ tenantId: 1, status: 1 });
jobSchema.index({ tenantId: 1, isTemplate: 1 });

const Job = mongoose.model('Job', jobSchema);
export default Job;
