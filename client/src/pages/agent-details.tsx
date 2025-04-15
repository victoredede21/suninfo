import React from 'react';
import { useParams } from 'wouter';
import { PageLayout } from '@/components/layout/page-layout';
import { AgentDetails as AgentDetailsComponent } from '@/components/agents/agent-details';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function AgentDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  
  if (!id || isNaN(parseInt(id))) {
    return (
      <PageLayout title="Agent Not Found">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500 mb-4">
              Invalid agent ID
            </div>
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => navigate('/agents')}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Agents
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Agent Details">
      <AgentDetailsComponent id={parseInt(id)} />
    </PageLayout>
  );
}
