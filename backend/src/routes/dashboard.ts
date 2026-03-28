import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import db from '../database/store';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.get('/overview', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const profile = db.getProfile(userId);
  const recommendations = db.getRecommendations(userId);
  const goals = db.getGoals(userId);
  const signals = db.getUserSignals(userId, 10);
  const agentLogs = db.getAgentLogs(db.getLatestUserSession(userId)?.id || '');
  const user = db.getUserById(userId);

  res.json({
    user,
    profile,
    stats: {
      recommendationsCount: recommendations.length,
      goalsCount: goals.length,
      completedGoals: goals.filter(g => g.status === 'achieved').length,
      recentSignals: signals.length,
      agentDecisions: agentLogs.length,
    },
    topRecommendations: recommendations.slice(0, 6),
    activeGoals: goals.filter(g => g.status !== 'achieved').slice(0, 3),
    recentActivity: signals.slice(0, 5),
  });
});

router.get('/agent-log', authMiddleware, (req: AuthRequest, res: Response) => {
  const session = db.getLatestUserSession(req.userId!);
  if (!session) {
    res.json({ logs: [] });
    return;
  }
  const logs = db.getAgentLogs(session.id);
  res.json({ logs });
});

router.get('/briefing', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const profile = db.getProfile(userId);
  const goals = db.getGoals(userId);
  const recommendations = db.getRecommendations(userId);

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1000,
      system: 'You are DhanSetu\'s Weekly Briefing Generator. Create a personalized, concise weekly financial briefing.',
      messages: [{
        role: 'user',
        content: `Generate a personalized weekly briefing for:
Persona: ${profile?.persona || 'Financial Explorer'}
Goals: ${goals.map(g => g.title).join(', ')}
Top Recommendations: ${recommendations.slice(0, 3).map(r => r.title).join(', ')}
Date: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Generate as JSON:
{
  "greeting": "Personalized greeting",
  "marketSnapshot": "2-line market insight",
  "personalTip": "One actionable financial tip for their goals",
  "topStories": [{"headline": "...", "category": "..."}],
  "goalNudge": "Encouragement about their progress",
  "weeklyChallenge": "One small financial action they can take this week"
}

Respond ONLY with the JSON.`
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const briefing = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    res.json({ briefing, generatedAt: new Date().toISOString() });
  } catch {
    res.json({
      briefing: {
        greeting: `Welcome back! Your financial journey continues.`,
        marketSnapshot: 'Markets are showing mixed signals today. Diversification remains key.',
        personalTip: 'Review your SIP investments and ensure they align with your long-term goals.',
        topStories: [
          { headline: 'Sensex rallies on positive global cues', category: 'Markets' },
          { headline: 'RBI keeps repo rate unchanged', category: 'Economy' },
        ],
        goalNudge: 'You\'re making great progress on your financial journey!',
        weeklyChallenge: 'Review one financial goal and update your progress.',
      },
      generatedAt: new Date().toISOString(),
    });
  }
});

export default router;
