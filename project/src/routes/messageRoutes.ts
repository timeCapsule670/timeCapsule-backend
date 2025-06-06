import express from 'express';
import * as messageController from '../controllers/messageController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Message routes
router.post(
  '/',
  messageController.createMessageValidation,
  messageController.createMessage
);

router.get('/', messageController.getMessages);
router.get('/child/:childId', messageController.getMessagesByChild);
router.get('/:id', messageController.getMessage);

router.put(
  '/:id',
  messageController.updateMessageValidation,
  messageController.updateMessage
);

router.delete('/:id', messageController.deleteMessage);

export default router;