import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const walletController = new WalletController();

// All wallet routes require authentication
router.use(authenticate);

// Wallet CRUD routes
router.get('/', walletController.getAllWallets);
router.post('/', walletController.createWallet);
router.get('/:id', walletController.getWalletById);
router.put('/:id', walletController.updateWallet);
router.delete('/:id', walletController.deleteWallet);

export default router;