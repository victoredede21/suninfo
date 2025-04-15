import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCommands } from '@/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Eye,
  RefreshCw,
  Repeat,
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { useAgents } from '@/context/agent-context';
import { useToast } from '@/hooks/use-toast';
import type { Command } from '@/types';

interface CommandHistoryProps {
  onViewOutput: (command: Command) => void;
}

export function CommandHistory({ onViewOutput }: CommandHistoryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: commands = [],
    isLoading,
    isError,
    refetch
  } = useQuery({ 
    queryKey: ['/api/commands'],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  const handleViewOutput = (command: Command) => {
    onViewOutput(command);
  };

  const handleRunAgain = async (command: Command) => {
    try {
      // Typically you'd send a new command with the same content
      await fetch(`/api/agents/${command.agentId}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command: command.command,
          elevatedPrivileges: command.elevatedPrivileges,
          waitForOutput: command.waitForOutput
        })
      });
      
      toast({
        title: "Command Sent",
        description: "The command has been sent again to the agent",
      });
      
      // Refresh commands list
      queryClient.invalidateQueries({ queryKey: ['/api/commands'] });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send command",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 border-b border-neutral-200 dark:border-gray-700 flex flex-row justify-between items-center">
        <CardTitle className="text-lg">Command History</CardTitle>
        <Button
          onClick={() => refetch()}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Command</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-red-500">
                    Error loading commands
                  </TableCell>
                </TableRow>
              ) : commands.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No commands found
                  </TableCell>
                </TableRow>
              ) : (
                commands.map((command: Command) => (
                  <TableRow key={command.id} className="hover:bg-neutral-50 dark:hover:bg-gray-750">
                    <TableCell>
                      {formatDistanceToNow(new Date(command.timestamp), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {command.agent?.hostname || 'Unknown'}
                    </TableCell>
                    <TableCell className="font-mono truncate max-w-xs">
                      {command.command}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${command.status === 'success' 
                          ? 'bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300' 
                          : command.status === 'error'
                          ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                          : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                        }`}>
                        {command.status.charAt(0).toUpperCase() + command.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewOutput(command)}
                          title="View Output"
                        >
                          <Eye className="h-4 w-4 text-primary-700 dark:text-primary-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRunAgain(command)}
                          title="Run Again"
                          disabled={command.agent?.isOnline === false}
                        >
                          <Repeat className="h-4 w-4 text-primary-700 dark:text-primary-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t border-neutral-200 dark:border-gray-700 flex justify-between items-center">
        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          Showing {commands.length} most recent commands
        </div>
        {/* Pagination would go here if implemented */}
      </CardFooter>
    </Card>
  );
}
