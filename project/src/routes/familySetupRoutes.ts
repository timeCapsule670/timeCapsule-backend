import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  setupFamily,
  updateDirectorRole,
  createRelationships,
  familySetupValidation,
  updateDirectorRoleValidation,
  createRelationshipsValidation,
} from '../controllers/familySetupController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/family-setup
 * @desc    Complete family setup (update director role + create relationships)
 * @access  Private
 */
router.post('/', familySetupValidation, setupFamily);

/**
 * @route   PUT /api/family-setup/director-role
 * @desc    Update only the director's role/type
 * @access  Private
 */
router.put('/director-role', updateDirectorRoleValidation, updateDirectorRole);

/**
 * @route   POST /api/family-setup/relationships
 * @desc    Create only the director-actor relationships
 * @access  Private
 */
router.post('/relationships', createRelationshipsValidation, createRelationships);

export default router;
