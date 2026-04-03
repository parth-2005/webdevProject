import { Router } from 'express';
import { getUsage, updateSettings, updateApiKeys, getTeam, removeTeamMember } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/usage', getUsage);
router.patch('/settings', updateSettings);
router.post('/api-keys', updateApiKeys);
router.get('/team', getTeam);
router.delete('/team/:userId', removeTeamMember);

export default router;
