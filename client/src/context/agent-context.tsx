import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAgents, getServerStats } from '../lib/api';
import type { Agent, ServerStats } from '../types';
import { useWebSocket } from '../hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';

interface AgentContextType {
  agents: Agent[];
  stats: ServerStats | null;
  isLoading: boolean;
  isError: boolean;
  isStatsLoading: boolean;
  isStatsError: boolean;
  refreshAgents: () => void;
  refreshStats: () => void;
  captureScreenshot: (agentId: number) => Promise<void>;
}

const defaultStats: ServerStats = {
  totalAgents: 0,
  onlineAgents: 0,
  offlineAgents: 0,
  commandsRun: 0,
  screenshotsCount: 0
};

const AgentContext = createContext<AgentContextType>({
  agents: [],
  stats: defaultStats,
  isLoading: false,
  isError: false,
  isStatsLoading: false,
  isStatsError: false,
  refreshAgents: () => {},
  refreshStats: () => {},
  captureScreenshot: async () => {}
});

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch agents
  const { 
    data: agents = [] as Agent[], 
    isLoading, 
    isError, 
    refetch: refreshAgents 
  } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch server stats
  const {
    data: stats = defaultStats,
    isLoading: isStatsLoading,
    isError: isStatsError,
    refetch: refreshStats
  } = useQuery<ServerStats>({
    queryKey: ['/api/stats'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // WebSocket for real-time updates
  const { readyState, connect } = useWebSocket('/ws', {
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different types of WebSocket messages
        switch (data.type) {
          case 'agent_update':
            // Invalidate the agents query to refetch
            queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
            queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
            break;
            
          case 'screenshot_taken':
            toast({
              title: 'Screenshot Captured',
              description: `Screenshot taken from ${data.hostname || 'agent'}`,
              variant: 'default',
            });
            // Invalidate screenshots query
            queryClient.invalidateQueries({ queryKey: ['/api/screenshots'] });
            break;
            
          case 'command_result':
            toast({
              title: 'Command Completed',
              description: `Command execution finished on ${data.hostname || 'agent'}`,
              variant: 'default',
            });
            // Invalidate commands query
            queryClient.invalidateQueries({ queryKey: ['/api/commands'] });
            break;
            
          default:
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  });

  // Show toast notifications for WebSocket connection status only once
  // and reconnect automatically without showing constant notifications
  useEffect(() => {
    let hasShownConnectedToast = false;
    let disconnectCount = 0;
    const maxDisconnectNotifications = 1;
    
    if (readyState === WebSocket.OPEN) {
      if (!hasShownConnectedToast) {
        // Only show connected toast once
        hasShownConnectedToast = true;
        toast({
          title: 'Connected to Server',
          description: 'Real-time updates are now active',
          variant: 'default',
        });
      }
      // Reset disconnect counter when connected
      disconnectCount = 0;
    } else if (readyState === WebSocket.CLOSED) {
      // Only show disconnection toast a limited number of times to avoid spam
      if (disconnectCount < maxDisconnectNotifications) {
        disconnectCount++;
        console.log('WebSocket disconnected, attempting to reconnect...');
      }
      
      // Try to reconnect automatically without showing toast every time
      const reconnectTimer = setTimeout(() => {
        connect();
      }, 1000);
      
      return () => clearTimeout(reconnectTimer);
    }
  }, [readyState, toast, connect]);

  // Function to capture a screenshot from an agent
  const captureScreenshot = async (agentId: number) => {
    try {
      await fetch(`/api/agents/${agentId}/screenshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      toast({
        title: 'Screenshot Requested',
        description: 'The agent will capture a screenshot shortly',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Screenshot Failed',
        description: 'Failed to request screenshot from agent',
        variant: 'destructive',
      });
    }
  };

  return (
    <AgentContext.Provider
      value={{
        agents: agents as Agent[],
        stats: stats as ServerStats,
        isLoading,
        isError,
        isStatsLoading,
        isStatsError,
        refreshAgents,
        refreshStats,
        captureScreenshot
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgents() {
  return useContext(AgentContext);
}
