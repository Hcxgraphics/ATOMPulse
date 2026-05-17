import { Router, Request, Response } from 'express';
import { prisma } from '../../shared/prisma';
import { verifyToken, requirePermission } from '../auth/auth.middleware';

const router = Router();

router.get('/completion-rates', verifyToken, requirePermission('VIEW_ANALYTICS'), async (req: Request, res: Response) => {
  const { cycleId, quarter } = req.query;
  const sheets = await prisma.goalSheet.findMany({
    where: cycleId ? { cycleId: String(cycleId) } : undefined,
    include: {
      employee: { include: { department: true } },
      goals: { include: { checkins: { where: quarter ? { quarter: quarter as any } : undefined } } }
    }
  });

  const totalEmployees = new Set(sheets.map((sheet) => sheet.employeeId)).size;
  const submitted = sheets.filter((sheet) => ['SUBMITTED', 'APPROVED', 'LOCKED'].includes(sheet.status)).length;
  const approved = sheets.filter((sheet) => ['APPROVED', 'LOCKED'].includes(sheet.status)).length;
  const allScores = sheets.flatMap((sheet) => sheet.goals.flatMap((goal) => goal.checkins.map((checkin) => checkin.progressScore || 0)));
  const avgProgressScore = allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;

  const departments = new Map<string, any>();
  for (const sheet of sheets) {
    const id = sheet.employee.departmentId;
    const existing = departments.get(id) || { departmentId: id, departmentName: sheet.employee.department.name, totalEmployees: 0, submitted: 0, approved: 0, scores: [] as number[] };
    existing.totalEmployees += 1;
    if (['SUBMITTED', 'APPROVED', 'LOCKED'].includes(sheet.status)) existing.submitted += 1;
    if (['APPROVED', 'LOCKED'].includes(sheet.status)) existing.approved += 1;
    existing.scores.push(...sheet.goals.flatMap((goal) => goal.checkins.map((checkin) => checkin.progressScore || 0)));
    departments.set(id, existing);
  }

  res.json({
    totalEmployees,
    submitted,
    approved,
    avgProgressScore,
    byDepartment: Array.from(departments.values()).map((dept) => ({
      departmentId: dept.departmentId,
      departmentName: dept.departmentName,
      totalEmployees: dept.totalEmployees,
      submitted: dept.submitted,
      approved: dept.approved,
      avgScore: dept.scores.length ? dept.scores.reduce((a: number, b: number) => a + b, 0) / dept.scores.length : 0
    }))
  });
});

router.get('/goal-distribution', verifyToken, requirePermission('VIEW_ANALYTICS'), async (req: Request, res: Response) => {
  const { cycleId } = req.query;
  const goals = await prisma.goal.findMany({
    where: cycleId ? { goalSheet: { cycleId: String(cycleId) } } : undefined,
    include: { thrustArea: true, uomType: true, checkins: true }
  });

  const thrust = new Map<string, number>();
  const uoms = new Map<string, any>();
  for (const goal of goals) {
    thrust.set(goal.thrustArea.name, (thrust.get(goal.thrustArea.name) || 0) + 1);
    const bucket = uoms.get(goal.uomType.name) || { uomTypeName: goal.uomType.name, notStarted: 0, onTrack: 0, completed: 0 };
    const status = goal.checkins[0]?.status || 'NOT_STARTED';
    if (status === 'COMPLETED') bucket.completed += 1;
    else if (status === 'ON_TRACK') bucket.onTrack += 1;
    else bucket.notStarted += 1;
    uoms.set(goal.uomType.name, bucket);
  }

  res.json({
    byThrustArea: Array.from(thrust.entries()).map(([thrustAreaName, count]) => ({ thrustAreaName, count })),
    byUomType: Array.from(uoms.values())
  });
});

router.get('/qoq-trends', verifyToken, requirePermission('VIEW_ANALYTICS'), async (req: Request, res: Response) => {
  const { cycleId } = req.query;
  const departments = await prisma.department.findMany({
    include: {
      users: {
        include: {
          goalSheets: {
            where: cycleId ? { cycleId: String(cycleId) } : undefined,
            include: { goals: { include: { checkins: true } } }
          }
        }
      }
    }
  });

  const avg = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  res.json({
    trends: departments.map((department) => {
      const checkins = department.users.flatMap((user) => user.goalSheets.flatMap((sheet) => sheet.goals.flatMap((goal) => goal.checkins)));
      return {
        departmentName: department.name,
        q1Score: avg(checkins.filter((c) => c.quarter === 'Q1').map((c) => c.progressScore || 0)),
        q2Score: avg(checkins.filter((c) => c.quarter === 'Q2').map((c) => c.progressScore || 0)),
        q3Score: avg(checkins.filter((c) => c.quarter === 'Q3').map((c) => c.progressScore || 0)),
        q4Score: avg(checkins.filter((c) => c.quarter === 'Q4_ANNUAL').map((c) => c.progressScore || 0))
      };
    })
  });
});

router.get('/manager-effectiveness', verifyToken, requirePermission('VIEW_ANALYTICS'), async (req: Request, res: Response) => {
  const managers = await prisma.user.findMany({
    where: { directReports: { some: {} } },
    include: { managedGoalSheets: { include: { goals: { include: { checkins: true } } } } }
  });
  res.json({
    managers: managers.map((manager) => {
      const sheets = manager.managedGoalSheets;
      const submitted = sheets.filter((sheet) => ['SUBMITTED', 'APPROVED', 'LOCKED'].includes(sheet.status)).length;
      const approvalDays = sheets
        .filter((sheet) => sheet.submittedAt && sheet.approvedAt)
        .map((sheet) => (sheet.approvedAt!.getTime() - sheet.submittedAt!.getTime()) / 86400000);
      return {
        managerId: manager.id,
        managerName: manager.name,
        completionRate: sheets.length ? (submitted / sheets.length) * 100 : 0,
        avgApprovalDays: approvalDays.length ? approvalDays.reduce((a, b) => a + b, 0) / approvalDays.length : 0
      };
    })
  });
});

export const analyticsRoutes = router;
