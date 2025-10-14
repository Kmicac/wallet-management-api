import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();
const authController = new AuthController();

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/signup', authLimiter, authController.signUp);
router.post('/signin', authLimiter, authController.signIn);

// Protected routes
router.post('/signout', authenticate, authController.signOut);

export default router;