import express from 'express';
import 'express-async-errors';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

import { authRoutes } from './modules/auth/auth.routes';
import { goalsRoutes } from './modules/goals/goals.routes';
import { checkinsRoutes } from './modules/checkins/checkins.routes';
import { analyticsRoutes } from './modules/analytics/analytics.routes';
import { auditRoutes } from './modules/audit/audit.routes';
import { escalationsRoutes } from './modules/escalations/escalations.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { metadataRoutes } from './modules/metadata/metadata.routes';
import { notificationsRoutes } from './modules/notifications/notifications.routes';
import { exportRoutes } from './modules/export/export.routes';

app.use('/api/auth', authRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/goal-sheets', goalsRoutes);
app.use('/api/checkins', checkinsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/escalations', escalationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', metadataRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/export', exportRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error', message: err.message || 'Internal Server Error' });
});

export { app };
