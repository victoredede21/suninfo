import React, { useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { PageLayout } from '@/components/layout/page-layout';
import { CommandForm } from '@/components/commands/command-form';
import { CommandOutput } from '@/components/commands/command-output';
import { CommandHistory } from '@/components/commands/command-history';
import { executeCommand } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import type { CommandFormData, Command } from '@/types';

export default function Commands() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(useSearch());
  const agentIdParam = params.get('agentId');
  
  const [activeCommand, setActiveCommand] = useState<Command | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecuteCommand = async (data: CommandFormData & { agentId: number }) => {
    setIsExecuting(true);
    
    try {
      const result = await executeCommand(data.agentId, {
        command: data.command,
        elevatedPrivileges: data.elevatedPrivileges,
        waitForOutput: data.waitForOutput
      });
      
      toast({
        title: "Command Sent",
        description: data.waitForOutput 
          ? "Command has been sent to the agent. Waiting for output..."
          : "Command has been sent to the agent and will execute asynchronously.",
      });
      
      // Clear the agentId from URL if it was set
      if (agentIdParam) {
        setLocation('/commands');
      }
      
      // Refresh commands list after execution
      queryClient.invalidateQueries({ queryKey: ['/api/commands'] });
      
    } catch (error) {
      toast({
        title: "Command Failed",
        description: "Failed to send command to the agent",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleViewCommandOutput = (command: Command) => {
    setActiveCommand(command);
  };

  return (
    <PageLayout title="Command Execution">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Agent Selection and Command Input */}
        <div className="md:col-span-1">
          <CommandForm 
            defaultAgentId={agentIdParam || undefined}
            onSubmit={handleExecuteCommand}
          />
        </div>
        
        {/* Command Output */}
        <div className="md:col-span-2">
          <CommandOutput 
            command={activeCommand}
            isExecuting={isExecuting}
          />
        </div>
      </div>
      
      {/* Command History */}
      <div className="mt-6">
        <CommandHistory onViewOutput={handleViewCommandOutput} />
      </div>
    </PageLayout>
  );
}
