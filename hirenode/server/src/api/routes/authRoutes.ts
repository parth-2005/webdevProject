import { Router } from 'express';
import { register, login, refreshToken, inviteTeamMember, logout, getMe } from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.post('/invite', authenticate, authorize('admin', 'hr_manager'), inviteTeamMember);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
