import { Router } from 'express';
import { login, me } from './auth.controller';
import { verifyToken } from './auth.middleware';

const router = Router();

router.post('/login', login);
router.get('/me', verifyToken, me);

export const authRoutes = router;
