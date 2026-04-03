// Shared constants across client and server

export const ROLES = {
  ADMIN: 'admin',
  HR_MANAGER: 'hr_manager',
  RECRUITER: 'recruiter',
  HIRING_MANAGER: 'hiring_manager',
};

export const JOB_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  CLOSED: 'closed',
};

export const INTERVIEW_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
};

export const AI_VERDICT = {
  SHORTLIST: 'shortlist',
  HOLD: 'hold',
  REJECT: 'reject',
};

export const PLAN_TIERS = {
  STARTER: 'starter',
  GROWTH: 'growth',
  ENTERPRISE: 'enterprise',
};

export const PLAN_LIMITS = {
  [PLAN_TIERS.STARTER]: { roles: 3, interviews: 100 },
  [PLAN_TIERS.GROWTH]: { roles: 20, interviews: 500 },
  [PLAN_TIERS.ENTERPRISE]: { roles: Infinity, interviews: Infinity },
};

export const CANDIDATE_PIPELINE = {
  APPLIED: 'applied',
  SHORTLISTED: 'shortlisted',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  COMPLETED: 'completed',
  REVIEWED: 'reviewed',
  HIRED: 'hired',
  REJECTED: 'rejected',
};

export const INTEGRITY_FLAGS = {
  TAB_SWITCH: 'tab_switch',
  COPY_PASTE: 'copy_paste',
  BACKGROUND_VOICE: 'background_voice',
  LEFT_FRAME: 'left_frame',
};
