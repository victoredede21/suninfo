import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/page-layout';
import { ScreenshotGrid } from '@/components/screenshots/screenshot-grid';
import { ScreenshotModal } from '@/components/screenshots/screenshot-modal';
import { useToast } from '@/hooks/use-toast';
import { deleteScreenshot } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import type { Screenshot } from '@/types';

export default function Screenshots() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);

  const handleViewScreenshot = (screenshot: Screenshot) => {
    setSelectedScreenshot(screenshot);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleDownload = (screenshot: Screenshot) => {
    try {
      // Create a link to download the base64 image
      const link = document.createElement('a');
      link.href = `data:image/jpeg;base64,${screenshot.imageData}`;
      
      // Create a filename using agent hostname and timestamp
      const hostname = screenshot.agent?.hostname || 'agent';
      const timestamp = new Date(screenshot.timestamp).toISOString().replace(/[:.]/g, '-');
      link.download = `screenshot_${hostname}_${timestamp}.jpg`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download the screenshot",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteScreenshot(id);
      
      toast({
        title: "Screenshot Deleted",
        description: "Screenshot has been removed successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/screenshots'] });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Could not delete the screenshot",
        variant: "destructive",
      });
    }
  };

  return (
    <PageLayout title="Screenshots">
      <ScreenshotGrid onViewScreenshot={handleViewScreenshot} />
      
      <ScreenshotModal
        screenshot={selectedScreenshot}
        open={modalOpen}
        onClose={handleCloseModal}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />
    </PageLayout>
  );
}
