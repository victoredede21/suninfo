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
  Database,
  Skull,
  Shield,
  Network
} from "lucide-react";
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAgents } from '@/context/agent-context';
import kaliDragonLogo from '../../assets/kali-dragon.svg';

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
      sidebar text-white flex flex-col h-full border-r border-accent
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* Logo */}
      <div className="px-4 py-6 flex items-center justify-between border-b border-accent/30">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center mr-2 overflow-hidden">
            <img src={kaliDragonLogo} alt="Kali Logo" className="w-7 h-7 opacity-80" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">C2 Server</span>
            <div className="text-xs text-muted-foreground">Command & Control</div>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="md:hidden text-white hover:bg-accent/20 p-1 rounded"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="mt-3 flex-1 px-3 space-y-1">
        <div className="text-xs uppercase text-muted-foreground tracking-wider px-2 py-1 mt-2">Main</div>
        <Link href="/">
          <a
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
            ${location === '/' 
              ? 'bg-primary/20 text-white border-l-2 border-primary' 
              : 'hover:bg-primary/10 text-muted-foreground hover:text-white'}`}
          >
            <LayoutDashboard className="mr-3 h-5 w-5" />
            Dashboard
          </a>
        </Link>
        
        <div className="text-xs uppercase text-muted-foreground tracking-wider px-2 py-1 mt-2">Control</div>
        <Link href="/agents">
          <a
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
            ${location.startsWith('/agents') 
              ? 'bg-primary/20 text-white border-l-2 border-primary' 
              : 'hover:bg-primary/10 text-muted-foreground hover:text-white'}`}
          >
            <Laptop className="mr-3 h-5 w-5" />
            Agents
          </a>
        </Link>
        <Link href="/commands">
          <a
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
            ${location.startsWith('/commands') 
              ? 'bg-primary/20 text-white border-l-2 border-primary' 
              : 'hover:bg-primary/10 text-muted-foreground hover:text-white'}`}
          >
            <Terminal className="mr-3 h-5 w-5" />
            Commands
          </a>
        </Link>
        
        <div className="text-xs uppercase text-muted-foreground tracking-wider px-2 py-1 mt-2">Surveillance</div>
        <Link href="/screenshots">
          <a
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
            ${location.startsWith('/screenshots') 
              ? 'bg-primary/20 text-white border-l-2 border-primary' 
              : 'hover:bg-primary/10 text-muted-foreground hover:text-white'}`}
          >
            <ImageIcon className="mr-3 h-5 w-5" />
            Screenshots
          </a>
        </Link>
        
        <div className="text-xs uppercase text-muted-foreground tracking-wider px-2 py-1 mt-2">System</div>
        <Link href="/settings">
          <a
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
            ${location.startsWith('/settings') 
              ? 'bg-primary/20 text-white border-l-2 border-primary' 
              : 'hover:bg-primary/10 text-muted-foreground hover:text-white'}`}
          >
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </a>
        </Link>
      </nav>
      
      {/* Server Info */}
      <div className="border-t border-accent/30 p-4">
        <div className="flex justify-between mb-2">
          <div className="flex items-center text-sm">
            <Shield className="text-primary mr-2 h-4 w-4" />
            <span className="text-xs font-medium">System Status</span>
          </div>
          <span className="px-1.5 py-0.5 text-xs rounded-md bg-green-500/20 text-green-500 border border-green-500/30">ACTIVE</span>
        </div>
        
        <div className="space-y-1 mt-3">
          <div className="flex items-center text-xs text-muted-foreground">
            <Network className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <span>Render.com Deployment</span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Database className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <span>PostgreSQL Database</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4 pt-2 border-t border-accent/20">
          <div className="text-xs text-primary/70">Kali Linux Theme</div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
