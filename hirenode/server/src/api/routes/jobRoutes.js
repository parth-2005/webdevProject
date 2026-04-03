import { Router } from 'express';
import { createJob, getJobs, getJob, updateJob, updateJobStatus, generateJD, getTemplates, saveAsTemplate } from '../controllers/jobController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadJD } from '../middleware/upload.js';

const router = Router();

router.use(authenticate);

router.post('/create', authorize('admin', 'hr_manager', 'recruiter'), uploadJD.single('jdFile'), createJob);
router.get('/', getJobs);
router.get('/templates', getTemplates);
router.post('/templates', authorize('admin', 'hr_manager'), saveAsTemplate);
router.get('/:jobId', getJob);
router.patch('/:jobId', authorize('admin', 'hr_manager'), updateJob);
router.patch('/:jobId/status', authorize('admin', 'hr_manager'), updateJobStatus);
router.post('/generate-jd', authorize('admin', 'hr_manager', 'recruiter'), generateJD);

export default router;
