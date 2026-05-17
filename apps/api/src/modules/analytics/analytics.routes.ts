import { Router, Request, Response } from 'express';
import { prisma } from '../../shared/prisma';
import { verifyToken, requirePermission } from '../auth/auth.middleware';

const router = Router();

// Get Org Completion Rates
router.get('/completion-rates', verifyToken, requirePermission('VIEW_ANALYTICS'), async (req: Request, res: Response) => {
  const { cycleId, quarter } = req.query;
  
  const checkins = await prisma.checkin.findMany({
    where: { 
      quarter: quarter as any,
      goal: {
        goalSheet: {
          cycleId: cycleId as string,
          status: 'LOCKED'
        }
      }
    },
    include: {
      goal: { include: { goalSheet: { include: { employee: true } } } }
    }
  });

  // Calculate average completion rate
  const totalScore = checkins.reduce((sum, c) => sum + (c.progressScore || 0), 0);
  const averageRate = checkins.length ? (totalScore / checkins.length).toFixed(1) : 0;
  
  res.json({
    totalCheckins: checkins.length,
    averageRate: Number(averageRate),
    onTrack: checkins.filter(c => c.status === 'ON_TRACK').length,
    completed: checkins.filter(c => c.status === 'COMPLETED').length,
    notStarted: checkins.filter(c => c.status === 'NOT_STARTED').length
  });
});

// Get Goal Distribution by Thrust Area
router.get('/goal-distribution', verifyToken, requirePermission('VIEW_ANALYTICS'), async (req: Request, res: Response) => {
  const { cycleId } = req.query;

  const goals = await prisma.goal.findMany({
    where: {
      goalSheet: { cycleId: cycleId as string },
      status: { in: ['APPROVED', 'LOCKED'] }
    },
    include: { thrustArea: true, uomType: true }
  });

  const thrustDistribution = goals.reduce((acc: any, goal) => {
    const area = goal.thrustArea.name;
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {});

  const uomDistribution = goals.reduce((acc: any, goal) => {
    const uom = goal.uomType.name;
    acc[uom] = (acc[uom] || 0) + 1;
    return acc;
  }, {});

  res.json({
    thrustDistribution,
    uomDistribution
  });
});

export const analyticsRoutes = router;
