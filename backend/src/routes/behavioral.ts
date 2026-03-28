import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import db from '../database/store';

const router = Router();

router.post('/signal', authMiddleware, (req: AuthRequest, res: Response) => {
  const { signalType, category, value, metadata } = req.body;
  const signal = db.trackSignal({
    userId: req.userId!,
    signalType,
    category,
    value,
    metadata,
  });
  res.json({ signal });
});

router.get('/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  const profile = db.getProfile(req.userId!);
  const user = db.getUserById(req.userId!);
  const session = db.getLatestUserSession(req.userId!);
  const logs = session ? db.getAgentLogs(session.id) : [];

  res.json({
    profile,
    user,
    agentLogs: logs,
    stats: {
      totalDecisions: logs.length,
      successRate: logs.length > 0
        ? Math.round((logs.filter(l => l.success).length / logs.length) * 100)
        : 0,
      agentsRun: [...new Set(logs.map(l => l.agentName))],
    },
  });
});

router.patch('/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  const { demographics, financialGoals, interests, riskAppetite, investmentHorizon } = req.body;
  const updated = db.updateProfile(req.userId!, {
    demographics,
    financialGoals,
    interests,
    riskAppetite,
    investmentHorizon,
  });
  res.json({ profile: updated });
});

export default router;
