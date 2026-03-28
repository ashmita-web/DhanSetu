import { Router, Request, Response } from 'express';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';
import db from '../database/store';
import { initWorkflowState } from '../workflow/engine';

const router = Router();

// Register / Login (combined for hackathon simplicity)
router.post('/login', (req: Request, res: Response) => {
  const { email, name } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  let user = db.getUserByEmail(email);

  if (!user) {
    user = db.createUser({
      email,
      name: name || email.split('@')[0],
      onboardingComplete: false,
    });
  } else {
    db.updateUser(user.id, { name: name || user.name });
  }

  // Get or create session
  let session = db.getLatestUserSession(user.id);
  if (!session || session.status === 'completed') {
    session = db.createSession(user.id);
    initWorkflowState(session.id, user.id);
  }

  const token = generateToken(user.id);

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, onboardingComplete: user.onboardingComplete },
    sessionId: session.id,
  });
});

router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = db.getUserById(req.userId!);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const profile = db.getProfile(user.id);
  const session = db.getLatestUserSession(user.id);

  res.json({ user, profile, sessionId: session?.id });
});

export default router;
