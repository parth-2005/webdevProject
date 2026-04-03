import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: 100,
  },
  subdomain: {
    type: String,
    required: [true, 'Subdomain is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'],
  },
  logoUrl: {
    type: String,
    default: null,
  },
  primaryColor: {
    type: String,
    default: '#38BDF8',
  },
  plan: {
    tier: {
      type: String,
      enum: ['starter', 'growth', 'enterprise'],
      default: 'starter',
    },
    interviewsLimit: {
      type: Number,
      default: 100,
    },
    interviewsUsed: {
      type: Number,
      default: 0,
    },
    renewalDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  apiKeys: {
    groq: { type: String, default: null },
    gemini: { type: String, default: null },
    googleTts: { type: String, default: null },
  },
  settings: {
    interviewWindowHours: {
      type: Number,
      default: 72,
    },
    reminderEnabled: {
      type: Boolean,
      default: true,
    },
    brandingEnabled: {
      type: Boolean,
      default: false,
    },
  },
}, {
  timestamps: true,
});

tenantSchema.index({ subdomain: 1 });

const Tenant = mongoose.model('Tenant', tenantSchema);
export default Tenant;
