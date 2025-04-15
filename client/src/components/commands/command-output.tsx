import React, { useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clipboard, XCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import type { Command } from '@/types';

interface CommandOutputProps {
  command: Command | null;
  isExecuting: boolean;
}

export function CommandOutput({ command, isExecuting }: CommandOutputProps) {
  const { toast } = useToast();
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [command?.output]);

  const copyToClipboard = () => {
    if (command?.output) {
      navigator.clipboard.writeText(command.output)
        .then(() => {
          toast({
            title: "Copied",
            description: "Command output copied to clipboard",
          });
        })
        .catch(() => {
          toast({
            title: "Failed to copy",
            description: "Could not copy output to clipboard",
            variant: "destructive",
          });
        });
    }
  };

  const clearOutput = () => {
    // This would typically clear the command in state
    // Since we're just displaying a selected command,
    // in this implementation we'd reset the selected command
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="p-4 border-b border-neutral-200 dark:border-gray-700 flex flex-row justify-between items-center">
        <CardTitle className="text-lg">Command Output</CardTitle>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={copyToClipboard}
            disabled={!command?.output}
            title="Copy Output"
          >
            <Clipboard className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearOutput}
            disabled={!command?.output}
            title="Clear Output"
          >
            <XCircle className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 overflow-auto">
        <div 
          ref={outputRef}
          className="bg-neutral-900 text-green-400 font-mono text-sm p-4 rounded h-full whitespace-pre-wrap overflow-auto"
        >
          {isExecuting ? (
            <div className="animate-pulse">Executing command...</div>
          ) : !command ? (
            <div className="text-neutral-500">
              Select a command to view output or execute a new command
            </div>
          ) : command.status === 'pending' ? (
            <div className="text-yellow-400">
              Command is pending execution...
            </div>
          ) : command.status === 'error' ? (
            <div className="text-red-400">
              {command.output || 'Command execution failed'}
            </div>
          ) : command.output ? (
            command.output
          ) : (
            <div className="text-neutral-500">
              No output received from command execution
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t border-neutral-200 dark:border-gray-700">
        {command ? (
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            <span className="font-medium text-primary-700 dark:text-primary-500">
              {command.agent?.hostname || 'Unknown Agent'}
            </span> • 
            {command.executionTime && ` Execution time: ${command.executionTime} • `}
            Status: <span className={
              command.status === 'success' 
                ? 'text-success-700 dark:text-success-500' 
                : command.status === 'error'
                ? 'text-red-700 dark:text-red-500'
                : 'text-yellow-700 dark:text-yellow-500'
            }>
              {command.status.charAt(0).toUpperCase() + command.status.slice(1)}
            </span>
          </div>
        ) : (
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            No command selected
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
