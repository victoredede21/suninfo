import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAgents } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Agent, CommandFormData } from '@/types';

// Define schema for command form
const commandFormSchema = z.object({
  agentId: z.string().min(1, 'Please select an agent'),
  command: z.string().min(1, 'Command is required'),
  elevatedPrivileges: z.boolean().default(false),
  waitForOutput: z.boolean().default(true)
});

interface CommandFormProps {
  defaultAgentId?: string;
  onSubmit: (data: CommandFormData & { agentId: number }) => void;
}

export function CommandForm({ defaultAgentId, onSubmit }: CommandFormProps) {
  // Create form
  const form = useForm<z.infer<typeof commandFormSchema>>({
    resolver: zodResolver(commandFormSchema),
    defaultValues: {
      agentId: defaultAgentId || '',
      command: '',
      elevatedPrivileges: false,
      waitForOutput: true
    }
  });

  // Get agents
  const { 
    data: agents = [], 
    isLoading: isAgentsLoading 
  } = useQuery({ queryKey: ['/api/agents'] });
  
  // Filter only online agents
  const onlineAgents = agents.filter((agent: Agent) => agent.isOnline);

  // Handle form submission
  const handleSubmit = (values: z.infer<typeof commandFormSchema>) => {
    onSubmit({
      agentId: parseInt(values.agentId),
      command: values.command,
      elevatedPrivileges: values.elevatedPrivileges,
      waitForOutput: values.waitForOutput
    });
  };

  return (
    <Card>
      <CardHeader className="p-4 border-b border-neutral-200 dark:border-gray-700">
        <CardTitle className="text-lg">Execute Command</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="agentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Agent</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isAgentsLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an agent..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {onlineAgents.length === 0 ? (
                        <SelectItem value="" disabled>
                          No online agents available
                        </SelectItem>
                      ) : (
                        onlineAgents.map((agent: Agent) => (
                          <SelectItem key={agent.id} value={agent.id.toString()}>
                            {agent.hostname || `Agent ${agent.id}`} ({agent.ip || 'Unknown IP'})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Only online agents can execute commands
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="command"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Command</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter command to execute..."
                      className="font-mono h-32"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="elevatedPrivileges"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Attempt to run with elevated privileges
                    </FormLabel>
                    <FormDescription>
                      This will try to run the command as administrator/root
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="waitForOutput"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Wait for command output
                    </FormLabel>
                    <FormDescription>
                      If unchecked, the command will be executed asynchronously
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={!form.formState.isValid || form.formState.isSubmitting || onlineAgents.length === 0}
              >
                Execute Command
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
