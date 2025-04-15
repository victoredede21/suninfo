import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAgents } from '@/lib/api';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Info, 
  Camera, 
  Terminal 
} from "lucide-react";
import { useAgents } from '@/context/agent-context';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import type { Agent } from '@/types';

export function OnlineAgents() {
  const { captureScreenshot } = useAgents();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const { 
    data: allAgents = [], 
    isLoading, 
    isError 
  } = useQuery({ queryKey: ['/api/agents'] });

  // Filter for online agents only
  const onlineAgents = allAgents.filter((agent: Agent) => agent.isOnline);

  const handleScreenshot = async (id: number) => {
    try {
      await captureScreenshot(id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to capture screenshot",
        variant: "destructive",
      });
    }
  };

  const handleExecuteCommand = (id: number) => {
    navigate(`/commands?agentId=${id}`);
  };

  const handleViewDetails = (id: number) => {
    navigate(`/agents/${id}`);
  };

  return (
    <Card>
      <CardHeader className="p-4 border-b border-neutral-200 dark:border-gray-700">
        <CardTitle className="text-lg">Online Agents</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-pulse">Loading agents...</div>
          </div>
        ) : isError ? (
          <div className="text-center p-4 text-red-500">
            Error loading agents
          </div>
        ) : onlineAgents.length === 0 ? (
          <div className="text-center p-4 text-neutral-500">
            No agents online
          </div>
        ) : (
          <div className="space-y-4">
            {onlineAgents.slice(0, 5).map((agent: Agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-gray-700 last:border-0 last:pb-0"
              >
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <div>
                    <div className="font-medium">{agent.hostname || 'Unknown'}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {agent.ip || 'No IP address'}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewDetails(agent.id)}
                    title="View Details"
                  >
                    <Info className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleScreenshot(agent.id)}
                    title="Take Screenshot"
                  >
                    <Camera className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleExecuteCommand(agent.id)}
                    title="Execute Command"
                  >
                    <Terminal className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                  </Button>
                </div>
              </div>
            ))}

            {onlineAgents.length > 5 && (
              <div className="text-center pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/agents')}
                >
                  View All Agents
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
