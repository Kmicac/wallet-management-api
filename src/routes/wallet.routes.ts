import { Router } from 'express';
import { WalletController } from '@/controllers/wallet.controller';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();
const walletController = new WalletController();

router.use(authenticate);

/**
 * @swagger
 * /api/wallets:
 *   get:
 *     summary: Get all wallets (paginated)
 *     description: Retrieve a paginated list of wallets for the authenticated user. Supports filtering by blockchain and search by tag.
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *         example: 10
 *       - in: query
 *         name: chain
 *         schema:
 *           type: string
 *           enum: [Ethereum, Bitcoin, Polygon, BSC, Solana, Avalanche]
 *         description: Filter by blockchain
 *         example: Ethereum
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in wallet tags
 *         example: Main
 *     responses:
 *       200:
 *         description: Wallets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WalletListResponse'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', walletController.getWalletsPaginated);

/**
 * @swagger
 * /api/wallets:
 *   post:
 *     summary: Create a new wallet
 *     description: Add a new cryptocurrency wallet to your account. The address will be validated for the specified blockchain.
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWalletRequest'
 *           examples:
 *             ethereum:
 *               summary: Ethereum wallet
 *               value:
 *                 chain: Ethereum
 *                 address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
 *                 tag: My Main ETH Wallet
 *             bitcoin:
 *               summary: Bitcoin wallet
 *               value:
 *                 chain: Bitcoin
 *                 address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
 *                 tag: BTC Savings
 *             solana:
 *               summary: Solana wallet
 *               value:
 *                 chain: Solana
 *                 address: "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK"
 *                 tag: SOL Trading Wallet
 *     responses:
 *       201:
 *         description: Wallet created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WalletResponse'
 *       400:
 *         description: Validation error - Invalid blockchain or address format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidChain:
 *                 summary: Unsupported blockchain
 *                 value:
 *                   success: false
 *                   message: Validation failed
 *                   error:
 *                     code: BAD_REQUEST
 *                     details: ["Unsupported blockchain: Cardano"]
 *               invalidAddress:
 *                 *                 summary: Invalid address format
 *                 value:
 *                   success: false
 *                   message: Blockchain address validation failed
 *                   error:
 *                     code: BLOCKCHAIN_VALIDATION_ERROR
 *                     details: ["Invalid Ethereum address format"]
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflict - Wallet with this address already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', walletController.createWallet);

/**
 * @swagger
 * /api/wallets/{id}:
 *   get:
 *     summary: Get wallet by ID
 *     description: Retrieve detailed information about a specific wallet
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Wallet unique identifier
 *         example: 987fcdeb-51a2-43f1-9876-ba9876543210
 *     responses:
 *       200:
 *         description: Wallet retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WalletResponse'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Wallet not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Wallet not found
 *               error:
 *                 code: NOT_FOUND
 */
router.get('/:id', walletController.getWalletById);

/**
 * @swagger
 * /api/wallets/{id}:
 *   put:
 *     summary: Update wallet
 *     description: Update wallet address or tag. The new address will be validated for the wallet's blockchain.
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Wallet unique identifier
 *         example: 987fcdeb-51a2-43f1-9876-ba9876543210
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWalletRequest'
 *           examples:
 *             updateTag:
 *               summary: Update only tag
 *               value:
 *                 tag: Updated Wallet Name
 *             updateAddress:
 *               summary: Update only address
 *               value:
 *                 address: "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"
 *             updateBoth:
 *               summary: Update both tag and address
 *               value:
 *                 address: "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"
 *                 tag: My Secondary Wallet
 *     responses:
 *       200:
 *         description: Wallet updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WalletResponse'
 *       400:
 *         description: Validation error - Invalid address format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Wallet not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflict - Another wallet with this address already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', walletController.updateWallet);

/**
 * @swagger
 * /api/wallets/{id}:
 *   delete:
 *     summary: Delete wallet
 *     description: Permanently delete a wallet from your account. This action cannot be undone.
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Wallet unique identifier
 *         example: 987fcdeb-51a2-43f1-9876-ba9876543210
 *     responses:
 *       200:
 *         description: Wallet deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Wallet deleted successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Wallet not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Wallet not found
 *               error:
 *                 code: NOT_FOUND
 */
router.delete('/:id', walletController.deleteWallet);

export default router;