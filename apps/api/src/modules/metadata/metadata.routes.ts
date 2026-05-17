import { Router } from 'express';
import { prisma } from '../../shared/prisma';
import { verifyToken } from '../auth/auth.middleware';

const router = Router();

router.get('/thrust-areas', verifyToken, async (_req, res) => {
  res.json(await prisma.thrustArea.findMany({ orderBy: { name: 'asc' } }));
});

router.get('/uom-types', verifyToken, async (_req, res) => {
  res.json(await prisma.uomType.findMany({ orderBy: { name: 'asc' } }));
});

export const metadataRoutes = router;
