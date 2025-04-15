import React from 'react';
import { 
  Laptop, 
  Wifi, 
  WifiOff, 
  Terminal,
  Camera
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type StatIconType = 'agents' | 'online' | 'offline' | 'commands' | 'screenshots';

interface StatCardProps {
  title: string;
  value: number;
  type: StatIconType;
}

export function StatCard({ title, value, type }: StatCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'agents':
        return <Laptop className="h-5 w-5 text-primary-700 dark:text-primary-300" />;
      case 'online':
        return <Wifi className="h-5 w-5 text-green-700 dark:text-green-500" />;
      case 'offline':
        return <WifiOff className="h-5 w-5 text-red-700 dark:text-red-500" />;
      case 'commands':
        return <Terminal className="h-5 w-5 text-primary-700 dark:text-primary-300" />;
      case 'screenshots':
        return <Camera className="h-5 w-5 text-primary-700 dark:text-primary-300" />;
      default:
        return <Laptop className="h-5 w-5 text-primary-700 dark:text-primary-300" />;
    }
  };

  const getIconBgColor = () => {
    switch (type) {
      case 'agents':
      case 'commands':
      case 'screenshots':
        return 'bg-primary-50 dark:bg-gray-700';
      case 'online':
        return 'bg-green-50 dark:bg-gray-700';
      case 'offline':
        return 'bg-red-50 dark:bg-gray-700';
      default:
        return 'bg-primary-50 dark:bg-gray-700';
    }
  };

  const getValueColor = () => {
    switch (type) {
      case 'agents':
      case 'commands':
      case 'screenshots':
        return 'text-neutral-800 dark:text-white';
      case 'online':
        return 'text-green-700 dark:text-green-500';
      case 'offline':
        return 'text-red-700 dark:text-red-500';
      default:
        return 'text-neutral-800 dark:text-white';
    }
  };

  return (
    <Card>
      <CardContent className="p-4 flex">
        <div className={`rounded-full ${getIconBgColor()} p-3 mr-4`}>
          {getIcon()}
        </div>
        <div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">{title}</div>
          <div className={`text-2xl font-semibold ${getValueColor()}`}>{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
