"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const childProfileController_1 = require("../controllers/childProfileController");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_1.authenticate);
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
router.post('/', childProfileController_1.createChildProfilesValidation, childProfileController_1.createChildProfiles);
/**
 * @route GET /api/child-profiles
 * @desc Get all child profiles for the authenticated user
 * @access Private (Directors/Parents)
 */
router.get('/', childProfileController_1.getChildProfiles);
/**
 * @route GET /api/child-profiles/:id
 * @desc Get a specific child profile by ID
 * @access Private (Directors/Parents)
 */
router.get('/:id', childProfileController_1.getChildProfile);
/**
 * @route PUT /api/child-profiles/:id
 * @desc Update a child profile
 * @access Private (Directors/Parents)
 */
router.put('/:id', childProfileController_1.updateChildProfileValidation, childProfileController_1.updateChildProfile);
/**
 * @route PATCH /api/child-profiles/:id
 * @desc Partially update a child profile
 * @access Private (Directors/Parents)
 */
router.patch('/:id', childProfileController_1.updateChildProfileValidation, childProfileController_1.updateChildProfile);
/**
 * @route DELETE /api/child-profiles/:id
 * @desc Delete a child profile
 * @access Private (Directors/Parents)
 */
router.delete('/:id', childProfileController_1.deleteChildProfile);
/**
 * @route PUT /api/child-profiles/bulk-update
 * @desc Bulk update multiple child profiles
 * @access Private (Directors/Parents)
 */
router.put('/bulk-update', childProfileController_1.bulkUpdateChildProfiles);
exports.default = router;
