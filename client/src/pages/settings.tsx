import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/page-layout';
import { getSettings, updateSetting } from '@/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { useToast } from '@/hooks/use-toast';
import type { Setting } from '@/types';

// Define default settings
const defaultSettings = {
  server_address: "https://your-c2-server.vercel.app/",
  websocket_server: "wss://your-c2-server.vercel.app/api/socket",
  log_level: "info",
  beacon_interval: "3600",
  jitter: "300",
  screenshot_quality: "50",
  stream_quality: "30",
  session_timeout: "30"
};

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['/api/settings']
  });
  
  // Create form with default values
  const form = useForm({
    defaultValues: {
      ...defaultSettings,
      // Override with actual settings from the database if available
      ...settings.reduce((acc: Record<string, string>, setting: Setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {})
    }
  });
  
  // Handle form submission
  const onSubmit = async (data: Record<string, string>) => {
    try {
      // Update each setting
      for (const [key, value] of Object.entries(data)) {
        await updateSetting(key, value);
      }
      
      toast({
        title: "Settings Saved",
        description: "Server settings have been updated successfully",
      });
      
      // Refresh settings
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const togglePasswordVisibility = (key: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Helper to determine if a field should be a password field
  const isSecretField = (key: string) => {
    return key.includes('key') || 
           key.includes('password') || 
           key.includes('secret') || 
           key.includes('token') ||
           key.includes('database_url');
  };

  return (
    <PageLayout title="Settings">
      <Card>
        <CardHeader className="p-4 border-b border-neutral-200 dark:border-gray-700">
          <CardTitle className="text-lg">Server Settings</CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="p-6 space-y-6">
              {/* Server Configuration */}
              <div>
                <h3 className="text-lg font-medium mb-4">Server Configuration</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="server_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Server Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          The base URL for your C2 server
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="websocket_server"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WebSocket Server</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          WebSocket endpoint for real-time communication
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="database_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Database URL</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showSecrets.database_url ? "text" : "password"} 
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2"
                              onClick={() => togglePasswordVisibility('database_url')}
                            >
                              {showSecrets.database_url ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          PostgreSQL database connection string
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="log_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Log Level</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select log level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="info">Info</SelectItem>
                            <SelectItem value="debug">Debug</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="error">Error</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Minimum log level to record
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Agent Settings */}
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-4">Agent Settings</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="beacon_interval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Beacon Interval (seconds)</FormLabel>
                        <FormControl>
                          <Input type="number" min="10" {...field} />
                        </FormControl>
                        <FormDescription>
                          How often agents check in by default
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="jitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Jitter (seconds)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormDescription>
                          Random time variation added to beacon interval
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="screenshot_quality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Screenshot Quality (1-100)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="100" {...field} />
                        </FormControl>
                        <FormDescription>
                          JPEG quality for screenshots
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="stream_quality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Stream Quality (1-100)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="100" {...field} />
                        </FormControl>
                        <FormDescription>
                          JPEG quality for screen streaming
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Security Settings */}
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-4">Security Settings</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="encryption_key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AES Encryption Key (Base64)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showSecrets.encryption_key ? "text" : "password"} 
                              className="font-mono"
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2"
                              onClick={() => togglePasswordVisibility('encryption_key')}
                            >
                              {showSecrets.encryption_key ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Base64-encoded AES key for agent communication
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="admin_username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Username for admin access
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="admin_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showSecrets.admin_password ? "text" : "password"} 
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2"
                              onClick={() => togglePasswordVisibility('admin_password')}
                            >
                              {showSecrets.admin_password ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Password for admin access
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="session_timeout"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session Timeout (minutes)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormDescription>
                          How long until admin session expires
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 border-t border-neutral-200 dark:border-gray-700 flex justify-end">
              <Button type="submit" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </PageLayout>
  );
}
