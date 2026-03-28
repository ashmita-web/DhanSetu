import { ReactNode, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { useAppStore } from '../../store/useAppStore.js';
import { connectSocket, onWorkflowUpdate, onNewMessage } from '../../services/socket.js';
import type { WorkflowUpdate } from '../../types/index.js';

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function Layout() {
  const {
    token, sessionId, addActiveAgent, completeAgent, setWorkflowStage,
    addCompletedStage, setWorkflowComplete, setRecommendations, setGoals,
    setProfile, addMessage,
  } = useAppStore();

  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token);

    const removeWorkflowListener = onWorkflowUpdate((update: WorkflowUpdate) => {
      if (update.stage && update.status === 'running' && update.agentName) {
        addActiveAgent({ name: update.agentName, status: 'running' });
      }

      if (update.status === 'complete') {
        if (update.agentName) completeAgent(update.agentName);
        if (update.stage && update.stage !== 'completed') {
          addCompletedStage(update.stage as any);
        }
      }

      if (update.stage === 'completed' && update.data) {
        setWorkflowComplete(true);
        const data = update.data as any;
        if (data.recommendations) setRecommendations(data.recommendations);
        if (data.goals) setGoals(data.goals);
        if (data.profile) setProfile(data.profile);
      }
    });

    const removeMessageListener = onNewMessage((message: string) => {
      addMessage({
        id: genId(),
        role: 'assistant',
        content: message,
        timestamp: new Date().toISOString(),
        agentName: 'DhanSetu',
      });
    });

    return () => {
      removeWorkflowListener();
      removeMessageListener();
    };
  }, [token]);

  return (
    <div className="flex h-screen bg-et-navy overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
