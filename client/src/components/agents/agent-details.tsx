import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAgent, getActivities } from '@/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronLeft,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { useLocation } from 'wouter';
import type { Agent as AgentType, Activity } from '@/types';

interface AgentDetailsProps {
  id: number;
}

export function AgentDetails({ id }: AgentDetailsProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    data: agent,
    isLoading: isAgentLoading,
    isError: isAgentError,
    refetch: refetchAgent
  } = useQuery({ 
    queryKey: [`/api/agents/${id}`],
    queryFn: () => getAgent(id)
  });

  const {
    data: activities = [],
    isLoading: isActivitiesLoading,
  } = useQuery({ 
    queryKey: [`/api/activities`],
    queryFn: () => getActivities(10)
  });

  // Filter activities for this agent
  const agentActivities = activities.filter(
    (activity: Activity) => activity.agentId === id
  );

  const handleDelete = async () => {
    try {
      await fetch(`/api/agents/${id}`, { method: 'DELETE' });
      
      toast({
        title: "Agent Deleted",
        description: "Agent has been deleted successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      navigate('/agents');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete agent",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  if (isAgentLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (isAgentError || !agent) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Error loading agent details
          </div>
          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={() => navigate('/agents')}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Agents
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="p-4 border-b border-neutral-200 dark:border-gray-700 flex flex-row justify-between items-center">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/agents')}
              className="mr-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-lg">
              Agent Details: {agent.hostname || 'Unknown Host'}
            </CardTitle>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => refetchAgent()}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button
              onClick={() => setDeleteDialogOpen(true)}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">System Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <div className="w-32 text-neutral-500 dark:text-neutral-400">Hostname:</div>
                  <div>{agent.hostname || 'Unknown'}</div>
                </div>
                <div className="flex">
                  <div className="w-32 text-neutral-500 dark:text-neutral-400">IP Address:</div>
                  <div>{agent.ip || 'Unknown'}</div>
                </div>
                <div className="flex">
                  <div className="w-32 text-neutral-500 dark:text-neutral-400">OS:</div>
                  <div>
                    {agent.platform} {agent.platformRelease && `${agent.platformRelease}`}
                    {agent.platformVersion && ` (${agent.platformVersion})`}
                  </div>
                </div>
                <div className="flex">
                  <div className="w-32 text-neutral-500 dark:text-neutral-400">Architecture:</div>
                  <div>{agent.architecture || 'Unknown'}</div>
                </div>
                <div className="flex">
                  <div className="w-32 text-neutral-500 dark:text-neutral-400">Username:</div>
                  <div>{agent.username || 'Unknown'}</div>
                </div>
                <div className="flex">
                  <div className="w-32 text-neutral-500 dark:text-neutral-400">Screen:</div>
                  <div>{agent.screenResolution || 'Unknown'}</div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Connection Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <div className="w-32 text-neutral-500 dark:text-neutral-400">Status:</div>
                  <div className={agent.isOnline ? "text-green-700 dark:text-green-500 flex items-center" : "text-neutral-500 flex items-center"}>
                    <span className={`w-2 h-2 ${agent.isOnline ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-600'} rounded-full mr-2`}></span>
                    {agent.isOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
                <div className="flex">
                  <div className="w-32 text-neutral-500 dark:text-neutral-400">First Seen:</div>
                  <div>{format(new Date(agent.firstSeen), 'yyyy-MM-dd HH:mm:ss')}</div>
                </div>
                <div className="flex">
                  <div className="w-32 text-neutral-500 dark:text-neutral-400">Last Seen:</div>
                  <div>{format(new Date(agent.lastSeen), 'yyyy-MM-dd HH:mm:ss')}</div>
                </div>
                <div className="flex">
                  <div className="w-32 text-neutral-500 dark:text-neutral-400">Last Activity:</div>
                  <div>{formatDistanceToNow(new Date(agent.lastSeen), { addSuffix: true })}</div>
                </div>
                <div className="flex">
                  <div className="w-32 text-neutral-500 dark:text-neutral-400">Client ID:</div>
                  <div className="font-mono text-xs">{agent.clientId}</div>
                </div>
              </div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div>
            <h3 className="font-medium mb-2">Recent Activity</h3>
            <div className="bg-neutral-50 dark:bg-gray-700 rounded border border-neutral-200 dark:border-gray-600 p-3 h-44 overflow-y-auto text-sm">
              {isActivitiesLoading ? (
                <div className="flex justify-center p-4">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                </div>
              ) : agentActivities.length === 0 ? (
                <div className="text-center p-4 text-neutral-500">
                  No recent activity for this agent
                </div>
              ) : (
                agentActivities.map((activity: Activity) => (
                  <div key={activity.id} className="pb-2 mb-2 border-b border-neutral-200 dark:border-gray-600 last:border-0 last:pb-0 last:mb-0">
                    <div className="text-xs text-neutral-400 dark:text-neutral-500">
                      {format(new Date(activity.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </div>
                    <div>{activity.activityType.replace(/-/g, ' ')}</div>
                    {activity.details && activity.details.command && (
                      <div className="mt-1 p-1 bg-neutral-100 dark:bg-gray-800 rounded font-mono text-xs">
                        {activity.details.command}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this agent and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
