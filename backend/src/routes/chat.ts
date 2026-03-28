import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import db from '../database/store';
import { processUserMessage, initWorkflowState } from '../workflow/engine';
import { Server as SocketServer } from 'socket.io';

export function createChatRouter(io: SocketServer) {
  const router = Router();

  router.post('/message', authMiddleware, async (req: AuthRequest, res: Response) => {
    const { message, sessionId } = req.body;
    const userId = req.userId!;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    let activeSessionId = sessionId;

    // Resolve session — handle stale IDs from localStorage after server restart
    if (!activeSessionId || !db.getSession(activeSessionId)) {
      // Try to find an existing live session for this user first
      const existingSession = db.getLatestUserSession(userId);
      if (existingSession) {
        activeSessionId = existingSession.id;
      } else {
        const newSession = db.createSession(userId);
        activeSessionId = newSession.id;
        initWorkflowState(activeSessionId, userId);
      }
    }

    // Track behavioral signal
    db.trackSignal({ userId, signalType: 'page_view', category: 'chat', value: 'message_sent' });

    try {
      const result = await processUserMessage(activeSessionId, userId, message, io);

      res.json({
        response: result.response,
        stage: result.stage,
        agentName: result.agentName,
        sessionId: activeSessionId,
        data: result.data,
      });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: 'Failed to process message', response: 'I apologize for the interruption. Please try again.' });
    }
  });

  router.get('/history/:sessionId', authMiddleware, (req: AuthRequest, res: Response) => {
    const session = db.getSession(req.params.sessionId);

    if (!session || session.userId !== req.userId) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({ messages: session.messages, stage: session.workflowStage });
  });

  router.get('/session', authMiddleware, (req: AuthRequest, res: Response) => {
    const session = db.getLatestUserSession(req.userId!);

    if (!session) {
      const newSession = db.createSession(req.userId!);
      initWorkflowState(newSession.id, req.userId!);
      res.json({ session: newSession });
      return;
    }

    res.json({ session });
  });

  return router;
}
