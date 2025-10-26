'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  Server, 
  Zap, 
  Settings, 
  Plus, 
  Trash2, 
  Edit, 
  X,
  Check,
  AlertCircle,
  Database,
  Cloud,
  Router
} from 'lucide-react';
import { Save as SaveIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ApiEndpoint {
  id: string;
  name: string;
  endpoint: string;
  apiKey?: string;
  type: 'text' | 'image' | 'both';
  enabled: boolean;
  isCustom?: boolean;
  isLocal?: boolean;
  description?: string;
  model?: string;
}

interface ApiSelectorProps {
  selectedApi: string;
  onApiChange: (apiId: string) => void;
  customApis: ApiEndpoint[];
  localModels: ApiEndpoint[];
  onUpdateCustomApis: (apis: ApiEndpoint[]) => void;
  onUpdateLocalModels: (models: ApiEndpoint[]) => void;
}

const defaultApis: ApiEndpoint[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    type: 'text',
    enabled: true,
    description: 'OpenAI GPT models',
    model: 'gpt-3.5-turbo'
  },
  {
    id: 'pollinations',
    name: 'Pollinations',
    endpoint: 'https://text.pollinations.ai',
    type: 'both',
    enabled: true,
    description: 'Free AI text and image generation',
    model: 'openai'
  },
  {
    id: 'mistral',
    name: 'Mistral',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    type: 'text',
    enabled: true,
    description: 'Mistral AI models',
    model: 'mistral-tiny'
  },
  {
    id: 'claude',
    name: 'Claude',
    endpoint: 'https://api.anthropic.com/v1/messages',
    type: 'text',
    enabled: true,
    description: 'Anthropic Claude models',
    model: 'claude-3-haiku-20240307'
  }
];

