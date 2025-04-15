import React from 'react';
import { PageLayout } from '@/components/layout/page-layout';
import { AgentTable } from '@/components/agents/agent-table';

export default function Agents() {
  return (
    <PageLayout title="Agent Management">
      <AgentTable />
    </PageLayout>
  );
}
