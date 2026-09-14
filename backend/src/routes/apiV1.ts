import { Router } from 'express';
import { ClientController } from '../controllers/clientController.js';
import { DocumentController } from '../controllers/documentController.js';
import { AlertController } from '../controllers/alertController.js';
import { ReminderController } from '../controllers/reminderController.js';
import { ComplianceController } from '../controllers/complianceController.js';
import { DashboardController } from '../controllers/dashboardController.js';
import { InboxController } from '../controllers/inboxController.js';
import { AuditLogController } from '../controllers/auditLogController.js';
import { SettingsController } from '../controllers/settingsController.js';
import { CopilotController } from '../controllers/copilotController.js';
import webhookRoutes from './webhooks.js';
import { firmScopingMiddleware } from '../middleware/auth.js';

const router = Router();

// Apply firm scoping on all v1 endpoints
router.use(firmScopingMiddleware);

// 1. Clients
router.get('/clients', ClientController.getAll);
router.get('/clients/:id', ClientController.getById);

// 2. Documents & Review Workspace
router.get('/documents', DocumentController.getAll);
router.get('/documents/:id', DocumentController.getById);
router.post('/documents/:id/review', DocumentController.review);

// 3. Alerts
router.get('/alerts', AlertController.getAll);
router.patch('/alerts/:id', AlertController.update);

// 4. Reminders & CA Approval State Machine
router.get('/reminders', ReminderController.getAll);
router.get('/reminders/:id', ReminderController.getById);
router.post('/reminders', ReminderController.create);
router.patch('/reminders/:id', ReminderController.update);
router.post('/reminders/:id/approve', ReminderController.approve);
router.post('/reminders/:id/send', ReminderController.send);
router.post('/reminders/:id/cancel', ReminderController.cancel);

// 5. Compliance Matrix & Summary
router.get('/compliance', ComplianceController.getCompliance);

// 6. Dashboard Aggregation
router.get('/dashboard', DashboardController.getDashboard);

// 7. AI Intake Inbox
router.get('/inbox', InboxController.getInbox);

// 8. Append-Only Audit Log
router.get('/audit-log', AuditLogController.getAll);

// 9. Settings
router.get('/settings', SettingsController.getAll);
router.patch('/settings/:key', SettingsController.update);

// 10. AI Copilot Chat Endpoint
router.post('/copilot/chat', CopilotController.chat);

// 11. Webhooks (also mounted under /api/v1/webhooks)
router.use('/webhooks', webhookRoutes);

export default router;

