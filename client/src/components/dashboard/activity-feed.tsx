import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getActivities } from '@/lib/api';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Laptop,
  Camera,
  Terminal,
  WifiOff,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';
import type { Activity } from '@/types';

export function ActivityFeed() {
  const { 
    data: activities = [], 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['/api/activities'],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  const getActivityIcon = (activity: Activity) => {
    switch (activity.activityType) {
      case 'connect':
      case 'new-agent':
        return <Laptop className="text-green-500" />;
      case 'screenshot':
        return <Camera className="text-primary-700 dark:text-primary-500" />;
      case 'command':
      case 'command-result':
        return <Terminal className="text-primary-700 dark:text-primary-500" />;
      case 'disconnect':
        return <WifiOff className="text-red-500" />;
      default:
        return <Laptop className="text-primary-700 dark:text-primary-500" />;
    }
  };

  const getActivityTitle = (activity: Activity) => {
    switch (activity.activityType) {
      case 'connect':
        return 'Agent connected';
      case 'new-agent':
        return 'New agent registered';
      case 'screenshot':
        return 'Screenshot captured';
      case 'command':
        return 'Command executed';
      case 'command-result':
        return 'Command completed';
      case 'disconnect':
        return 'Agent disconnected';
      case 'check-in':
        return 'Agent checked in';
      default:
        return activity.activityType;
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 border-b border-neutral-200 dark:border-gray-700 flex flex-row justify-between items-center">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="sr-only">Refresh</span>
        </Button>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <RefreshCw className="h-6 w-6 animate-spin text-primary-700 dark:text-primary-500" />
          </div>
        ) : isError ? (
          <div className="text-center p-4 text-red-500">
            Error loading activities
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center p-4 text-neutral-500">
            No recent activity
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity: Activity) => (
              <div
                key={activity.id}
                className="flex pb-4 border-b border-neutral-200 dark:border-gray-700 last:border-0 last:pb-0"
              >
                <div className="mr-3">
                  {getActivityIcon(activity)}
                </div>
                <div>
                  <div className="font-medium">{getActivityTitle(activity)}</div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    {activity.agent ? (
                      <>
                        {activity.agent.hostname || 'Unknown'} 
                        {activity.agent.ip && ` (${activity.agent.ip})`}
                      </>
                    ) : (
                      'Unknown agent'
                    )}
                  </div>
                  {activity.activityType === 'command' && activity.details?.command && (
                    <div className="text-xs font-mono bg-neutral-100 dark:bg-gray-700 p-1 rounded mt-1 text-neutral-800 dark:text-neutral-300">
                      {activity.details.command}
                    </div>
                  )}
                  <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
