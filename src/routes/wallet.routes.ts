import { Router } from 'express';
import { WalletController } from '@/controllers/wallet.controller';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();
const walletController = new WalletController();

router.use(authenticate);

router.get('/', walletController.getWalletsPaginated); 
router.post('/', walletController.createWallet);
router.get('/:id', walletController.getWalletById);
router.put('/:id', walletController.updateWallet);
router.delete('/:id', walletController.deleteWallet);

export default router;