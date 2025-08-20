import { Router } from 'express';
import multer from 'multer';
import { getAllAvatars, saveProfilePicture, saveProfilePictureValidation, uploadProfilePicture } from '../controllers/profilePictureController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// GET /api/avatars - Get all available avatar options
router.get('/', getAllAvatars);

// POST /api/upload/profile-picture - Handle file upload for profile pictures
router.post('/upload/profile-picture', authenticate, upload.single('image'), uploadProfilePicture);

// POST /api/director/profile-picture - Save the director's profile picture
router.post('/director/profile-picture', authenticate, saveProfilePictureValidation, saveProfilePicture);

export default router;
