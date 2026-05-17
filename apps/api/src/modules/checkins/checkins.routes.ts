import { Router, Request, Response } from 'express';
import { prisma } from '../../shared/prisma';
import { verifyToken, requirePermission } from '../auth/auth.middleware';
import { ValidationError, NotFoundError } from '../../shared/errors';

const router = Router();

// Log Check-in
router.post('/', verifyToken, requirePermission('LOG_CHECKIN'), async (req: Request, res: Response) => {
  const { goalId, quarter, plannedValue, actualValue } = req.body;
  
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { goalSheet: true, uomType: true }
  });
  
  if (!goal) throw new NotFoundError('Goal not found');
  if (goal.goalSheet.employeeId !== req.user!.userId) throw new ValidationError('Cannot check-in to someone else’s goal');
  
  // Validate active window
  const activeWindow = await prisma.checkinWindow.findFirst({
    where: { cycleId: goal.goalSheet.cycleId, quarter, isActive: true }
  });
  if (!activeWindow) throw new ValidationError(`Check-in window for ${quarter} is not active`);
  
  // Compute progress score based on UOM type
  let progressScore = 0;
  const target = goal.targetValue;
  const formula = goal.uomType.formulaType;
  
  if (formula === 'MIN') {
    progressScore = Math.min((actualValue / target) * 100, 100);
  } else if (formula === 'MAX') {
    progressScore = Math.min((target / actualValue) * 100, 100);
  } else if (formula === 'ZERO') {
    progressScore = actualValue === 0 ? 100 : 0;
  }
  // TIMELINE omitted for brevity
  
  const checkin = await prisma.checkin.create({
    data: {
      goalId,
      quarter,
      plannedValue,
      actualValue,
      progressScore,
      status: progressScore >= 100 ? 'COMPLETED' : 'ON_TRACK',
      submittedAt: new Date()
    }
  });
  
  res.json(checkin);
});

// Manager Feedback
router.post('/:id/feedback', verifyToken, async (req: Request, res: Response) => {
  const { feedback } = req.body;
  
  const checkin = await prisma.checkin.findUnique({ where: { id: req.params.id }, include: { goal: { include: { goalSheet: true } } } });
  if (!checkin) throw new NotFoundError('Check-in not found');
  
  if (checkin.goal.goalSheet.managerId !== req.user!.userId) {
    throw new ValidationError('You are not the manager for this goal sheet');
  }
  
  const managerFeedback = await prisma.managerFeedback.create({
    data: {
      checkinId: checkin.id,
      managerId: req.user!.userId,
      feedback
    }
  });
  
  res.json(managerFeedback);
});

export const checkinsRoutes = router;
