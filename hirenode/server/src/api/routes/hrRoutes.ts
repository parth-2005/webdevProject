import { Router } from 'express';
import { getDashboard, getPipeline, exportReport, shareReport } from '../controllers/hrController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboard);
router.get('/pipeline/:jobId', getPipeline);
router.get('/export-report/:jobId', authorize('admin', 'hr_manager', 'recruiter'), exportReport);
router.post('/share-report', authorize('admin', 'hr_manager'), shareReport);

export default router;
