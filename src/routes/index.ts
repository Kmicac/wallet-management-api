import { Router } from 'express';
import authRoutes from './auth.routes';
import walletRoutes from './wallet.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/wallets', walletRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;