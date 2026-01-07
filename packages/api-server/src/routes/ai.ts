import { Router } from 'express';
import {
  getFixSuggestions,
  dismissFixSuggestion,
  applyFixSuggestion,
  getAIStatus,
} from '../controllers/ai.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/fix-suggestions/:deploymentId', getFixSuggestions);
router.patch('/fix-suggestions/:id/dismiss', dismissFixSuggestion);
router.patch('/fix-suggestions/:id/apply', applyFixSuggestion);

router.get('/deployment/:deploymentId/status', getAIStatus);

export { router as aiRouter };
