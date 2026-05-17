import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../shared/prisma';
import { verifyToken } from '../auth/auth.middleware';
import { ForbiddenError, NotFoundError } from '../../shared/errors';

const router = Router();

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !['ADMIN_HR', 'SUPER_ADMIN'].includes(req.user.role)) {
    throw new ForbiddenError('Requires admin access');
  }
  next();
};

router.get('/', verifyToken, requireAdmin, async (req: Request, res: Response) => {
  const { status } = req.query;

  const escalations = await prisma.escalation.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: [{ status: 'asc' }, { escalationLevel: 'desc' }, { triggeredAt: 'desc' }],
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          department: { select: { name: true } },
          manager: { select: { id: true, name: true } }
        }
      },
      goalSheet: {
        select: {
          id: true,
          status: true,
          submittedAt: true,
          cycle: { select: { id: true, name: true, endDate: true } },
          manager: { select: { id: true, name: true } }
        }
      }
    }
  });

  res.json(escalations.map((item) => ({
    id: item.id,
    reason: item.reason,
    status: item.status,
    escalationLevel: item.escalationLevel,
    triggeredAt: item.triggeredAt,
    resolvedAt: item.resolvedAt,
    notes: item.notes,
    employee: {
      id: item.user.id,
      name: item.user.name,
      email: item.user.email,
      department: item.user.department.name
    },
    owner: item.goalSheet?.manager?.name || item.user.manager?.name || 'HR Ops',
    cycle: item.goalSheet?.cycle.name || null,
    goalSheetStatus: item.goalSheet?.status || null
  })));
});

router.patch('/:id/escalate', verifyToken, requireAdmin, async (req: Request, res: Response) => {
  const current = await prisma.escalation.findUnique({ where: { id: req.params.id } });
  if (!current) throw new NotFoundError('Escalation not found');

  const updated = await prisma.escalation.update({
    where: { id: req.params.id },
    data: {
      escalationLevel: current.escalationLevel + 1,
      notes: req.body?.notes || current.notes
    }
  });

  res.json(updated);
});

router.patch('/:id/resolve', verifyToken, requireAdmin, async (req: Request, res: Response) => {
  const current = await prisma.escalation.findUnique({ where: { id: req.params.id } });
  if (!current) throw new NotFoundError('Escalation not found');

  const updated = await prisma.escalation.update({
    where: { id: req.params.id },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date(),
      notes: req.body?.notes || current.notes
    }
  });

  res.json(updated);
});

router.patch('/:id/dismiss', verifyToken, requireAdmin, async (req: Request, res: Response) => {
  const current = await prisma.escalation.findUnique({ where: { id: req.params.id } });
  if (!current) throw new NotFoundError('Escalation not found');

  const updated = await prisma.escalation.update({
    where: { id: req.params.id },
    data: {
      status: 'DISMISSED',
      resolvedAt: new Date(),
      notes: req.body?.notes || current.notes
    }
  });

  res.json(updated);
});

export const escalationsRoutes = router;
