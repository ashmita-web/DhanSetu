import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import db from '../database/store';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const recs = db.getRecommendations(req.userId!);
  res.json({ recommendations: recs });
});

router.post('/:id/interact', authMiddleware, (req: AuthRequest, res: Response) => {
  const { type } = req.body;
  db.updateRecommendation(req.userId!, req.params.id, {
    interacted: true,
    interactionType: type || 'clicked',
  });

  db.trackSignal({
    userId: req.userId!,
    signalType: 'recommendation_interaction',
    category: type,
    value: req.params.id,
  });

  res.json({ success: true });
});

router.get('/explain/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const recs = db.getRecommendations(req.userId!);
  const rec = recs.find(r => r.id === req.params.id);

  if (!rec) {
    res.status(404).json({ error: 'Recommendation not found' });
    return;
  }

  const profile = db.getProfile(req.userId!);

  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Explain in 2-3 sentences why "${rec.title}" is recommended for someone with these goals: ${profile?.financialGoals?.join(', ') || 'general financial growth'}. Be specific and helpful. Start with "This is recommended because..."`
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : rec.reason;
    res.json({ explanation: text });
  } catch {
    res.json({ explanation: rec.reason });
  }
});

export default router;
