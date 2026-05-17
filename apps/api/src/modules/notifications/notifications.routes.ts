import { Router, Request, Response } from 'express';
import { prisma } from '../../shared/prisma';
import { verifyToken } from '../auth/auth.middleware';

const router = Router();

router.get('/', verifyToken, async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit || 20), 100);
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
  res.json(notifications);
});

router.patch('/read-all', verifyToken, async (req: Request, res: Response) => {
  await prisma.notification.updateMany({ where: { userId: req.user!.userId, read: false }, data: { read: true } });
  res.json({ ok: true });
});

router.patch('/:id/read', verifyToken, async (req: Request, res: Response) => {
  const notification = await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
  res.json(notification);
});

export const notificationsRoutes = router;
