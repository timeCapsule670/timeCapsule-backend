"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const inviteCodeController_1 = require("../controllers/inviteCodeController");
const router = express_1.default.Router();
// Apply authentication middleware to all routes
router.use(auth_1.authenticate);
// Generate new invite code (requires director profile)
router.post('/generate', inviteCodeController_1.generateInviteCode);
// Validate invite code (public - no auth required for validation)
router.post('/validate', inviteCodeController_1.validateInviteCodeValidation, inviteCodeController_1.validateInviteCode);
// Use invite code (public - no auth required for usage)
router.post('/use', inviteCodeController_1.useInviteCodeValidation, inviteCodeController_1.useInviteCode);
// Get all invite codes for a director
router.get('/my-codes', inviteCodeController_1.getInviteCodesByDirector);
// Revoke an unused invite code
router.delete('/:codeId', inviteCodeController_1.revokeInviteCode);
exports.default = router;
