import { Router, Request, Response } from 'express';
import { prisma } from '../../shared/prisma';
import { verifyToken, requirePermission } from '../auth/auth.middleware';
import { ValidationError, ForbiddenError, NotFoundError } from '../../shared/errors';

const router = Router();

async function currentCycleId() {
  const cycle = await prisma.goalCycle.findFirst({
    where: { status: { in: ['OPEN', 'CHECKIN_OPEN', 'UPCOMING'] } },
    orderBy: [{ status: 'asc' }, { startDate: 'desc' }]
  });
  return cycle?.id;
}

function canSeeSheet(req: Request, sheet: { employeeId: string; managerId: string | null }) {
  return (
    sheet.employeeId === req.user!.userId ||
    sheet.managerId === req.user!.userId ||
    ['ADMIN_HR', 'SUPER_ADMIN'].includes(req.user!.role)
  );
}

const sheetInclude = {
  employee: { select: { id: true, name: true, email: true, employeeCode: true, avatarUrl: true, department: { select: { name: true } } } },
  manager: { select: { id: true, name: true, email: true } },
  cycle: { include: { checkins: true } },
  goals: { include: { thrustArea: true, uomType: true, checkins: true }, orderBy: { createdAt: 'asc' as const } }
};

router.get('/search', verifyToken, async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json([]);

  const goals = await prisma.goal.findMany({
    where: {
      title: { contains: q, mode: 'insensitive' },
      goalSheet: ['ADMIN_HR', 'SUPER_ADMIN'].includes(req.user!.role)
        ? undefined
        : req.user!.role === 'MANAGER_L1'
          ? { managerId: req.user!.userId }
          : { employeeId: req.user!.userId }
    },
    take: 10,
    include: { goalSheet: { include: { employee: true } } }
  });

  res.json(goals.map((goal) => ({
    goalId: goal.id,
    goalTitle: goal.title,
    employeeName: goal.goalSheet.employee.name,
    status: goal.status,
    href: goal.goalSheet.employeeId === req.user!.userId ? '/goals' : '/team'
  })));
});

router.get('/', verifyToken, async (req: Request, res: Response) => {
  const { employeeId, managerId, cycleId, status } = req.query;
  const resolvedCycleId = cycleId === 'current' || !cycleId ? await currentCycleId() : String(cycleId);

  const where: any = {};
  if (resolvedCycleId) where.cycleId = resolvedCycleId;
  if (status) where.status = status;
  if (employeeId === 'me') where.employeeId = req.user!.userId;
  else if (employeeId) where.employeeId = String(employeeId);
  if (managerId === 'me') where.managerId = req.user!.userId;
  else if (managerId) where.managerId = String(managerId);

  if (!employeeId && !managerId && !['ADMIN_HR', 'SUPER_ADMIN'].includes(req.user!.role)) {
    where.employeeId = req.user!.userId;
  }

  const sheets = await prisma.goalSheet.findMany({
    where,
    include: sheetInclude,
    orderBy: { updatedAt: 'desc' }
  });

  if (employeeId === 'me' && !managerId) return res.json(sheets[0] || null);
  res.json(sheets);
});

router.post('/', verifyToken, requirePermission('CREATE_GOAL'), async (req: Request, res: Response) => {
  const cycleId = req.body.cycleId || await currentCycleId();
  if (!cycleId) throw new ValidationError('No active cycle found');

  const existing = await prisma.goalSheet.findFirst({
    where: { employeeId: req.user!.userId, cycleId }
  });
  if (existing) throw new ValidationError('Goal sheet already exists for this cycle');

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  const sheet = await prisma.goalSheet.create({
    data: { employeeId: req.user!.userId, managerId: user?.managerId, cycleId },
    include: sheetInclude
  });
  res.json(sheet);
});

router.get('/:id', verifyToken, async (req: Request, res: Response) => {
  const sheet = await prisma.goalSheet.findUnique({ where: { id: req.params.id }, include: sheetInclude });
  if (!sheet) throw new NotFoundError('Goal sheet not found');
  if (!canSeeSheet(req, sheet)) throw new ForbiddenError('Not allowed to view this goal sheet');
  res.json(sheet);
});

