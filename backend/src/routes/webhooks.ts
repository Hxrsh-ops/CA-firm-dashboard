import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController.js';
import { webhookAuthMiddleware, firmScopingMiddleware } from '../middleware/auth.js';

const router = Router();

// Inbound webhook routes authenticated via x-webhook-secret
router.use(webhookAuthMiddleware);
router.use(firmScopingMiddleware);

router.post('/document-intake', WebhookController.handleDocumentIntake);
router.post('/reminder-send', WebhookController.handleReminderSend);

export default router;
