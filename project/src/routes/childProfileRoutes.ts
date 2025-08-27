import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  createChildProfiles,
  getChildProfiles,
  getChildProfile,
  updateChildProfile,
  deleteChildProfile,
  bulkUpdateChildProfiles,
  createChildProfilesValidation,
  updateChildProfileValidation
} from '../controllers/childProfileController';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Child profile setup happens during onboarding BEFORE role selection
// So we only require authentication, not specific roles
// router.use(authorize(['director', 'parent', 'admin'])); // Commented out for onboarding flow

// Alternative: If you want to restrict to only users without roles (new users)
// router.use(authorize([])); // This allows any authenticated user

/**
 * @route POST /api/child-profiles
 * @desc Create child profiles with full setup flow
 * @access Private (Directors/Parents)
 */
router.post('/', createChildProfilesValidation, createChildProfiles);

/**
 * @route GET /api/child-profiles
 * @desc Get all child profiles for the authenticated user
 * @access Private (Directors/Parents)
 */
router.get('/', getChildProfiles);

/**
 * @route GET /api/child-profiles/:id
 * @desc Get a specific child profile by ID
 * @access Private (Directors/Parents)
 */
router.get('/:id', getChildProfile);

/**
 * @route PUT /api/child-profiles/:id
 * @desc Update a child profile
 * @access Private (Directors/Parents)
 */
router.put('/:id', updateChildProfileValidation, updateChildProfile);

/**
 * @route PATCH /api/child-profiles/:id
 * @desc Partially update a child profile
 * @access Private (Directors/Parents)
 */
router.patch('/:id', updateChildProfileValidation, updateChildProfile);

/**
 * @route DELETE /api/child-profiles/:id
 * @desc Delete a child profile
 * @access Private (Directors/Parents)
 */
router.delete('/:id', deleteChildProfile);

/**
 * @route PUT /api/child-profiles/bulk-update
 * @desc Bulk update multiple child profiles
 * @access Private (Directors/Parents)
 */
router.put('/bulk-update', bulkUpdateChildProfiles);

export default router;
