import { Router } from 'express';
import { apply, getCandidatesByJob, getCandidate, bulkAction } from '../controllers/candidateController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadCV } from '../middleware/upload.js';
import { applyLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public endpoint — no auth required
router.post('/apply', applyLimiter, uploadCV.single('cv'), apply);

// Protected endpoints
router.get('/:jobId/list', authenticate, getCandidatesByJob);
router.get('/:candidateId', authenticate, getCandidate);
router.post('/bulk-action', authenticate, bulkAction);

export default router;
