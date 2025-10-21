'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  ArrowLeft, 
  User, 
  Bot, 
  Zap, 
  Shield,
  LogOut,
  Trash2
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { AIModel, ModelsResponse } from '@/lib/types';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [models, setModels] = useState<AIModel[]>([]);
  const [defaultModel, setDefaultModel] = useState<string>('');
  const [settings, setSettings] = useState({
    selectedModel: '',
    temperature: [0.7],
    maxTokens: [2048],
    includeMemory: true,
    streamResponses: true
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadModels();
    }
  }, [isAuthenticated]);

  const loadModels = async () => {
    try {
      const modelsData: ModelsResponse = await apiClient.getModels();
      setModels(modelsData.models);
      setDefaultModel(modelsData.default);
      setSettings(prev => ({
        ...prev,
        selectedModel: modelsData.default
      }));
    } catch (error) {
      toast.error('Failed to load AI models');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const saveSettings = () => {
    // In a real app, you'd save these to localStorage or user preferences
    localStorage.setItem('aiSettings', JSON.stringify(settings));
    toast.success('Settings saved successfully');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/chat')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Settings className="h-8 w-8 mr-3 text-indigo-600" />
              Settings
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your account and AI preferences
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* User Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                User Profile
              </CardTitle>
              <CardDescription>
                Your account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={user?.name || ''} disabled />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email || ''} disabled />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Edit Profile
                </Button>
                <Button variant="outline" size="sm">
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Model Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="h-5 w-5 mr-2" />
                AI Model Settings
              </CardTitle>
              <CardDescription>
                Configure AI behavior and model preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="model">AI Model</Label>
                <Select
                  value={settings.selectedModel}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, selectedModel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{model.name}</span>
                          {model.id === defaultModel && (
                            <Badge variant="secondary" className="ml-2">Default</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {settings.selectedModel && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    {(() => {
                      const selectedModel = models.find(m => m.id === settings.selectedModel);
                      return selectedModel ? (
                        <div>
                          <p className="text-sm font-medium">{selectedModel.name}</p>
                          <p className="text-xs text-gray-600 mt-1">{selectedModel.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Max Tokens: {selectedModel.maxTokens.toLocaleString()}</span>
                            <span>Pricing: {selectedModel.pricing}</span>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>

              <div>
                <Label>Temperature: {settings.temperature[0]}</Label>
                <p className="text-sm text-gray-600 mb-2">
                  Controls randomness. Lower values are more focused, higher values are more creative.
                </p>
                <Slider
                  value={settings.temperature}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, temperature: value }))}
                  max={2}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div>
                <Label>Max Tokens: {settings.maxTokens[0]}</Label>
                <p className="text-sm text-gray-600 mb-2">
                  Maximum length of the AI response.
                </p>
                <Slider
                  value={settings.maxTokens}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, maxTokens: value }))}
                  max={4096}
                  min={256}
                  step={256}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Chat Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Chat Settings
              </CardTitle>
              <CardDescription>
                Customize your chat experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="memory">Include Memory</Label>
                  <p className="text-sm text-gray-600">
                    Allow AI to access and use persistent memory in conversations
                  </p>
                </div>
                <Switch
                  id="memory"
                  checked={settings.includeMemory}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includeMemory: checked }))}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="streaming">Stream Responses</Label>
                  <p className="text-sm text-gray-600">
                    Show AI responses as they are generated (real-time typing effect)
                  </p>
                </div>
                <Switch
                  id="streaming"
                  checked={settings.streamResponses}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, streamResponses: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security
              </CardTitle>
              <CardDescription>
                Manage your account security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Active Sessions</p>
                  <p className="text-sm text-gray-600">
                    Manage your active login sessions
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  View Sessions
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Data Export</p>
                  <p className="text-sm text-gray-600">
                    Download your conversations and memories
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <Button onClick={saveSettings} className="bg-indigo-600 hover:bg-indigo-700">
                  Save Settings
                </Button>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="text-gray-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
