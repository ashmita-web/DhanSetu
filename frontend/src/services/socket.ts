import { io, Socket } from 'socket.io-client';
import type { WorkflowUpdate } from '../types/index.js';

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io('http://localhost:3001', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
    socket?.emit('ping_workflow');
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected');
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}

export function onWorkflowUpdate(callback: (data: WorkflowUpdate) => void): () => void {
  if (!socket) return () => {};
  socket.on('workflow_update', callback);
  return () => socket?.off('workflow_update', callback);
}

export function onNewMessage(callback: (message: string) => void): () => void {
  if (!socket) return () => {};
  const handler = (data: WorkflowUpdate) => {
    if (data.type === 'new_message' && data.message) {
      callback(data.message);
    }
  };
  socket.on('workflow_update', handler);
  return () => socket?.off('workflow_update', handler);
}
