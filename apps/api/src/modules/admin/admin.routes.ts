import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../../shared/prisma';
import { verifyToken } from '../auth/auth.middleware';
import { ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors';

const router = Router();

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !['ADMIN_HR', 'SUPER_ADMIN'].includes(req.user.role)) throw new ForbiddenError('Requires admin access');
  next();
};

router.get('/cycles', verifyToken, async (req: Request, res: Response) => {
  const where = req.query.status ? { status: req.query.status as any } : undefined;
  const cycles = await prisma.goalCycle.findMany({
    where,
    include: { checkins: true, goalSheets: true },
    orderBy: { startDate: 'desc' }
  });
  res.json(cycles);
});

router.post('/cycles', verifyToken, requireAdmin, async (req: Request, res: Response) => {
  const { name, year, startDate, endDate } = req.body;
  if (!name || !year || !startDate || !endDate) throw new ValidationError('Missing required cycle fields');
  const cycle = await prisma.goalCycle.create({
    data: { name, year: Number(year), startDate: new Date(startDate), endDate: new Date(endDate), status: 'UPCOMING' },
    include: { checkins: true, goalSheets: true }
  });
  res.json(cycle);
});

router.patch('/cycles/:id', verifyToken, requireAdmin, async (req: Request, res: Response) => {
  const data: any = {};
  for (const key of ['name', 'status']) if (req.body[key] !== undefined) data[key] = req.body[key];
  if (req.body.year !== undefined) data.year = Number(req.body.year);
  if (req.body.startDate !== undefined) data.startDate = new Date(req.body.startDate);
  if (req.body.endDate !== undefined) data.endDate = new Date(req.body.endDate);

  if (data.status === 'OPEN') {
    await prisma.goalCycle.updateMany({ where: { id: { not: req.params.id }, status: 'OPEN' }, data: { status: 'CLOSED' } });
  }

  const cycle = await prisma.goalCycle.update({ where: { id: req.params.id }, data, include: { checkins: true, goalSheets: true } });
  res.json(cycle);
});

router.patch('/cycles/:id/checkin-windows', verifyToken, requireAdmin, async (req: Request, res: Response) => {
  const { quarter, opensAt, closesAt, isActive } = req.body;
  if (isActive) {
    await prisma.checkinWindow.updateMany({ where: { cycleId: req.params.id }, data: { isActive: false } });
    await prisma.goalCycle.update({ where: { id: req.params.id }, data: { status: 'CHECKIN_OPEN' } });
  }
  const existing = await prisma.checkinWindow.findFirst({ where: { cycleId: req.params.id, quarter } });
  const data = { opensAt: new Date(opensAt), closesAt: new Date(closesAt), isActive: Boolean(isActive) };
  const window = existing
    ? await prisma.checkinWindow.update({ where: { id: existing.id }, data })
    : await prisma.checkinWindow.create({ data: { cycleId: req.params.id, quarter, ...data } });
  res.json(window);
});

router.get('/users/search', verifyToken, async (req: Request, res: Response) => {
  if (req.user!.role === 'EMPLOYEE') return res.json([]);
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json([]);
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { employeeCode: { contains: q, mode: 'insensitive' } }
      ]
    },
    take: 10,
    include: { department: true, role: true }
  });
  res.json(users.map((user) => ({ id: user.id, name: user.name, employeeCode: user.employeeCode, department: user.department.name, role: user.role.roleName, href: '/admin/users' })));
});

router.get('/users', verifyToken, async (req: Request, res: Response) => {
  if (!['MANAGER_L1', 'ADMIN_HR', 'SUPER_ADMIN'].includes(req.user!.role)) throw new ForbiddenError('Requires team access');
  const where: any = {};
  if (req.query.role) where.role = { roleName: req.query.role };
  if (req.query.status) where.status = req.query.status;
  if (req.query.managerId === 'me') where.managerId = req.user!.userId;
  const users = await prisma.user.findMany({
    where,
    include: { department: true, role: true, manager: { select: { id: true, name: true } }, goalSheets: { include: { goals: true } } },
    orderBy: { name: 'asc' }
  });
  res.json(users.map((user) => ({ ...user, goalCount: user.goalSheets[0]?.goals.length || 0 })));
});

router.post('/users', verifyToken, requireAdmin, async (req: Request, res: Response) => {
  const { name, email, employeeCode, departmentId, roleId, managerId, password } = req.body;
  if (!name || !email || !employeeCode || !departmentId || !roleId || !password) throw new ValidationError('Missing required user fields');
  const user = await prisma.user.create({
    data: { name, email, employeeCode, departmentId, roleId, managerId: managerId || null, passwordHash: await bcrypt.hash(password, 10) },
    include: { department: true, role: true, manager: { select: { id: true, name: true } } }
  });
  res.json(user);
});

router.patch('/users/:id', verifyToken, requireAdmin, async (req: Request, res: Response) => {
  const data: any = {};
  for (const key of ['name', 'email', 'employeeCode', 'departmentId', 'roleId', 'status']) if (req.body[key] !== undefined) data[key] = req.body[key];
  if (req.body.managerId !== undefined) data.managerId = req.body.managerId || null;
  if (req.body.password) data.passwordHash = await bcrypt.hash(req.body.password, 10);
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data,
    include: { department: true, role: true, manager: { select: { id: true, name: true } } }
  });
  res.json(user);
});

router.get('/departments', verifyToken, requireAdmin, async (_req: Request, res: Response) => {
  res.json(await prisma.department.findMany({ orderBy: { name: 'asc' } }));
});

router.get('/roles', verifyToken, requireAdmin, async (_req: Request, res: Response) => {
  res.json(await prisma.role.findMany({ orderBy: { roleName: 'asc' } }));
});

export const adminRoutes = router;
