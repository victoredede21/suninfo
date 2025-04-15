import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Trash2, X } from "lucide-react";
import { format } from 'date-fns';
import type { Screenshot } from '@/types';

interface ScreenshotModalProps {
  screenshot: Screenshot | null;
  open: boolean;
  onClose: () => void;
  onDownload: (screenshot: Screenshot) => void;
  onDelete: (id: number) => void;
}

export function ScreenshotModal({
  screenshot,
  open,
  onClose,
  onDownload,
  onDelete
}: ScreenshotModalProps) {
  if (!screenshot) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl p-0 gap-0 bg-transparent border-0 shadow-none">
        <div className="relative">
          <Button 
            onClick={onClose}
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 bg-black bg-opacity-50 text-white hover:bg-black hover:bg-opacity-70"
          >
            <X className="h-5 w-5" />
          </Button>
          
          <img
            src={`data:image/jpeg;base64,${screenshot.imageData}`}
            alt={`Screenshot from ${screenshot.agent?.hostname || 'agent'}`}
            className="max-h-[80vh] mx-auto rounded-t-lg"
          />
          
          <div className="p-4 bg-white dark:bg-gray-800 rounded-b-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {screenshot.agent?.hostname || 'Unknown'} 
                  {screenshot.agent?.ip && ` (${screenshot.agent.ip})`}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {format(new Date(screenshot.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => onDownload(screenshot)}
                  variant="default"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={() => {
                    onDelete(screenshot.id);
                    onClose();
                  }}
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
