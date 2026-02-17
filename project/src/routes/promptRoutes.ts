import { Router } from 'express';
import {
  generatePrompt,
  generatePromptValidation
} from '../controllers/promptController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/generate', generatePromptValidation, generatePrompt);

export default router;
