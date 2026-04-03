import { Router } from 'express';
import { validateToken, startInterview, processAudio, concludeInterview, heartbeat, flagIntegrity } from '../controllers/interviewController.js';
import { uploadAudio } from '../middleware/upload.js';
import { interviewLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// All interview routes are token-based (no JWT auth needed)
router.get('/validate-token/:token', validateToken);
router.post('/start', startInterview);
router.post('/process-audio', interviewLimiter, uploadAudio.single('audio'), processAudio);
router.post('/conclude', concludeInterview);
router.post('/heartbeat', heartbeat);
router.post('/flag', flagIntegrity);

export default router;
