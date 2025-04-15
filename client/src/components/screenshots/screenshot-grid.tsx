import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getScreenshots, deleteScreenshot } from '@/lib/api';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Camera,
  RefreshCw,
  Maximize2,
  Download,
  Trash2,
  FilterX,
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAgents } from '@/context/agent-context';
import type { Screenshot, Agent } from '@/types';

interface ScreenshotGridProps {
  onViewScreenshot: (screenshot: Screenshot) => void;
}

export function ScreenshotGrid({ onViewScreenshot }: ScreenshotGridProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { agents } = useAgents();
  
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [screenshotToDelete, setScreenshotToDelete] = useState<number | null>(null);
  
  const {
    data: screenshots = [],
    isLoading,
    isError,
    refetch
  } = useQuery({ 
    queryKey: ['/api/screenshots'],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Filter screenshots by agent if selected
  const filteredScreenshots = selectedAgentId === 'all'
    ? screenshots
    : screenshots.filter((screenshot: Screenshot) => 
        screenshot.agentId === parseInt(selectedAgentId)
      );

  const handleDeleteClick = (id: number) => {
    setScreenshotToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (screenshotToDelete === null) return;
    
    try {
      await deleteScreenshot(screenshotToDelete);
      toast({
        title: "Screenshot Deleted",
        description: "Screenshot has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/screenshots'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete screenshot",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setScreenshotToDelete(null);
    }
  };

  const handleDownload = (screenshot: Screenshot) => {
    try {
      // Create a link to download the base64 image
      const link = document.createElement('a');
      link.href = `data:image/jpeg;base64,${screenshot.imageData}`;
      
      // Create a filename with the agent hostname and timestamp
      const hostname = screenshot.agent?.hostname || 'agent';
      const timestamp = format(new Date(screenshot.timestamp), 'yyyyMMdd-HHmmss');
      link.download = `screenshot-${hostname}-${timestamp}.jpg`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download screenshot",
        variant: "destructive",
      });
    }
  };

  const captureNewScreenshot = () => {
    // This would open a dialog to select an agent and capture a screenshot
    toast({
      title: "Feature Not Implemented",
      description: "Please select an agent from the Agents page to capture a screenshot",
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="p-4 border-b border-neutral-200 dark:border-gray-700 flex flex-row justify-between items-center">
          <CardTitle className="text-lg">Screenshots</CardTitle>
          <div className="flex space-x-2">
            <Select
              value={selectedAgentId}
              onValueChange={setSelectedAgentId}
            >
              <SelectTrigger className="w-[180px]">
                <FilterX className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map((agent: Agent) => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    {agent.hostname || `Agent ${agent.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={captureNewScreenshot}
              variant="default"
            >
              <Camera className="h-4 w-4 mr-1" />
              Capture New
            </Button>
            <Button
              onClick={() => refetch()}
              disabled={isLoading}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary-700 dark:text-primary-500" />
            </div>
          ) : isError ? (
            <div className="text-center p-8 text-red-500">
              Error loading screenshots
            </div>
          ) : filteredScreenshots.length === 0 ? (
            <div className="text-center p-8 text-neutral-500">
              No screenshots found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredScreenshots.map((screenshot: Screenshot) => (
                <div 
                  key={screenshot.id} 
                  className="border border-neutral-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <div className="relative h-48 bg-neutral-100 dark:bg-gray-700 overflow-hidden">
                    <img 
                      src={`data:image/jpeg;base64,${screenshot.imageData}`} 
                      alt={`Screenshot from ${screenshot.agent?.hostname || 'agent'}`} 
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => onViewScreenshot(screenshot)}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-sm">
                      <div>
                        {screenshot.agent?.hostname || 'Unknown'} 
                        {screenshot.agent?.ip && ` (${screenshot.agent.ip})`}
                      </div>
                      <div className="text-xs">
                        {format(new Date(screenshot.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <div className="text-sm">
                      {screenshot.agent?.platform || 'Unknown OS'}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewScreenshot(screenshot)}
                        title="View Full Size"
                      >
                        <Maximize2 className="h-4 w-4 text-primary-700 dark:text-primary-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(screenshot)}
                        title="Download"
                      >
                        <Download className="h-4 w-4 text-primary-700 dark:text-primary-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(screenshot.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-700 dark:text-red-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 border-t border-neutral-200 dark:border-gray-700 flex justify-between items-center">
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            Showing {filteredScreenshots.length} {filteredScreenshots.length === 1 ? 'screenshot' : 'screenshots'}
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
              This will permanently delete this screenshot. This action cannot be undone.
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
