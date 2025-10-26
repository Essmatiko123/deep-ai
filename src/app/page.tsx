'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MemoryManager } from '@/components/ui/memory-manager';
import { StructuredResponse } from '@/components/ui/structured-response';
import { ApiSelector } from '@/components/ui/api-selector';
import { toast } from 'sonner';
import { 
  Send, 
  Settings, 
  Download, 
  Undo2, 
  Trash2, 
  Paperclip, 
  Image as ImageIcon,
  Shuffle,
  Moon,
  Sun,
  Monitor,
  Type,
  Palette,
  Zap,
  Database,
  Globe,
  FileText,
  X,
  Plus,
  Edit,
  Save,
  RefreshCw,
  Sparkles,
  Brain,
  Copy,
  RotateCcw
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  files?: File[];
  imageUrl?: string;
  model?: string;
}

interface Settings {
  model: string;
  textApiEndpoint: string;
  imageApiEndpoint: string;
  chatWidth: string;
  bubbleShape: 'rounded' | 'square';
  showTimestamps: boolean;
  fontSize: 'small' | 'medium' | 'large';
  animationSpeed: 'slow' | 'normal' | 'fast';
  reduceMotion: boolean;
  theme: 'light' | 'dark' | 'system';
  seed?: string;
  temperature?: number;
  maxTokens?: number;
  customApis: Array<{
    id: string;
    name: string;
    endpoint: string;
    apiKey?: string;
    type: 'text' | 'image' | 'both';
    enabled: boolean;
  }>;
  puterEnabled: boolean;
  localModels: Array<{
    id: string;
    name: string;
    endpoint: string;
    apiKey?: string;
    type: 'text' | 'image';
    enabled: boolean;
  }>;
  apiKeys: {
    openai?: string;
    mistral?: string;
    claude?: string;
    pollinations?: string;
  };
}

const defaultSettings: Settings = {
  model: 'OpenAI',
  textApiEndpoint: 'https://text.pollinations.ai/',
  imageApiEndpoint: 'https://image.pollinations.ai/prompt/',
  chatWidth: '1000px',
  bubbleShape: 'rounded',
  showTimestamps: true,
  fontSize: 'medium',
  animationSpeed: 'normal',
  reduceMotion: false,
  theme: 'light',
  temperature: 0.7,
  maxTokens: 1000,
  customApis: [],
  puterEnabled: false,
  localModels: [],
  apiKeys: {}
};

const availableModels = [
  'OpenAI',
  'Mistral',
  'Claude',
  'Flux',
  'Llama2',
  'Stable Diffusion',
  'DALL-E',
  'Local Model'
];