router.patch('/:id/submit', verifyToken, requirePermission('SUBMIT_GOAL'), async (req: Request, res: Response) => {
  const sheet = await prisma.goalSheet.findUnique({ where: { id: req.params.id }, include: { goals: true } });
  if (!sheet) throw new NotFoundError('Goal sheet not found');
  if (sheet.employeeId !== req.user!.userId) throw new ForbiddenError('Not your goal sheet');
  if (!['DRAFT', 'RETURNED'].includes(sheet.status)) throw new ValidationError('Only draft or returned sheets can be submitted');

  const totalWeightage = sheet.goals.reduce((sum, g) => sum + g.weightage, 0);
  if (Math.abs(totalWeightage - 100) > 0.001) throw new ValidationError('Total weightage must equal 100%');
  if (sheet.goals.length === 0) throw new ValidationError('Must have at least one goal');

  const updated = await prisma.goalSheet.update({
    where: { id: req.params.id },
    data: { status: 'SUBMITTED', submittedAt: new Date(), returnReason: null },
    include: sheetInclude
  });
  res.json(updated);
});

router.patch('/:id/approve', verifyToken, requirePermission('APPROVE_GOAL'), async (req: Request, res: Response) => {
  const sheet = await prisma.goalSheet.findUnique({ where: { id: req.params.id }, include: { goals: true } });
  if (!sheet) throw new NotFoundError('Goal sheet not found');
  if (sheet.managerId !== req.user!.userId && !['ADMIN_HR', 'SUPER_ADMIN'].includes(req.user!.role)) throw new ForbiddenError('Not allowed to approve');
  const totalWeightage = sheet.goals.reduce((sum, g) => sum + g.weightage, 0);
  if (Math.abs(totalWeightage - 100) > 0.001) throw new ValidationError('Total weightage must equal 100%');

  await prisma.goal.updateMany({ where: { goalSheetId: sheet.id }, data: { status: 'LOCKED' } });
  const updated = await prisma.goalSheet.update({
    where: { id: sheet.id },
    data: { status: 'APPROVED', approvedAt: new Date(), lockedAt: new Date() },
    include: sheetInclude
  });
  res.json(updated);
});

router.patch('/:id/return', verifyToken, requirePermission('RETURN_GOAL'), async (req: Request, res: Response) => {
  const sheet = await prisma.goalSheet.findUnique({ where: { id: req.params.id } });
  if (!sheet) throw new NotFoundError('Goal sheet not found');
  if (sheet.managerId !== req.user!.userId && !['ADMIN_HR', 'SUPER_ADMIN'].includes(req.user!.role)) throw new ForbiddenError('Not allowed to return');
  if (!req.body.returnReason) throw new ValidationError('Return reason is required');

  const updated = await prisma.goalSheet.update({
    where: { id: sheet.id },
    data: { status: 'RETURNED', returnedAt: new Date(), returnReason: req.body.returnReason },
    include: sheetInclude
  });
  res.json(updated);
});

router.post('/:id/goals', verifyToken, requirePermission('CREATE_GOAL'), async (req: Request, res: Response) => {
  const { title, description, thrustAreaId, uomTypeId, targetValue, weightage } = req.body;
  const sheet = await prisma.goalSheet.findUnique({ where: { id: req.params.id }, include: { goals: true } });
  if (!sheet) throw new NotFoundError('Goal sheet not found');
  if (sheet.employeeId !== req.user!.userId && !['ADMIN_HR', 'SUPER_ADMIN'].includes(req.user!.role)) throw new ForbiddenError('Not your goal sheet');
  if (!['DRAFT', 'RETURNED'].includes(sheet.status)) throw new ValidationError('Can only add goals in Draft or Returned status');
  if (sheet.goals.length >= 8) throw new ValidationError('Maximum 8 goals allowed');
  if (!title || !thrustAreaId || !uomTypeId) throw new ValidationError('Missing required goal fields');
  if (Number(weightage) < 10) throw new ValidationError('Minimum weightage per goal is 10%');
  const total = sheet.goals.reduce((sum, goal) => sum + goal.weightage, 0) + Number(weightage);
  if (total > 100) throw new ValidationError('Total weightage cannot exceed 100%');

  const goal = await prisma.goal.create({
    data: {
      goalSheetId: sheet.id,
      title,
      description,
      thrustAreaId,
      uomTypeId,
      targetValue: Number(targetValue),
      weightage: Number(weightage),
      createdBy: req.user!.userId,
      status: 'DRAFT'
    },
    include: { thrustArea: true, uomType: true, checkins: true }
  });
  res.json(goal);
});

