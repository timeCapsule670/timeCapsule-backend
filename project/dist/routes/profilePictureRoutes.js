"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const profilePictureController_1 = require("../controllers/profilePictureController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Only allow images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    },
});
// GET /api/avatars - Get all available avatar options
router.get('/', profilePictureController_1.getAllAvatars);
// POST /api/upload/profile-picture - Handle file upload for profile pictures
router.post('/upload/profile-picture', auth_1.authenticate, upload.single('image'), profilePictureController_1.uploadProfilePicture);
// POST /api/director/profile-picture - Save the director's profile picture
router.post('/director/profile-picture', auth_1.authenticate, profilePictureController_1.saveProfilePictureValidation, profilePictureController_1.saveProfilePicture);
exports.default = router;
