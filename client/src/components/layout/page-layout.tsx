import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import kaliDragonLogo from '../../assets/kali-dragon.svg';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function PageLayout({ children, title }: PageLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden text-foreground">
      {/* Kali Linux Dragon Logo Watermark */}
      <div className="fixed bottom-0 right-0 w-96 h-96 opacity-5 pointer-events-none z-0">
        <img src={kaliDragonLogo} alt="Kali Linux Dragon" className="w-full h-full" />
      </div>
      
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top Navbar */}
        <Navbar title={title} onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