export function ApiSelector({ 
  selectedApi, 
  onApiChange, 
  customApis, 
  localModels, 
  onUpdateCustomApis,
  onUpdateLocalModels 
}: ApiSelectorProps) {
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [editingApi, setEditingApi] = useState<ApiEndpoint | null>(null);
  const [activeTab, setActiveTab] = useState('default');

  const allApis = [...defaultApis, ...customApis, ...localModels];
  const currentApi = allApis.find(api => api.id === selectedApi) || defaultApis[0];

  const addCustomApi = () => {
    const newApi: ApiEndpoint = {
      id: `custom_${Date.now()}`,
      name: 'New Custom API',
      endpoint: '',
      type: 'text',
      enabled: true,
      isCustom: true,
      description: 'Custom API endpoint'
    };
    setEditingApi(newApi);
  };

  const addLocalModel = () => {
    const newModel: ApiEndpoint = {
      id: `local_${Date.now()}`,
      name: 'New Local Model',
      endpoint: 'http://localhost:8080',
      type: 'text',
      enabled: true,
      isLocal: true,
      description: 'Local AI model'
    };
    setEditingApi(newModel);
  };

  const saveApi = () => {
    if (!editingApi) return;

    if (editingApi.isCustom) {
      const existingIndex = customApis.findIndex(api => api.id === editingApi.id);
      let updatedApis;
      
      if (existingIndex >= 0) {
        updatedApis = customApis.map((api, index) => 
          index === existingIndex ? editingApi : api
        );
      } else {
        updatedApis = [...customApis, editingApi];
      }
      
      onUpdateCustomApis(updatedApis);
      toast.success('Custom API saved successfully');
    } else if (editingApi.isLocal) {
      const existingIndex = localModels.findIndex(api => api.id === editingApi.id);
      let updatedModels;
      
      if (existingIndex >= 0) {
        updatedModels = localModels.map((api, index) => 
          index === existingIndex ? editingApi : api
        );
      } else {
        updatedModels = [...localModels, editingApi];
      }
      
      onUpdateLocalModels(updatedModels);
      toast.success('Local model saved successfully');
    } else {
      // Default API - save to custom APIs with a special prefix
      const defaultApi = {
        ...editingApi,
        id: editingApi.id.startsWith('default_') ? editingApi.id : `default_${editingApi.id}`,
        isCustom: true
      };
      
      const existingIndex = customApis.findIndex(api => api.id === defaultApi.id);
      let updatedApis;
      
      if (existingIndex >= 0) {
        updatedApis = customApis.map((api, index) => 
          index === existingIndex ? defaultApi : api
        );
      } else {
        updatedApis = [...customApis, defaultApi];
      }
      
      onUpdateCustomApis(updatedApis);
      toast.success('Default API saved successfully');
    }

    setEditingApi(null);
  };

  const deleteApi = (apiId: string, isCustom: boolean, isLocal: boolean) => {
    if (isCustom) {
      onUpdateCustomApis(customApis.filter(api => api.id !== apiId));
      toast.success('Custom API deleted');
    } else if (isLocal) {
      onUpdateLocalModels(localModels.filter(api => api.id !== apiId));
      toast.success('Local model deleted');
    }
  };

  const getApiIcon = (api: ApiEndpoint) => {
    if (api.isLocal) return <Database className="h-4 w-4" />;
    if (api.isCustom) return <Router className="h-4 w-4" />;
    return <Cloud className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'image': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'both': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Current API Selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Current API</CardTitle>
            <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage APIs
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Select value={selectedApi} onValueChange={onApiChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select an API">
                <div className="flex items-center gap-2">
                  {getApiIcon(currentApi)}
                  <span>{currentApi.name}</span>
                  <Badge className={getTypeColor(currentApi.type)}>
                    {currentApi.type}
                  </Badge>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {allApis.map(api => (
                <SelectItem key={api.id} value={api.id}>
                  <div className="flex items-center gap-2">
                    {getApiIcon(api)}
                    <span>{api.name}</span>
                    <Badge className={getTypeColor(api.type)}>
                      {api.type}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {currentApi.description && (
            <p className="text-xs text-muted-foreground mt-2">
              {currentApi.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* API Management Dialog */}
      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage APIs</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="default">Default APIs</TabsTrigger>
              <TabsTrigger value="custom">Custom APIs</TabsTrigger>
              <TabsTrigger value="local">Local Models</TabsTrigger>
            </TabsList>

            <TabsContent value="default" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Default APIs</h3>
                <Button onClick={() => setEditingApi({
                  id: 'default_new',
                  name: 'New Default API',
                  endpoint: '',
                  type: 'text',
                  enabled: true,
                  description: 'Default API endpoint'
                })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Default API
                </Button>
              </div>

              {editingApi && !editingApi.isCustom && !editingApi.isLocal && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {editingApi.id.startsWith('default_') ? 'Add New Default API' : 'Edit Default API'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={editingApi.name}
                          onChange={(e) => setEditingApi({ ...editingApi, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={editingApi.type}
                          onValueChange={(value: 'text' | 'image' | 'both') => 
                            setEditingApi({ ...editingApi, type: value })
                          }
                        >
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
                    </div>
                    <div>
                      <Label>Endpoint</Label>
                      <Input
                        value={editingApi.endpoint}
                        onChange={(e) => setEditingApi({ ...editingApi, endpoint: e.target.value })}
                        placeholder="https://api.example.com/v1/chat"
                      />
                    </div>
                    <div>
                      <Label>API Key (optional)</Label>
                      <Input
                        type="password"
                        value={editingApi.apiKey || ''}
                        onChange={(e) => setEditingApi({ ...editingApi, apiKey: e.target.value })}
                        placeholder="Enter API key if required"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={editingApi.description || ''}
                        onChange={(e) => setEditingApi({ ...editingApi, description: e.target.value })}
                        placeholder="API description"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveApi}>
                        <SaveIcon className="h-4 w-4 mr-2" />
                        SaveIcon
                      </Button>
                      <Button variant="outline" onClick={() => setEditingApi(null)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4">
                {defaultApis.map(api => (
                  <Card key={api.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getApiIcon(api)}
                          <div>
                            <h4 className="font-medium">{api.name}</h4>
                            <p className="text-sm text-muted-foreground">{api.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">{api.endpoint}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getTypeColor(api.type)}>
                            {api.type}
                          </Badge>
                          <Switch
                            checked={api.enabled}
                            onCheckedChange={(enabled) => {
                              // Update default API enabled state
                              toast.success(`${api.name} ${enabled ? 'enabled' : 'disabled'}`);
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingApi(api)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Custom APIs</h3>
                <Button onClick={addCustomApi}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom API
                </Button>
              </div>

              {editingApi?.isCustom && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {editingApi.id.startsWith('custom_') ? 'Add New API' : 'Edit API'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={editingApi.name}
                          onChange={(e) => setEditingApi({ ...editingApi, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={editingApi.type}
                          onValueChange={(value: 'text' | 'image' | 'both') => 
                            setEditingApi({ ...editingApi, type: value })
                          }
                        >
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
                    </div>
                    <div>
                      <Label>Endpoint</Label>
                      <Input
                        value={editingApi.endpoint}
                        onChange={(e) => setEditingApi({ ...editingApi, endpoint: e.target.value })}
                        placeholder="https://api.example.com/v1/chat"
                      />
                    </div>
                    <div>
                      <Label>API Key (optional)</Label>
                      <Input
                        type="password"
                        value={editingApi.apiKey || ''}
                        onChange={(e) => setEditingApi({ ...editingApi, apiKey: e.target.value })}
                        placeholder="Enter API key if required"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={editingApi.description || ''}
                        onChange={(e) => setEditingApi({ ...editingApi, description: e.target.value })}
                        placeholder="API description"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveApi}>
                        <SaveIcon className="h-4 w-4 mr-2" />
                        SaveIcon
                      </Button>
                      <Button variant="outline" onClick={() => setEditingApi(null)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4">
                {customApis.map(api => (
                  <Card key={api.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getApiIcon(api)}
                          <div>
                            <h4 className="font-medium">{api.name}</h4>
                            <p className="text-sm text-muted-foreground">{api.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">{api.endpoint}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getTypeColor(api.type)}>
                            {api.type}
                          </Badge>
                          <Switch
                            checked={api.enabled}
                            onCheckedChange={(enabled) => {
                              onUpdateCustomApis(customApis.map(a => 
                                a.id === api.id ? { ...a, enabled } : a
                              ));
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingApi(api)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteApi(api.id, true, false)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="local" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Local Models</h3>
                <Button onClick={addLocalModel}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Local Model
                </Button>
              </div>

              {editingApi?.isLocal && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {editingApi.id.startsWith('local_') ? 'Add New Model' : 'Edit Model'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={editingApi.name}
                          onChange={(e) => setEditingApi({ ...editingApi, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={editingApi.type}
                          onValueChange={(value: 'text' | 'image' | 'both') => 
                            setEditingApi({ ...editingApi, type: value })
                          }
                        >
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
                    </div>
                    <div>
                      <Label>Endpoint</Label>
                      <Input
                        value={editingApi.endpoint}
                        onChange={(e) => setEditingApi({ ...editingApi, endpoint: e.target.value })}
                        placeholder="http://localhost:8080"
                      />
                    </div>
                    <div>
                      <Label>API Key (optional)</Label>
                      <Input
                        type="password"
                        value={editingApi.apiKey || ''}
                        onChange={(e) => setEditingApi({ ...editingApi, apiKey: e.target.value })}
                        placeholder="Enter API key if required"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={editingApi.description || ''}
                        onChange={(e) => setEditingApi({ ...editingApi, description: e.target.value })}
                        placeholder="Model description"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveApi}>
                        <SaveIcon className="h-4 w-4 mr-2" />
                        SaveIcon
                      </Button>
                      <Button variant="outline" onClick={() => setEditingApi(null)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4">
                {localModels.map(api => (
                  <Card key={api.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getApiIcon(api)}
                          <div>
                            <h4 className="font-medium">{api.name}</h4>
                            <p className="text-sm text-muted-foreground">{api.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">{api.endpoint}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getTypeColor(api.type)}>
                            {api.type}
                          </Badge>
                          <Switch
                            checked={api.enabled}
                            onCheckedChange={(enabled) => {
                              onUpdateLocalModels(localModels.map(a => 
                                a.id === api.id ? { ...a, enabled } : a
                              ));
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingApi(api)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteApi(api.id, false, true)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}