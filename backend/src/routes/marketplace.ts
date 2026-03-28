import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import db from '../database/store';

const router = Router();

router.get('/services', authMiddleware, (req: AuthRequest, res: Response) => {
  const state = db.getWorkflowState(db.getLatestUserSession(req.userId!)?.id || '');
  const services = (state?.extractedData?.services as unknown[]) || [];
  res.json({ services });
});

router.get('/goals', authMiddleware, (req: AuthRequest, res: Response) => {
  const goals = db.getGoals(req.userId!);
  res.json({ goals });
});

router.patch('/goals/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const { status, progress } = req.body;
  db.updateGoal(req.userId!, req.params.id, { status, progress });
  res.json({ success: true });
});

export default router;
