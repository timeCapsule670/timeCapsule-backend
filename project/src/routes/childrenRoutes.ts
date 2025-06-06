import express from 'express';
import * as childrenController from '../controllers/childrenController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Child routes
router.post(
  '/',
  childrenController.createChildValidation,
  childrenController.createChild
);

router.get('/', childrenController.getChildren);
router.get('/:id', childrenController.getChild);

router.put(
  '/:id',
  childrenController.updateChildValidation,
  childrenController.updateChild
);

router.delete('/:id', childrenController.deleteChild);

export default router;