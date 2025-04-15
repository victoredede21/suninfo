import React from 'react';
import { PageLayout } from '@/components/layout/page-layout';
import { StatCard } from '@/components/dashboard/stat-card';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { OnlineAgents } from '@/components/dashboard/online-agents';
import { useAgents } from '@/context/agent-context';

export default function Dashboard() {
  const { stats, isStatsLoading } = useAgents();

  return (
    <PageLayout title="Dashboard">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total Agents" 
          value={isStatsLoading ? 0 : stats?.totalAgents || 0} 
          type="agents" 
        />
        <StatCard 
          title="Online Agents" 
          value={isStatsLoading ? 0 : stats?.onlineAgents || 0} 
          type="online" 
        />
        <StatCard 
          title="Offline Agents" 
          value={isStatsLoading ? 0 : stats?.offlineAgents || 0} 
          type="offline" 
        />
        <StatCard 
          title="Commands Run" 
          value={isStatsLoading ? 0 : stats?.commandsRun || 0} 
          type="commands" 
        />
      </div>
      
      {/* Activity and Agent Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>
        
        {/* Online Agents Summary */}
        <div>
          <OnlineAgents />
        </div>
      </div>
    </PageLayout>
  );
}
