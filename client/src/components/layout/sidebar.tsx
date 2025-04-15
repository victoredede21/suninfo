import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Laptop, 
  Image as ImageIcon, 
  Terminal, 
  Settings, 
  X, 
  Cloud, 
  Database 
} from "lucide-react";
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAgents } from '@/context/agent-context';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { stats } = useAgents();

  return (
    <div
      className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto md:translate-x-0 
      bg-primary-700 dark:bg-gray-800 text-white flex flex-col h-full
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* Logo */}
      <div className="px-4 py-6 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded bg-white flex items-center justify-center mr-2">
            <span className="text-primary-700 font-bold text-sm">C2</span>
          </div>
          <span className="text-xl font-semibold">C2 Server</span>
        </div>
        <button 
          onClick={onClose} 
          className="md:hidden text-white"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="mt-5 flex-1 px-2 space-y-1">
        <Link href="/">
          <a
            className={`group flex items-center px-2 py-2 text-base font-medium rounded-md 
            ${location === '/' ? 'bg-primary-600 dark:bg-gray-700' : 'hover:bg-primary-600 dark:hover:bg-gray-700'}`}
          >
            <LayoutDashboard className="mr-3 h-5 w-5" />
            Dashboard
          </a>
        </Link>
        <Link href="/agents">
          <a
            className={`group flex items-center px-2 py-2 text-base font-medium rounded-md 
            ${location.startsWith('/agents') ? 'bg-primary-600 dark:bg-gray-700' : 'hover:bg-primary-600 dark:hover:bg-gray-700'}`}
          >
            <Laptop className="mr-3 h-5 w-5" />
            Agents
          </a>
        </Link>
        <Link href="/screenshots">
          <a
            className={`group flex items-center px-2 py-2 text-base font-medium rounded-md 
            ${location.startsWith('/screenshots') ? 'bg-primary-600 dark:bg-gray-700' : 'hover:bg-primary-600 dark:hover:bg-gray-700'}`}
          >
            <ImageIcon className="mr-3 h-5 w-5" />
            Screenshots
          </a>
        </Link>
        <Link href="/commands">
          <a
            className={`group flex items-center px-2 py-2 text-base font-medium rounded-md 
            ${location.startsWith('/commands') ? 'bg-primary-600 dark:bg-gray-700' : 'hover:bg-primary-600 dark:hover:bg-gray-700'}`}
          >
            <Terminal className="mr-3 h-5 w-5" />
            Commands
          </a>
        </Link>
        <Link href="/settings">
          <a
            className={`group flex items-center px-2 py-2 text-base font-medium rounded-md 
            ${location.startsWith('/settings') ? 'bg-primary-600 dark:bg-gray-700' : 'hover:bg-primary-600 dark:hover:bg-gray-700'}`}
          >
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </a>
        </Link>
      </nav>
      
      {/* Server Info */}
      <div className="border-t border-primary-600 dark:border-gray-700 p-4">
        <div className="flex items-center text-sm">
          <Cloud className="text-green-500 mr-2 h-5 w-5" />
          <span>Server: Online</span>
        </div>
        <div className="text-xs mt-2 text-primary-100">
          <div>Render.com Deployment</div>
          <div className="truncate">Database: PostgreSQL</div>
        </div>
        <div className="mt-3 flex">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
