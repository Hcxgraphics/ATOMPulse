import { Router, Request, Response } from 'express';
import { prisma } from '../../shared/prisma';
import { verifyToken } from '../auth/auth.middleware';

const router = Router();

router.get('/achievement-report', verifyToken, async (req: Request, res: Response) => {
  const format = String(req.query.format || 'csv');
  const quarter = String(req.query.quarter || 'Q2');
  const sheets = await prisma.goalSheet.findMany({
    where: req.query.managerId === 'me' ? { managerId: req.user!.userId } : {},
    include: { employee: { include: { department: true } }, goals: { include: { checkins: { where: { quarter: quarter as any } } } } }
  });
  const rows = ['Employee,Department,Goal,Weightage,Progress'];
  for (const sheet of sheets) {
    for (const goal of sheet.goals) {
      rows.push([sheet.employee.name, sheet.employee.department.name, goal.title, goal.weightage, goal.checkins[0]?.progressScore ?? 0].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    }
  }
  const body = rows.join('\n');
  res.setHeader('Content-Type', format === 'xlsx' ? 'text/csv' : 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="atompulse-achievement-report.${format}"`);
  res.send(body);
});

export const exportRoutes = router;
