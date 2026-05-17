import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../shared/prisma';
import { verifyToken } from '../auth/auth.middleware';
import { ForbiddenError } from '../../shared/errors';

const router = Router();

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !['ADMIN_HR', 'SUPER_ADMIN'].includes(req.user.role)) {
    throw new ForbiddenError('Requires admin access');
  }
  next();
};

router.get('/', verifyToken, requireAdmin, async (req: Request, res: Response) => {
  const logs = await prisma.auditLog.findMany({
    orderBy: { changedAt: 'desc' },
    take: 100,
    include: {
      changedBy: {
        select: { id: true, name: true, email: true, role: { select: { roleName: true } } }
      },
      goalSheet: {
        select: {
          id: true,
          status: true,
          cycle: { select: { id: true, name: true } },
          employee: { select: { id: true, name: true } }
        }
      },
      goal: {
        select: {
          id: true,
          title: true,
          goalSheet: {
            select: {
              employee: { select: { id: true, name: true } },
              cycle: { select: { id: true, name: true } }
            }
          }
        }
      }
    }
  });

  res.json(logs.map((log) => ({
    id: log.id,
    entityType: log.entityType,
    entityId: log.entityId,
    fieldName: log.fieldName,
    oldValue: log.oldValue,
    newValue: log.newValue,
    changedAt: log.changedAt,
    actor: {
      id: log.changedBy.id,
      name: log.changedBy.name,
      email: log.changedBy.email,
      role: log.changedBy.role.roleName
    },
    target: log.goal?.title
      || log.goalSheet?.employee.name
      || log.entityId,
    cycle: log.goal?.goalSheet.cycle.name || log.goalSheet?.cycle.name || null
  })));
});

export const auditRoutes = router;
