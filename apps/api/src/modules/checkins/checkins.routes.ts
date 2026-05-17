import { Router, Request, Response } from 'express';
import { prisma } from '../../shared/prisma';
import { verifyToken, requirePermission } from '../auth/auth.middleware';
import { ValidationError, NotFoundError, ForbiddenError } from '../../shared/errors';

const router = Router();

function score(formula: string, target: number, actualValue: number | null | undefined) {
  if (actualValue === null || actualValue === undefined) return 0;
  if (formula === 'MIN') return Math.min((actualValue / target) * 100, 100);
  if (formula === 'MAX') return actualValue > 0 ? Math.min((target / actualValue) * 100, 100) : 0;
  if (formula === 'ZERO') return actualValue === 0 ? 100 : 0;
  return actualValue ? 100 : 0;
}

router.get('/', verifyToken, async (req: Request, res: Response) => {
  const { goalSheetId, quarter, managerId } = req.query;
  const where: any = {};
  if (quarter) where.quarter = quarter;
  if (goalSheetId) where.goal = { goalSheetId: String(goalSheetId) };
  if (managerId === 'me') {
    where.goal = { ...(where.goal || {}), goalSheet: { managerId: req.user!.userId } };
  }

  const rows = await prisma.checkin.findMany({
    where,
    include: {
      feedback: { include: { manager: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
      goal: {
        include: {
          uomType: true,
          goalSheet: { include: { employee: { include: { department: true } }, manager: true } }
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  res.json(rows);
});

router.post('/', verifyToken, requirePermission('LOG_CHECKIN'), async (req: Request, res: Response) => {
  const { goalId, quarter, plannedValue, actualValue, status } = req.body;
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { goalSheet: true, uomType: true }
  });
  if (!goal) throw new NotFoundError('Goal not found');
  if (goal.goalSheet.employeeId !== req.user!.userId) throw new ValidationError('Cannot check in to someone else’s goal');

  const activeWindow = await prisma.checkinWindow.findFirst({
    where: { cycleId: goal.goalSheet.cycleId, quarter, isActive: true }
  });
  if (!activeWindow) throw new ValidationError(`Check-in window for ${quarter} is not active`);

  const existing = await prisma.checkin.findFirst({ where: { goalId, quarter } });
  const progressScore = score(goal.uomType.formulaType, goal.targetValue, actualValue);
  const data = {
    plannedValue: Number(plannedValue || 0),
    actualValue: actualValue === null || actualValue === undefined || actualValue === '' ? null : Number(actualValue),
    progressScore,
    status: status || (progressScore >= 100 ? 'COMPLETED' : 'ON_TRACK')
  };

  const checkin = existing
    ? await prisma.checkin.update({ where: { id: existing.id }, data })
    : await prisma.checkin.create({ data: { goalId, quarter, ...data } });
  res.json(checkin);
});

router.patch('/submit-quarter', verifyToken, async (req: Request, res: Response) => {
  const { goalSheetId, quarter } = req.body;
  const sheet = await prisma.goalSheet.findUnique({ where: { id: goalSheetId }, include: { goals: true } });
  if (!sheet) throw new NotFoundError('Goal sheet not found');
  if (sheet.employeeId !== req.user!.userId) throw new ForbiddenError('Not your goal sheet');

  await prisma.checkin.updateMany({
    where: { quarter, goal: { goalSheetId } },
    data: { submittedAt: new Date() }
  });
  res.json({ ok: true, submittedAt: new Date().toISOString() });
});

router.patch('/:id', verifyToken, async (req: Request, res: Response) => {
  const current = await prisma.checkin.findUnique({
    where: { id: req.params.id },
    include: { goal: { include: { goalSheet: true, uomType: true } } }
  });
  if (!current) throw new NotFoundError('Check-in not found');
  if (current.goal.goalSheet.employeeId !== req.user!.userId && current.goal.goalSheet.managerId !== req.user!.userId) {
    throw new ForbiddenError('Not allowed to edit this check-in');
  }

  const data: any = {};
  if (req.body.plannedValue !== undefined) data.plannedValue = Number(req.body.plannedValue);
  if (req.body.actualValue !== undefined) data.actualValue = req.body.actualValue === null || req.body.actualValue === '' ? null : Number(req.body.actualValue);
  if (req.body.status !== undefined) data.status = req.body.status;
  if (data.actualValue !== undefined) data.progressScore = score(current.goal.uomType.formulaType, current.goal.targetValue, data.actualValue);

  const updated = await prisma.checkin.update({ where: { id: current.id }, data });
  res.json(updated);
});

router.post('/:id/feedback', verifyToken, async (req: Request, res: Response) => {
  const { feedback } = req.body;
  if (!feedback) throw new ValidationError('Feedback is required');
  const checkin = await prisma.checkin.findUnique({ where: { id: req.params.id }, include: { goal: { include: { goalSheet: true } } } });
  if (!checkin) throw new NotFoundError('Check-in not found');
  if (checkin.goal.goalSheet.managerId !== req.user!.userId && !['ADMIN_HR', 'SUPER_ADMIN'].includes(req.user!.role)) {
    throw new ValidationError('You are not the manager for this goal sheet');
  }
  const managerFeedback = await prisma.managerFeedback.create({
    data: { checkinId: checkin.id, managerId: req.user!.userId, feedback },
    include: { manager: { select: { id: true, name: true } } }
  });
  res.json(managerFeedback);
});

export const checkinsRoutes = router;
