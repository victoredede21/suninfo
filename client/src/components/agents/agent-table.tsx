import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAgents, deleteAgent } from '@/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Info,
  Camera,
  Terminal,
  Trash2,
  RefreshCw,
  Search,
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useAgents } from '@/context/agent-context';
import { useLocation } from 'wouter';
import type { Agent } from '@/types';

export function AgentTable() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { captureScreenshot } = useAgents();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  
  const {
    data: agents = [],
    isLoading,
    isError,
    refetch
  } = useQuery({ queryKey: ['/api/agents'] });

  const filteredAgents = agents.filter((agent: Agent) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (agent.hostname?.toLowerCase().includes(searchLower) || false) ||
      (agent.ip?.toLowerCase().includes(searchLower) || false) ||
      (agent.platform?.toLowerCase().includes(searchLower) || false)
    );
  });

  const handleViewDetails = (id: number) => {
    navigate(`/agents/${id}`);
  };

  const handleScreenshot = async (id: number) => {
    try {
      await captureScreenshot(id);
      toast({
        title: "Screenshot Requested",
        description: "Screenshot will be captured shortly",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request screenshot",
        variant: "destructive",
      });
    }
  };

  const handleExecuteCommand = (id: number) => {
    navigate(`/commands?agentId=${id}`);
  };

  const handleDeleteClick = (id: number) => {
    setSelectedAgentId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedAgentId === null) return;
    
    try {
      await deleteAgent(selectedAgentId);
      toast({
        title: "Agent Deleted",
        description: "Agent has been deleted successfully",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete agent",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedAgentId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="p-4 border-b border-neutral-200 dark:border-gray-700 flex flex-row justify-between items-center">
          <CardTitle className="text-lg">Agent Management</CardTitle>
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button
              onClick={() => refetch()}
              disabled={isLoading}
              variant="default"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Hostname</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>OS</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-red-500">
                      Error loading agents
                    </TableCell>
                  </TableRow>
                ) : filteredAgents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No agents found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAgents.map((agent: Agent) => (
                    <TableRow key={agent.id} className="hover:bg-neutral-50 dark:hover:bg-gray-750">
                      <TableCell>
                        <span className="flex items-center">
                          <span className={`w-2 h-2 ${agent.isOnline ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-600'} rounded-full mr-2`}></span>
                          <span className={agent.isOnline ? 'text-sm text-green-700 dark:text-green-500' : 'text-sm text-neutral-500'}>
                            {agent.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {agent.hostname || 'Unknown'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {agent.ip || 'Unknown'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {agent.platform} {agent.platformVersion && `(${agent.platformVersion})`}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDistanceToNow(new Date(agent.lastSeen), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(agent.id)}
                            title="View Details"
                          >
                            <Info className="h-4 w-4 text-primary-700 dark:text-primary-400" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleScreenshot(agent.id)}
                            title="Take Screenshot"
                            disabled={!agent.isOnline}
                            className={!agent.isOnline ? 'cursor-not-allowed opacity-50' : ''}
                          >
                            <Camera className="h-4 w-4 text-primary-700 dark:text-primary-400" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExecuteCommand(agent.id)}
                            title="Execute Command"
                            disabled={!agent.isOnline}
                            className={!agent.isOnline ? 'cursor-not-allowed opacity-50' : ''}
                          >
                            <Terminal className="h-4 w-4 text-primary-700 dark:text-primary-400" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(agent.id)}
                            title="Delete Agent"
                          >
                            <Trash2 className="h-4 w-4 text-red-700 dark:text-red-400" />
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
            Showing {filteredAgents.length} {filteredAgents.length === 1 ? 'agent' : 'agents'}
          </div>
          {/* Pagination would go here if implemented */}
        </CardFooter>
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
              onClick={handleDeleteConfirm}
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
