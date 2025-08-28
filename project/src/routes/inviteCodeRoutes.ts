import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  generateInviteCode,
  validateInviteCode,
  useInviteCode,
  getInviteCodesByDirector,
  revokeInviteCode,
  validateInviteCodeValidation,
  useInviteCodeValidation
} from '../controllers/inviteCodeController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Generate new invite code (requires director profile)
router.post('/generate', generateInviteCode);

// Validate invite code (public - no auth required for validation)
router.post('/validate', validateInviteCodeValidation, validateInviteCode);

// Use invite code (public - no auth required for usage)
router.post('/use', useInviteCodeValidation, useInviteCode);

// Get all invite codes for a director
router.get('/my-codes', getInviteCodesByDirector);

// Revoke an unused invite code
router.delete('/:codeId', revokeInviteCode);

export default router;
