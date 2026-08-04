'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';

function getSocketBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4005/api';
  return apiUrl.replace(/\/+$/, '').replace(/\/api$/, '');
}

export function useNotificationSocket(): Socket | null {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return undefined;

    const socket = io(`${getSocketBaseUrl()}/notifications`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    const handleNew = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };
    const handleUnread = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    };

    socket.on('notification:new', handleNew);
    socket.on('notification:unread', handleUnread);

    return () => {
      socket.off('notification:new', handleNew);
      socket.off('notification:unread', handleUnread);
      socket.disconnect();
    };
  }, [isAuthenticated, queryClient]);

  return null;
}