router.patch('/:sheetId/goals/:goalId', verifyToken, async (req: Request, res: Response) => {
  const goal = await prisma.goal.findUnique({ where: { id: req.params.goalId }, include: { goalSheet: { include: { goals: true } } } });
  if (!goal) throw new NotFoundError('Goal not found');
  if (!canSeeSheet(req, goal.goalSheet)) throw new ForbiddenError('Not allowed to edit this goal');
  if (!['DRAFT', 'RETURNED', 'SUBMITTED'].includes(goal.goalSheet.status) && !['ADMIN_HR', 'SUPER_ADMIN'].includes(req.user!.role)) {
    throw new ValidationError('Goal is locked');
  }

  const nextWeight = req.body.weightage !== undefined ? Number(req.body.weightage) : goal.weightage;
  if (nextWeight < 10) throw new ValidationError('Minimum weightage per goal is 10%');
  const total = goal.goalSheet.goals.filter((item) => item.id !== goal.id).reduce((sum, item) => sum + item.weightage, 0) + nextWeight;
  if (total > 100) throw new ValidationError('Total weightage cannot exceed 100%');

  const data: any = {};
  for (const key of ['title', 'description', 'thrustAreaId', 'uomTypeId']) if (req.body[key] !== undefined) data[key] = req.body[key];
  for (const key of ['targetValue', 'weightage']) if (req.body[key] !== undefined) data[key] = Number(req.body[key]);

  const updated = await prisma.goal.update({
    where: { id: goal.id },
    data,
    include: { thrustArea: true, uomType: true, checkins: true }
  });
  res.json(updated);
});

router.delete('/:sheetId/goals/:goalId', verifyToken, async (req: Request, res: Response) => {
  const goal = await prisma.goal.findUnique({ where: { id: req.params.goalId }, include: { goalSheet: true } });
  if (!goal) throw new NotFoundError('Goal not found');
  if (goal.goalSheet.employeeId !== req.user!.userId && !['ADMIN_HR', 'SUPER_ADMIN'].includes(req.user!.role)) throw new ForbiddenError('Not your goal');
  if (!['DRAFT', 'RETURNED'].includes(goal.goalSheet.status)) throw new ValidationError('Goal is locked');

  await prisma.goal.delete({ where: { id: goal.id } });
  res.json({ ok: true });
});

router.post('/shared', verifyToken, requirePermission('PUSH_SHARED_GOAL'), async (req: Request, res: Response) => {
  const { thrustAreaId, title, description, uomTypeId, targetValue, recipientIds } = req.body;
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) throw new ValidationError('Select at least one recipient');
  let created = 0;
  let failed = 0;
  const goalIds: string[] = [];

  for (const userId of recipientIds) {
    const cycleId = await currentCycleId();
    if (!cycleId) { failed++; continue; }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { failed++; continue; }
    const sheet = await prisma.goalSheet.upsert({
      where: { id: (await prisma.goalSheet.findFirst({ where: { employeeId: userId, cycleId } }))?.id || '__missing__' },
      update: {},
      create: { employeeId: userId, managerId: user.managerId, cycleId }
    }).catch(async () => prisma.goalSheet.create({ data: { employeeId: userId, managerId: user.managerId, cycleId } }));
    const count = await prisma.goal.count({ where: { goalSheetId: sheet.id } });
    if (count >= 8) { failed++; continue; }
    const goal = await prisma.goal.create({
      data: { goalSheetId: sheet.id, thrustAreaId, title, description, uomTypeId, targetValue: Number(targetValue), weightage: 10, isShared: true, createdBy: req.user!.userId }
    });
    created++;
    goalIds.push(goal.id);
  }
  res.json({ created, failed, goalIds });
});

export const goalsRoutes = router;
