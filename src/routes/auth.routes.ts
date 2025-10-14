import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();
const authController = new AuthController();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/signup', authLimiter, authController.signUp);
router.post('/signin', authLimiter, authController.signIn);
router.post('/refresh', authLimiter, authController.refreshToken);

router.post('/signout', authenticate, authController.signOut);

export default router;