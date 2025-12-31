import { Router } from 'express';
import {
  getFixSuggestions,
  dismissFixSuggestion,
  applyFixSuggestion,
  getAIStatus,
} from '../controllers/ai.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All AI routes require authentication
router.use(authMiddleware);

// Fix Suggestions
router.get('/fix-suggestions/:deploymentId', getFixSuggestions);
router.patch('/fix-suggestions/:id/dismiss', dismissFixSuggestion);
router.patch('/fix-suggestions/:id/apply', applyFixSuggestion);

// AI Status
router.get('/deployment/:deploymentId/status', getAIStatus);

export { router as aiRouter };
