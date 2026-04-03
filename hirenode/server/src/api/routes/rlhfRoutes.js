import { Router } from 'express';
import { createOverride, getLogs, applyCalibration } from '../controllers/rlhfController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/override', authorize('admin', 'hr_manager', 'recruiter'), createOverride);
router.get('/logs', authorize('admin'), getLogs);
router.post('/apply-calibration', authorize('admin'), applyCalibration);

export default router;
