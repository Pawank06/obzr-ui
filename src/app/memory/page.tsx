'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Brain, 
  Plus, 
  Search, 
  Trash2, 
  ArrowLeft,
  Calendar,
  Tag,
  BarChart3,
  Database,
  Zap,
  RefreshCw,
  TrendingUp,
  Activity,
  Layers,
  Archive
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { 
  Memory, 
  MemoryV2StoreRequest,
  MemoryV2QueryRequest,
  MemoryContext,
  MemoryStats,
  MemoryHealthStatus
} from '@/lib/types';
import { toast } from 'sonner';

export default function MemoryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  
  // Legacy memories for backward compatibility
  const [memories, setMemories] = useState<Memory[]>([]);
  
  // New memory system state
  const [memoryContexts, setMemoryContexts] = useState<MemoryContext[]>([]);
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [memoryHealth, setMemoryHealth] = useState<MemoryHealthStatus | null>(null);
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  
  // Form state
  const [newMemory, setNewMemory] = useState({
    content: '',
    type: 'episodic' as 'episodic' | 'semantic' | 'procedural',
    tags: [] as string[],
    explicitSave: false,
    bypassSTM: false
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setIsLoading2(true);
    try {
      // Load both legacy and new memory data
      const [memoriesData, statsData, healthData] = await Promise.all([
        apiClient.getMemories().catch(() => []),
        apiClient.getMemoryStats().catch(() => null),
        apiClient.getMemoryHealth().catch(() => null)
      ]);
      
      setMemories(memoriesData);
      setMemoryStats(statsData);
      setMemoryHealth(healthData);
    } catch {
      toast.error('Failed to load memory data');
    } finally {
      setIsLoading2(false);
    }
  };

  const searchMemories = async () => {
    if (!searchQuery.trim()) {
      loadData();
      return;
    }

    setIsSearching(true);
    try {
      // Use new memory system for search
      const queryRequest: MemoryV2QueryRequest = {
        query: searchQuery,
        limit: 50,
        hybridSearch: true,
        includeFactors: true
      };
      
      const results = await apiClient.queryMemoriesV2(queryRequest);
      setMemoryContexts(results.memories);
      
      // Also search legacy memories for backward compatibility
      const legacyResults = await apiClient.searchMemories({
        query: searchQuery,
        limit: 50
      }).catch(() => []);
      setMemories(legacyResults);
      
    } catch {
      toast.error('Failed to search memories');
    } finally {
      setIsSearching(false);
    }
  };

  const createMemory = async () => {
    if (!newMemory.content.trim()) {
      toast.error('Memory content is required');
      return;
    }

    try {
      const storeRequest: MemoryV2StoreRequest = {
        content: newMemory.content,
        type: newMemory.type,
        tags: newMemory.tags,
        explicitSave: newMemory.explicitSave,
        bypassSTM: newMemory.bypassSTM
      };
      
      await apiClient.storeMemoryV2(storeRequest);
      setNewMemory({ 
        content: '', 
        type: 'episodic', 
        tags: [], 
        explicitSave: false, 
        bypassSTM: false 
      });
      setShowCreateDialog(false);
      toast.success('Memory stored successfully');
      
      // Reload data to show new memory
      loadData();
    } catch {
      toast.error('Failed to store memory');
    }
  };

  const promoteMemories = async () => {
    setIsLoading2(true);
    try {
      const result = await apiClient.promoteMemories();
      toast.success(`Promoted ${result.promoted} memories to long-term storage`);
      loadData();
    } catch {
      toast.error('Failed to promote memories');
    } finally {
      setIsLoading2(false);
    }
  };

  const consolidateMemories = async () => {
    setIsLoading2(true);
    try {
      const result = await apiClient.consolidateMemories();
      toast.success(`Consolidated ${result.clustersFound} memory clusters`);
      loadData();
    } catch {
      toast.error('Failed to consolidate memories');
    } finally {
      setIsLoading2(false);
    }
  };

  const clearMemories = async (type: 'stm' | 'ltm' | 'cache') => {
    setIsLoading2(true);
    try {
      const result = await apiClient.clearMemories(type);
      toast.success(`Cleared ${result.cleared} ${type.toUpperCase()} memories`);
      loadData();
    } catch {
      toast.error(`Failed to clear ${type.toUpperCase()} memories`);
    } finally {
      setIsLoading2(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchMemories();
    }
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/chat')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chat
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Brain className="h-8 w-8 mr-3 text-indigo-600" />
                Advanced Memory System
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your AI agent&apos;s intelligent memory with STM/LTM architecture
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={promoteMemories} disabled={isLoading2}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Promote STM
            </Button>
            <Button variant="outline" onClick={consolidateMemories} disabled={isLoading2}>
              <Archive className="h-4 w-4 mr-2" />
              Consolidate
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Store Memory
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Store New Memory</DialogTitle>
                  <DialogDescription>
                    Add a new memory using the advanced memory system with STM/LTM architecture.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Enter the memory content..."
                      value={newMemory.content}
                      onChange={(e) => setNewMemory(prev => ({ ...prev, content: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Memory Type</Label>
                    <select
                      id="type"
                      value={newMemory.type}
                      onChange={(e) => setNewMemory(prev => ({ ...prev, type: e.target.value as 'episodic' | 'semantic' | 'procedural' }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="episodic">Episodic (Events & Experiences)</option>
                      <option value="semantic">Semantic (Facts & Knowledge)</option>
                      <option value="procedural">Procedural (Skills & Processes)</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      placeholder="tag1, tag2, tag3"
                      value={newMemory.tags.join(', ')}
                      onChange={(e) => setNewMemory(prev => ({ 
                        ...prev, 
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                      }))}
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="explicitSave"
                        checked={newMemory.explicitSave}
                        onChange={(e) => setNewMemory(prev => ({ ...prev, explicitSave: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="explicitSave" className="text-sm">Explicit Save</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="bypassSTM"
                        checked={newMemory.bypassSTM}
                        onChange={(e) => setNewMemory(prev => ({ ...prev, bypassSTM: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="bypassSTM" className="text-sm">Bypass STM</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createMemory}>
                    Store Memory
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Health Status */}
        {memoryHealth && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Memory System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    memoryHealth.status === 'healthy' ? 'bg-green-100 text-green-800' :
                    memoryHealth.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {memoryHealth.status}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Overall Status</p>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${memoryHealth.services.redis ? 'text-green-600' : 'text-red-600'}`}>
                    {memoryHealth.services.redis ? '✓' : '✗'}
                  </div>
                  <p className="text-sm text-gray-500">Redis</p>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${memoryHealth.services.memory ? 'text-green-600' : 'text-red-600'}`}>
                    {memoryHealth.services.memory ? '✓' : '✗'}
                  </div>
                  <p className="text-sm text-gray-500">Memory</p>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${memoryHealth.services.cache ? 'text-green-600' : 'text-red-600'}`}>
                    {memoryHealth.services.cache ? '✓' : '✗'}
                  </div>
                  <p className="text-sm text-gray-500">Cache</p>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${memoryHealth.services.telemetry ? 'text-green-600' : 'text-red-600'}`}>
                    {memoryHealth.services.telemetry ? '✓' : '✗'}
                  </div>
                  <p className="text-sm text-gray-500">Telemetry</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Memory Statistics */}
        {memoryStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Short-Term Memory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Items:</span>
                    <span className="font-semibold">{memoryStats.memory.stm.totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Avg Importance:</span>
                    <span className="font-semibold">{memoryStats.memory.stm.averageImportance.toFixed(2)}</span>
                  </div>
                  {Object.entries(memoryStats.memory.stm.itemsByType).map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span className="text-sm text-gray-500">{type}:</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Long-Term Memory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Memories:</span>
                    <span className="font-semibold">{memoryStats.memory.ltm.totalMemories}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Avg Importance:</span>
                    <span className="font-semibold">
                      {memoryStats.memory.ltm.memoriesByType.length > 0 
                        ? (memoryStats.memory.ltm.memoriesByType.reduce((sum, item) => sum + item.avgImportance, 0) / memoryStats.memory.ltm.memoriesByType.length).toFixed(2)
                        : '0.00'
                      }
                    </span>
                  </div>
                  {memoryStats.memory.ltm.memoriesByType.map((item) => (
                    <div key={item.memoryType} className="flex justify-between">
                      <span className="text-sm text-gray-500">{item.memoryType}:</span>
                      <span className="font-semibold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Cache Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Entries:</span>
                    <span className="font-semibold">{memoryStats.cache.totalEntries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Hit Rate:</span>
                    <span className="font-semibold">{(memoryStats.cache.hitRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Avg Response:</span>
                    <span className="font-semibold">{memoryStats.cache.avgResponseTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Queries:</span>
                    <span className="font-semibold">{memoryStats.telemetry.totalQueries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Error Rate:</span>
                    <span className="font-semibold">{(memoryStats.telemetry.errorRate * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search memories with hybrid retrieval..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                />
              </div>
              <Button onClick={searchMemories} disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    loadData();
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Memory Contexts (New System Results) */}
        {memoryContexts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Layers className="h-5 w-5 mr-2" />
              Memory Context Results
            </h3>
            <div className="grid gap-4">
              {memoryContexts.map((context) => (
                <Card key={context.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          <Tag className="h-3 w-3 mr-1" />
                          {context.type}
                        </Badge>
                        <Badge variant="outline">
                          {context.source.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-500 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(context.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          Relevance: {(context.relevanceScore * 100).toFixed(1)}%
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Importance: {context.importance.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-900 whitespace-pre-wrap">{context.content}</p>
                    {context.metadata && Object.keys(context.metadata).length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-500 mb-2">Metadata:</p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(context.metadata).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {String(value)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Legacy Memories */}
        {memories.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Brain className="h-5 w-5 mr-2" />
              Legacy Memories
            </h3>
            <div className="grid gap-4">
              {memories.map((memory) => (
                <Card key={memory.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          <Tag className="h-3 w-3 mr-1" />
                          {memory.memoryType}
                        </Badge>
                        <span className="text-sm text-gray-500 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(memory.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-900 whitespace-pre-wrap">{memory.content}</p>
                    {memory.metadata && Object.keys(memory.metadata).length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-500 mb-2">Metadata:</p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(memory.metadata).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {String(value)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {memories.length === 0 && memoryContexts.length === 0 && !searchQuery && (
          <Card>
            <CardContent className="p-8 text-center">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No memories yet
              </h3>
              <p className="text-gray-500 mb-4">
                Create your first memory to help the AI agent remember important information
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Store Memory
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Management Actions */}
        <div className="mt-8 flex justify-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => clearMemories('stm')}
            disabled={isLoading2}
            className="text-orange-600 hover:text-orange-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear STM
          </Button>
          <Button 
            variant="outline" 
            onClick={() => clearMemories('cache')}
            disabled={isLoading2}
            className="text-blue-600 hover:text-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
          <Button 
            variant="outline" 
            onClick={() => clearMemories('ltm')}
            disabled={isLoading2}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear LTM
          </Button>
        </div>
      </div>
    </div>
  );
}