// Helper functions for file processing
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function AIChatApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isImageMode, setIsImageMode] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [selectedApi, setSelectedApi] = useState<string>('pollinations');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Define all available APIs
  const allApis = [
    { id: 'openai', name: 'OpenAI', endpoint: 'https://api.openai.com/v1/chat/completions', apiKey: settings.apiKeys.openai, type: 'text' },
    { id: 'pollinations', name: 'Pollinations', endpoint: 'https://text.pollinations.ai', apiKey: settings.apiKeys.pollinations, type: 'both' },
    { id: 'mistral', name: 'Mistral', endpoint: 'https://api.mistral.ai/v1/chat/completions', apiKey: settings.apiKeys.mistral, type: 'text' },
    { id: 'claude', name: 'Claude', endpoint: 'https://api.anthropic.com/v1/messages', apiKey: settings.apiKeys.claude, type: 'text' },
    ...settings.customApis,
    ...settings.localModels
  ];

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('aiChatSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage when updated
  useEffect(() => {
    localStorage.setItem('aiChatSettings', JSON.stringify(settings));
  }, [settings]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  const sendMessage = async (type: 'text' | 'image', prompt: string) => {
    if (!prompt.trim() && selectedFiles.length === 0) return;

    const timestamp = new Date().toISOString();
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      timestamp,
      files: selectedFiles.length > 0 ? selectedFiles : undefined,
      model: settings.model
    };

    setMessages(prev => [...prev, newMessage]);
    setCurrentMessage('');
    const filesToSend = [...selectedFiles];
    setSelectedFiles([]);
    setIsLoading(true);

    try {
      if (type === 'text') {
        await sendTextRequest(prompt, filesToSend);
      } else if (type === 'image') {
        await sendImageRequest(prompt, filesToSend);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTextRequest = async (prompt: string, files: File[] = []) => {
    try {
      // Process files and extract their content
      const processedFiles = await Promise.all(files.map(async (file) => {
        const fileType = file.type;
        let content = '';

        if (fileType.startsWith('text/') || fileType === 'application/json') {
          // For text files, read the content
          content = await file.text();
        } else if (fileType.startsWith('image/')) {
          // For images, convert to base64 and note it's an image
          const base64 = await fileToBase64(file);
          content = `[Image: ${file.name}, type: ${fileType}, size: ${formatFileSize(file.size)}]`;
        } else {
          // For other files, just note the file info
          content = `[File: ${file.name}, type: ${fileType}, size: ${formatFileSize(file.size)}]`;
        }

        return {
          name: file.name,
          type: fileType,
          size: file.size,
          content: content,
          base64: fileType.startsWith('image/') ? await fileToBase64(file) : undefined
        };
      }));

      // Build enhanced prompt with file information
      let enhancedPrompt = prompt;
      if (processedFiles.length > 0) {
        enhancedPrompt += '\n\n--- ATTACHED FILES ---\n';
        processedFiles.forEach((file, index) => {
          enhancedPrompt += `\n${index + 1}. ${file.name} (${file.type}, ${formatFileSize(file.size)})\n`;
          if (file.content && !file.type.startsWith('image/')) {
            enhancedPrompt += `Content:\n${file.content}\n`;
          }
        });
        enhancedPrompt += '\n--- END OF FILES ---';
      }

      // Get the selected API configuration
      const selectedApiConfig = allApis.find(api => api.id === selectedApi);
      
      // Use our API route for text generation with selected API
      const response = await fetch('/api/pollinations/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          model: settings.model,
          seed: settings.seed,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          files: processedFiles,
          sessionId: sessionId,
          selectedApi: selectedApi,
          selectedApiConfig: selectedApiConfig,
          customApis: settings.customApis,
          localModels: settings.localModels
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Update sessionId if returned from API
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response || data.text || data.content || 'No response from API',
        timestamp: new Date().toISOString(),
        model: settings.model
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Text generation error:', error);
      throw error;
    }
  };

  const sendImageRequest = async (prompt: string, files: File[] = []) => {
    try {
      // For image generation, check if there's an image file to use as reference
      let imageBase64 = '';
      let enhancedPrompt = prompt;

      if (files.length > 0) {
        const imageFile = files.find(file => file.type.startsWith('image/'));
        if (imageFile) {
          imageBase64 = await fileToBase64(imageFile);
          enhancedPrompt = `Based on the attached image, generate: ${prompt}`;
        }

        // Add file info to prompt
        const fileInfos = files.map(file => 
          `[Attached: ${file.name} (${file.type}, ${formatFileSize(file.size)})]`
        ).join('\n');
        enhancedPrompt += `\n\nAttachments:\n${fileInfos}`;
      }

      // Get the selected API configuration
      const selectedApiConfig = allApis.find(api => api.id === selectedApi);

      // Use our API route for image generation
      const response = await fetch('/api/pollinations/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          model: settings.model,
          seed: settings.seed,
          width: 1024,
          height: 1024,
          referenceImage: imageBase64,
          selectedApi: selectedApi,
          selectedApiConfig: selectedApiConfig,
          customApis: settings.customApis,
          localModels: settings.localModels
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Generated image: ${prompt}`,
        timestamp: new Date().toISOString(),
        imageUrl: data.imageUrl,
        model: settings.model
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Image generation error:', error);
      throw error;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024); // 10MB limit
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const exportChat = () => {
    const exportText = messages.map(m => {
      const timestamp = new Date(m.timestamp).toLocaleString();
      const prefix = m.type === 'user' ? 'User' : 'Assistant';
      return `[${timestamp}] ${prefix}: ${m.content}`;
    }).join('\n\n');

    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const undoLastMessage = () => {
    setMessages(prev => prev.slice(0, -2)); // Remove last user message and assistant response
  };

  const clearChat = () => {
    setMessages([]);
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Message copied to clipboard');
    } catch (error) {
      console.error('Failed to copy message:', error);
      toast.error('Failed to copy message');
    }
  };

  const retryMessage = (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const message = messages[messageIndex];
    if (message.type !== 'user') return;

    // Remove this user message and any assistant responses that came after it
    const messagesToKeep = messages.slice(0, messageIndex);
    setMessages(messagesToKeep);

    // Resend the message
    sendMessage('text', message.content);
  };

  const shuffleModel = () => {
    const randomModel = availableModels[Math.floor(Math.random() * availableModels.length)];
    setSettings(prev => ({ ...prev, model: randomModel }));
  };

  const addCustomApi = () => {
    const newApi = {
      id: Date.now().toString(),
      name: 'New API',
      endpoint: '',
      apiKey: '',
      type: 'text' as const,
      enabled: false
    };
    setSettings(prev => ({
      ...prev,
      customApis: [...prev.customApis, newApi]
    }));
  };

  const updateCustomApi = (id: string, updates: Partial<Settings['customApis'][0]>) => {
    setSettings(prev => ({
      ...prev,
      customApis: prev.customApis.map(api => 
        api.id === id ? { ...api, ...updates } : api
      )
    }));
  };

  const deleteCustomApi = (id: string) => {
    setSettings(prev => ({
      ...prev,
      customApis: prev.customApis.filter(api => api.id !== id)
    }));
  };

  const addLocalModel = () => {
    const newModel = {
      id: Date.now().toString(),
      name: 'New Local Model',
      endpoint: '',
      apiKey: '',
      type: 'text' as const,
      enabled: false
    };
    setSettings(prev => ({
      ...prev,
      localModels: [...prev.localModels, newModel]
    }));
  };

  const updateLocalModel = (id: string, updates: Partial<Settings['localModels'][0]>) => {
    setSettings(prev => ({
      ...prev,
      localModels: prev.localModels.map(model => 
        model.id === id ? { ...model, ...updates } : model
      )
    }));
  };

  const deleteLocalModel = (id: string) => {
    setSettings(prev => ({
      ...prev,
      localModels: prev.localModels.filter(model => model.id !== id)
    }));
  };

  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  return (
    <div className={`min-h-screen bg-background ${getFontSizeClass()} ${settings.reduceMotion ? '' : 'transition-all duration-300'}`}>
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">AI Chat Studio</h1>
              <Badge variant="secondary">{settings.model}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsMemoryOpen(true)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Brain className="h-4 w-4 mr-2" />
                Memory
              </Button>
              <Link href="/pollinations">
                <Button variant="outline" size="sm" className="text-purple-600 hover:text-purple-700">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Image Generator
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={undoLastMessage} disabled={messages.length < 2}>
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={clearChat}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={exportChat}>
                <Download className="h-4 w-4" />
              </Button>
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                  </DialogHeader>
                  <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="general">General</TabsTrigger>
                      <TabsTrigger value="appearance">Appearance</TabsTrigger>
                      <TabsTrigger value="apis">APIs</TabsTrigger>
                      <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="general" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="model">Default Model</Label>
                          <Select value={settings.model} onValueChange={(value) => setSettings(prev => ({ ...prev, model: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableModels.map(model => (
                                <SelectItem key={model} value={model}>{model}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="theme">Theme</Label>
                          <Select value={settings.theme} onValueChange={(value: 'light' | 'dark' | 'system') => setSettings(prev => ({ ...prev, theme: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">Light</SelectItem>
                              <SelectItem value="dark">Dark</SelectItem>
                              <SelectItem value="system">System</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fontSize">Font Size</Label>
                          <Select value={settings.fontSize} onValueChange={(value: 'small' | 'medium' | 'large') => setSettings(prev => ({ ...prev, fontSize: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">Small</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="large">Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="animationSpeed">Animation Speed</Label>
                          <Select value={settings.animationSpeed} onValueChange={(value: 'slow' | 'normal' | 'fast') => setSettings(prev => ({ ...prev, animationSpeed: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="slow">Slow</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="fast">Fast</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="showTimestamps"
                          checked={settings.showTimestamps}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showTimestamps: checked }))}
                        />
                        <Label htmlFor="showTimestamps">Show Timestamps</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="reduceMotion"
                          checked={settings.reduceMotion}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, reduceMotion: checked }))}
                        />
                        <Label htmlFor="reduceMotion">Reduce Motion</Label>
                      </div>
                    </TabsContent>

                    <TabsContent value="appearance" className="space-y-4">
                      <div>
                        <Label htmlFor="chatWidth">Chat Width</Label>
                        <Select value={settings.chatWidth} onValueChange={(value) => setSettings(prev => ({ ...prev, chatWidth: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="800px">800px</SelectItem>
                            <SelectItem value="1000px">1000px</SelectItem>
                            <SelectItem value="1200px">1200px</SelectItem>
                            <SelectItem value="100%">Full Width</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="bubbleShape">Message Bubble Shape</Label>
                        <Select value={settings.bubbleShape} onValueChange={(value: 'rounded' | 'square') => setSettings(prev => ({ ...prev, bubbleShape: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rounded">Rounded</SelectItem>
                            <SelectItem value="square">Square</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>

                    <TabsContent value="apis" className="space-y-4">
                      {/* Built-in API Keys */}
                      <div>
                        <Label className="text-base font-semibold mb-4 block">Built-in API Keys</Label>
                        <div className="space-y-4">
                          <Card>
                            <CardContent className="p-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>OpenAI API Key</Label>
                                  <Input
                                    type="password"
                                    value={settings.apiKeys.openai || ''}
                                    onChange={(e) => setSettings(prev => ({
                                      ...prev,
                                      apiKeys: { ...prev.apiKeys, openai: e.target.value }
                                    }))}
                                    placeholder="sk-..."
                                  />
                                </div>
                                <div>
                                  <Label>Endpoint</Label>
                                  <Input
                                    value="https://api.openai.com/v1/chat/completions"
                                    disabled
                                    className="bg-muted"
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Mistral API Key</Label>
                                  <Input
                                    type="password"
                                    value={settings.apiKeys.mistral || ''}
                                    onChange={(e) => setSettings(prev => ({
                                      ...prev,
                                      apiKeys: { ...prev.apiKeys, mistral: e.target.value }
                                    }))}
                                    placeholder="Enter Mistral API key"
                                  />
                                </div>
                                <div>
                                  <Label>Endpoint</Label>
                                  <Input
                                    value="https://api.mistral.ai/v1/chat/completions"
                                    disabled
                                    className="bg-muted"
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Claude API Key</Label>
                                  <Input
                                    type="password"
                                    value={settings.apiKeys.claude || ''}
                                    onChange={(e) => setSettings(prev => ({
                                      ...prev,
                                      apiKeys: { ...prev.apiKeys, claude: e.target.value }
                                    }))}
                                    placeholder="Enter Claude API key"
                                  />
                                </div>
                                <div>
                                  <Label>Endpoint</Label>
                                  <Input
                                    value="https://api.anthropic.com/v1/messages"
                                    disabled
                                    className="bg-muted"
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Pollinations API Key (optional)</Label>
                                  <Input
                                    type="password"
                                    value={settings.apiKeys.pollinations || ''}
                                    onChange={(e) => setSettings(prev => ({
                                      ...prev,
                                      apiKeys: { ...prev.apiKeys, pollinations: e.target.value }
                                    }))}
                                    placeholder="Enter Pollinations API key if available"
                                  />
                                </div>
                                <div>
                                  <Label>Endpoint</Label>
                                  <Input
                                    value="https://text.pollinations.ai"
                                    disabled
                                    className="bg-muted"
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Label>Custom APIs</Label>
                          <Button size="sm" onClick={addCustomApi}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {settings.customApis.map(api => (
                            <Card key={api.id}>
                              <CardContent className="p-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Name</Label>
                                    <Input
                                      value={api.name}
                                      onChange={(e) => updateCustomApi(api.id, { name: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Endpoint</Label>
                                    <Input
                                      value={api.endpoint}
                                      onChange={(e) => updateCustomApi(api.id, { endpoint: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>API Key (optional)</Label>
                                    <Input
                                      type="password"
                                      value={api.apiKey || ''}
                                      onChange={(e) => updateCustomApi(api.id, { apiKey: e.target.value })}
                                      placeholder="Enter API key if required"
                                    />
                                  </div>
                                  <div>
                                    <Label>Type</Label>
                                    <Select value={api.type} onValueChange={(value: 'text' | 'image' | 'both') => updateCustomApi(api.id, { type: value })}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="text">Text</SelectItem>
                                        <SelectItem value="image">Image</SelectItem>
                                        <SelectItem value="both">Both</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="flex items-center space-x-2 col-span-2">
                                    <Switch
                                      checked={api.enabled}
                                      onCheckedChange={(checked) => updateCustomApi(api.id, { enabled: checked })}
                                    />
                                    <Label>Enabled</Label>
                                    <Button size="sm" variant="destructive" onClick={() => deleteCustomApi(api.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Label>Local Models</Label>
                          <Button size="sm" onClick={addLocalModel}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {settings.localModels.map(model => (
                            <Card key={model.id}>
                              <CardContent className="p-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Name</Label>
                                    <Input
                                      value={model.name}
                                      onChange={(e) => updateLocalModel(model.id, { name: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Endpoint</Label>
                                    <Input
                                      value={model.endpoint}
                                      onChange={(e) => updateLocalModel(model.id, { endpoint: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>API Key (optional)</Label>
                                    <Input
                                      type="password"
                                      value={model.apiKey || ''}
                                      onChange={(e) => updateLocalModel(model.id, { apiKey: e.target.value })}
                                      placeholder="Enter API key if required"
                                    />
                                  </div>
                                  <div>
                                    <Label>Type</Label>
                                    <Select value={model.type} onValueChange={(value: 'text' | 'image') => updateLocalModel(model.id, { type: value })}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="text">Text</SelectItem>
                                        <SelectItem value="image">Image</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="flex items-center space-x-2 col-span-2">
                                    <Switch
                                      checked={model.enabled}
                                      onCheckedChange={(checked) => updateLocalModel(model.id, { enabled: checked })}
                                    />
                                    <Label>Enabled</Label>
                                    <Button size="sm" variant="destructive" onClick={() => deleteLocalModel(model.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="puterEnabled"
                          checked={settings.puterEnabled}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, puterEnabled: checked }))}
                        />
                        <Label htmlFor="puterEnabled">Enable Puter.js Integration</Label>
                      </div>
                    </TabsContent>

                    <TabsContent value="advanced" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="textApiEndpoint">Text API Endpoint</Label>
                          <Input
                            id="textApiEndpoint"
                            value={settings.textApiEndpoint}
                            onChange={(e) => setSettings(prev => ({ ...prev, textApiEndpoint: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="imageApiEndpoint">Image API Endpoint</Label>
                          <Input
                            id="imageApiEndpoint"
                            value={settings.imageApiEndpoint}
                            onChange={(e) => setSettings(prev => ({ ...prev, imageApiEndpoint: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="seed">Seed (optional)</Label>
                          <Input
                            id="seed"
                            value={settings.seed || ''}
                            onChange={(e) => setSettings(prev => ({ ...prev, seed: e.target.value }))}
                            placeholder="Random seed"
                          />
                        </div>
                        <div>
                          <Label htmlFor="temperature">Temperature</Label>
                          <Input
                            id="temperature"
                            type="number"
                            min="0"
                            max="2"
                            step="0.1"
                            value={settings.temperature || 0.7}
                            onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="maxTokens">Max Tokens</Label>
                          <Input
                            id="maxTokens"
                            type="number"
                            min="1"
                            max="4000"
                            value={settings.maxTokens || 1000}
                            onChange={(e) => setSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  {/* Save Button */}
                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={() => {
                      setIsSettingsOpen(false);
                      toast.success('Settings saved successfully');
                    }}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="container mx-auto px-4 py-6">
        <div className="mx-auto" style={{ maxWidth: settings.chatWidth }}>
          {/* Messages */}
          <ScrollArea className="h-[60vh] mb-4 border rounded-lg p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg group relative ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    } ${settings.bubbleShape === 'square' ? 'rounded-none' : ''}`}
                  >
                    {settings.showTimestamps && (
                      <div className="text-xs opacity-70 mb-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                        {message.model && ` • ${message.model}`}
                      </div>
                    )}
                    {message.type === 'user' ? (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    ) : (
                      <StructuredResponse content={message.content} />
                    )}
                    {message.imageUrl && (
                      <img
                        src={message.imageUrl}
                        alt="Generated"
                        className="mt-2 rounded-lg max-w-full h-auto"
                      />
                    )}
                    {message.files && message.files.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.files.map((file, index) => (
                          <div key={index} className="text-xs opacity-70">
                            📎 {file.name}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className={`flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyMessage(message.content)}
                        className="h-6 w-6 p-0 hover:bg-background/20"
                        title="Copy message"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      {message.type === 'user' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => retryMessage(message.id)}
                          className="h-6 w-6 p-0 hover:bg-background/20"
                          title="Retry message"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <Card>
            <CardContent className="p-4">
              {/* API Selector */}
              <div className="mb-4">
                <ApiSelector
                  selectedApi={selectedApi}
                  onApiChange={setSelectedApi}
                  customApis={settings.customApis}
                  localModels={settings.localModels}
                  onUpdateCustomApis={(apis) => setSettings(prev => ({ ...prev, customApis: apis }))}
                  onUpdateLocalModels={(models) => setSettings(prev => ({ ...prev, localModels: models }))}
                />
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant={isImageMode ? "outline" : "default"}
                    size="sm"
                    onClick={() => setIsImageMode(false)}
                  >
                    <Type className="h-4 w-4" />
                    Text
                  </Button>
                  <Button
                    variant={isImageMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsImageMode(true)}
                  >
                    <ImageIcon className="h-4 w-4" />
                    Image
                  </Button>
                </div>
              </div>

              {/* File Attachments */}
              {selectedFiles.length > 0 && (
                <div className="mb-4 p-2 bg-muted rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-background px-2 py-1 rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept="*/*"
                />
                {isImageMode ? (
                  <Input
                    placeholder="Describe the image you want to generate..."
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage('image', imagePrompt)}
                  />
                ) : (
                  <Textarea
                    placeholder="Type your message here..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage('text', currentMessage);
                      }
                    }}
                    rows={3}
                  />
                )}
                <Button
                  onClick={() => sendMessage(isImageMode ? 'image' : 'text', isImageMode ? imagePrompt : currentMessage)}
                  disabled={isLoading || (!currentMessage.trim() && !imagePrompt.trim() && selectedFiles.length === 0)}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Memory Manager Dialog */}
      <Dialog open={isMemoryOpen} onOpenChange={setIsMemoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Memory Manager</DialogTitle>
          </DialogHeader>
          <MemoryManager 
            sessionId={sessionId} 
            onSessionChange={setSessionId}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}