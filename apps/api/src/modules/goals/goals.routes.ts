import { Router, Request, Response } from 'express';
import { prisma } from '../../shared/prisma';
import { verifyToken, requirePermission } from '../auth/auth.middleware';
import { ValidationError, ForbiddenError, NotFoundError } from '../../shared/errors';

const router = Router();

// Get goal sheets for user
router.get('/goal-sheets', verifyToken, async (req: Request, res: Response) => {
  const sheets = await prisma.goalSheet.findMany({
    where: { employeeId: req.user!.userId },
    include: { cycle: true, goals: true }
  });
  res.json(sheets);
});

// Create new sheet
router.post('/goal-sheets', verifyToken, requirePermission('CREATE_GOAL'), async (req: Request, res: Response) => {
  const { cycleId } = req.body;
  const existing = await prisma.goalSheet.findFirst({
    where: { employeeId: req.user!.userId, cycleId }
  });
  
  if (existing) throw new ValidationError('Goal sheet already exists for this cycle');
  
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  
  const sheet = await prisma.goalSheet.create({
    data: {
      employeeId: req.user!.userId,
      managerId: user?.managerId,
      cycleId
    }
  });
  res.json(sheet);
});

// Submit sheet
router.patch('/goal-sheets/:id/submit', verifyToken, requirePermission('SUBMIT_GOAL'), async (req: Request, res: Response) => {
  const sheet = await prisma.goalSheet.findUnique({
    where: { id: req.params.id },
    include: { goals: true }
  });
  if (!sheet) throw new NotFoundError('Goal sheet not found');
  if (sheet.employeeId !== req.user!.userId) throw new ForbiddenError('Not your goal sheet');
  
  const totalWeightage = sheet.goals.reduce((sum: number, g: any) => sum + g.weightage, 0);
  if (Math.abs(totalWeightage - 100) > 0.001) throw new ValidationError('Total weightage must equal 100%');
  if (sheet.goals.length === 0) throw new ValidationError('Must have at least one goal');
  
  const updated = await prisma.goalSheet.update({
    where: { id: req.params.id },
    data: { status: 'SUBMITTED', submittedAt: new Date() }
  });
  res.json(updated);
});

// Add goal to sheet
router.post('/goal-sheets/:id/goals', verifyToken, requirePermission('CREATE_GOAL'), async (req: Request, res: Response) => {
  const { title, description, thrustAreaId, uomTypeId, targetValue, weightage } = req.body;
  const sheetId = req.params.id;
  
  const sheet = await prisma.goalSheet.findUnique({ where: { id: sheetId }, include: { goals: true } });
  if (!sheet) throw new NotFoundError('Goal sheet not found');
  if (sheet.status !== 'DRAFT' && sheet.status !== 'RETURNED') throw new ValidationError('Can only add goals in Draft or Returned status');
  if (sheet.goals.length >= 8) throw new ValidationError('Maximum 8 goals allowed');
  if (weightage < 10) throw new ValidationError('Minimum weightage per goal is 10%');
  
  const goal = await prisma.goal.create({
    data: {
      goalSheetId: sheetId,
      title,
      description,
      thrustAreaId,
      uomTypeId,
      targetValue,
      weightage,
      createdBy: req.user!.userId,
      status: 'DRAFT'
    }
  });
  res.json(goal);
});

export const goalsRoutes = router;
