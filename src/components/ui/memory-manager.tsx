'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  Trash2, 
  MessageCircle, 
  Clock, 
  User, 
  Bot,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface MemoryManagerProps {
  sessionId?: string;
  onSessionChange?: (sessionId: string) => void;
}

export function MemoryManager({ sessionId, onSessionChange }: MemoryManagerProps) {
  const [memory, setMemory] = useState<ChatMessage[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    if (sessionId) {
      setCurrentSessionId(sessionId);
    }
  }, [sessionId]);

  useEffect(() => {
    loadMemory();
  }, [currentSessionId]);

  const loadMemory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/memory?sessionId=${currentSessionId}`);
      if (response.ok) {
        const data = await response.json();
        setMemory(data.memory || []);
        setMessageCount(data.messageCount || 0);
        
        // Update session ID if it's new
        if (data.sessionId && data.sessionId !== currentSessionId) {
          setCurrentSessionId(data.sessionId);
          onSessionChange?.(data.sessionId);
        }
      }
    } catch (error) {
      console.error('Failed to load memory:', error);
      toast.error('Failed to load memory');
    } finally {
      setIsLoading(false);
    }
  };

  const clearMemory = async () => {
    if (!confirm('Are you sure you want to clear all memory? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clear',
          sessionId: currentSessionId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMemory([]);
        setMessageCount(0);
        toast.success('Memory cleared successfully');
        
        // Update session ID if it's new
        if (data.sessionId && data.sessionId !== currentSessionId) {
          setCurrentSessionId(data.sessionId);
          onSessionChange?.(data.sessionId);
        }
      } else {
        throw new Error('Failed to clear memory');
      }
    } catch (error) {
      console.error('Failed to clear memory:', error);
      toast.error('Failed to clear memory');
    } finally {
      setIsLoading(false);
    }
  };

  const formatContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Memory Manager</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {messageCount} messages
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={loadMemory}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={clearMemory}
              disabled={isLoading || memory.length === 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Session ID: {currentSessionId || 'Not initialized'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {memory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-center">No memory yet</p>
            <p className="text-sm text-center mt-1">
              Start a conversation to build memory
            </p>
          </div>
        ) : (
          <ScrollArea className="h-64 w-full rounded-md border">
            <div className="p-4 space-y-4">
              {memory.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-primary/5 border-l-4 border-primary' 
                      : 'bg-secondary/5 border-l-4 border-secondary'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {message.role === 'user' ? (
                      <User className="h-5 w-5 text-primary" />
                    ) : (
                      <Bot className="h-5 w-5 text-secondary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={message.role === 'user' ? 'default' : 'secondary'} className="text-xs">
                        {message.role === 'user' ? 'You' : 'Assistant'}
                      </Badge>
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Message {index + 1}
                      </span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                      {formatContent(message.content)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {memory.length > 0 && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium">Memory Context</p>
                <p className="mt-1">
                  The AI uses this conversation history to provide contextual responses. 
                  Clear memory to start fresh conversations.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}