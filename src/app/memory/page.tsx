'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Tag
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Memory, CreateMemoryRequest, SearchMemoryRequest } from '@/lib/types';
import { toast } from 'sonner';

export default function MemoryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newMemory, setNewMemory] = useState({
    content: '',
    memoryType: 'FACT' as 'CONVERSATION' | 'FACT' | 'PREFERENCE' | 'SKILL',
    metadata: {}
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadMemories();
    }
  }, [isAuthenticated]);

  const loadMemories = async () => {
    try {
      const memoriesData = await apiClient.getMemories();
      setMemories(memoriesData);
    } catch (error) {
      toast.error('Failed to load memories');
    }
  };

  const searchMemories = async () => {
    if (!searchQuery.trim()) {
      loadMemories();
      return;
    }

    setIsSearching(true);
    try {
      const searchRequest: SearchMemoryRequest = {
        query: searchQuery,
        limit: 50
      };
      const results = await apiClient.searchMemories(searchRequest);
      setMemories(results);
    } catch (error) {
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
      const createRequest: CreateMemoryRequest = {
        content: newMemory.content,
        memoryType: newMemory.memoryType,
        metadata: newMemory.metadata
      };
      
      const createdMemory = await apiClient.createMemory(createRequest);
      setMemories(prev => [createdMemory, ...prev]);
      setNewMemory({ content: '', memoryType: 'FACT', metadata: {} });
      setShowCreateDialog(false);
      toast.success('Memory created successfully');
    } catch (error) {
      toast.error('Failed to create memory');
    }
  };

  const deleteMemory = async (memoryId: string) => {
    try {
      await apiClient.deleteMemory(memoryId);
      setMemories(prev => prev.filter(m => m.id !== memoryId));
      toast.success('Memory deleted successfully');
    } catch (error) {
      toast.error('Failed to delete memory');
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
                Memory Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your AI agent's persistent memory
              </p>
            </div>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Memory
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Memory</DialogTitle>
                <DialogDescription>
                  Add a new memory that the AI agent will remember across conversations.
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
                  <Label htmlFor="memoryType">Type</Label>
                  <select
                    id="memoryType"
                    value={newMemory.memoryType}
                    onChange={(e) => setNewMemory(prev => ({ ...prev, memoryType: e.target.value as 'CONVERSATION' | 'FACT' | 'PREFERENCE' | 'SKILL' }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="FACT">Fact</option>
                    <option value="PREFERENCE">Preference</option>
                    <option value="SKILL">Skill</option>
                    <option value="CONVERSATION">Conversation</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createMemory}>
                  Create Memory
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search memories..."
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
                    loadMemories();
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Memories List */}
        <div className="grid gap-4">
          {memories.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'No memories found' : 'No memories yet'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Create your first memory to help the AI agent remember important information'
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Memory
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            memories.map((memory) => (
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMemory(memory.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
            ))
          )}
        </div>

        {/* Stats */}
        {memories.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            Showing {memories.length} {memories.length === 1 ? 'memory' : 'memories'}
            {searchQuery && ` for "${searchQuery}"`}
          </div>
        )}
      </div>
    </div>
  );
}
