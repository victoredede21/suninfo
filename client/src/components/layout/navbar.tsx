import React from 'react';
import { Menu, Circle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAgents } from '@/context/agent-context';

interface NavbarProps {
  title: string;
  onOpenSidebar: () => void;
}

export function Navbar({ title, onOpenSidebar }: NavbarProps) {
  const { stats } = useAgents();
  
  const onlineAgents = stats?.onlineAgents || 0;
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow z-10">
      <div className="px-4 py-2 flex justify-between items-center">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden mr-2"
            onClick={onOpenSidebar}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
            {title}
          </h1>
        </div>
        
        <div className="flex items-center">
          <span className="flex items-center mr-4">
            <Circle className="w-4 h-4 text-green-500 mr-1 fill-current" />
            <span className="text-sm text-green-700 dark:text-green-500">
              {onlineAgents} {onlineAgents === 1 ? 'Agent' : 'Agents'} Online
            </span>
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full bg-primary-700 dark:bg-primary-600 hover:bg-primary-800 dark:hover:bg-primary-700 text-white"
              >
                <User className="h-4 w-4" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>API Keys</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 dark:text-red-400">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
