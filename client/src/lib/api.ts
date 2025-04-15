import { apiRequest } from './queryClient';
import type { Agent, Command, Screenshot, ServerStats, Setting, CommandFormData } from '../types';

// Agents API
export async function getAgents() {
  const res = await apiRequest('GET', '/api/agents');
  return res.json();
}

export async function getAgent(id: number) {
  const res = await apiRequest('GET', `/api/agents/${id}`);
  return res.json();
}

export async function deleteAgent(id: number) {
  const res = await apiRequest('DELETE', `/api/agents/${id}`);
  return res.json();
}

export async function captureScreenshot(id: number) {
  const res = await apiRequest('POST', `/api/agents/${id}/screenshot`);
  return res.json();
}

export async function executeCommand(id: number, data: CommandFormData) {
  const res = await apiRequest('POST', `/api/agents/${id}/command`, data);
  return res.json();
}

// Screenshots API
export async function getScreenshots() {
  const res = await apiRequest('GET', '/api/screenshots');
  return res.json();
}

export async function getScreenshot(id: number) {
  const res = await apiRequest('GET', `/api/screenshots/${id}`);
  return res.json();
}

export async function deleteScreenshot(id: number) {
  const res = await apiRequest('DELETE', `/api/screenshots/${id}`);
  return res.json();
}

// Commands API
export async function getCommands() {
  const res = await apiRequest('GET', '/api/commands');
  return res.json();
}

export async function getCommand(id: number) {
  const res = await apiRequest('GET', `/api/commands/${id}`);
  return res.json();
}

// Activities API
export async function getActivities(limit: number = 20) {
  const res = await apiRequest('GET', `/api/activities?limit=${limit}`);
  return res.json();
}

// Stats API
export async function getServerStats() {
  const res = await apiRequest('GET', '/api/stats');
  return res.json();
}

// Settings API
export async function getSettings() {
  const res = await apiRequest('GET', '/api/settings');
  return res.json();
}

export async function updateSetting(key: string, value: string, description?: string) {
  const data = description ? { value, description } : { value };
  const res = await apiRequest('PUT', `/api/settings/${key}`, data);
  return res.json();
}
