export interface Agent {
  id: number;
  clientId: string;
  hostname: string | null;
  ip: string | null;
  platform: string | null;
  platformRelease: string | null;
  platformVersion: string | null;
  architecture: string | null;
  processor: string | null;
  username: string | null;
  screenResolution: string | null;
  isOnline: boolean;
  lastSeen: string;
  firstSeen: string;
}

export interface AgentDetails extends Agent {
  beaconInterval: number;
  jitter: number;
}

export interface Screenshot {
  id: number;
  agentId: number;
  timestamp: string;
  imageData: string;
  width: number | null;
  height: number | null;
  agent?: {
    id: number;
    hostname: string | null;
    ip: string | null;
    platform: string | null;
  };
}

export interface Command {
  id: number;
  agentId: number;
  command: string;
  output: string | null;
  status: 'pending' | 'success' | 'error';
  elevatedPrivileges: boolean;
  waitForOutput: boolean;
  executionTime: string | null;
  timestamp: string;
  agent?: {
    id: number;
    hostname: string | null;
    ip: string | null;
  };
}

export interface Activity {
  id: number;
  agentId: number | null;
  clientId: string | null;
  activityType: string;
  details: Record<string, any> | null;
  timestamp: string;
  agent?: {
    id: number;
    hostname: string | null;
    ip: string | null;
  } | null;
}

export interface ServerStats {
  totalAgents: number;
  onlineAgents: number;
  offlineAgents: number;
  commandsRun: number;
  screenshotsCount: number;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
  description: string | null;
}

export interface CommandFormData {
  command: string;
  elevatedPrivileges: boolean;
  waitForOutput: boolean;
}

export interface ServerError {
  message: string;
  errors?: any[];
}
