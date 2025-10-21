'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Send, 
  Plus, 
  Settings, 
  Brain, 
  MessageSquare, 
  User, 
  Bot,
  Sidebar,
  X,
  ArrowLeft
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Session, Message, ChatRequest } from '@/lib/types';
import { toast } from 'sonner';

export default function SessionChatPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { isAuthenticated, isLoading } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = useCallback(async () => {
    try {
      console.log('Loading sessions...');
      const sessionsData = await apiClient.getSessions();
      console.log('Sessions loaded:', sessionsData);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast.error('Failed to load sessions');
    }
  }, []);

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      setSessionLoading(true);
      console.log('Loading session:', sessionId);
      const session = await apiClient.getSession(sessionId);
      console.log('Session loaded:', session);
      setCurrentSession(session);
      
      // Load messages for this session
      console.log('Loading messages for session:', sessionId);
      const messagesData = await apiClient.getSessionMessages(sessionId);
      console.log('Messages loaded:', messagesData);
      setMessages(messagesData.messages || []);
    } catch (error) {
      console.error('Failed to load session:', error);
      toast.error('Session not found');
      router.push('/chat');
    } finally {
      setSessionLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadSessions();
    }
  }, [isAuthenticated, loadSessions]);

  useEffect(() => {
    if (isAuthenticated && sessionId) {
      loadSession(sessionId);
    }
  }, [isAuthenticated, sessionId, loadSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createNewSession = async () => {
    try {
      const newSession = await apiClient.createSession({
        title: 'New Conversation'
      });
      setSessions(prev => [newSession, ...prev]);
      router.push(`/chat/${newSession.id}`);
    } catch {
      toast.error('Failed to create new session');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || isTyping) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);

    try {
      const chatRequest: ChatRequest = {
        message: messageText,
        options: {
          includeMemory: true
        }
      };

      const response = await apiClient.sendMessage(currentSession.id, chatRequest);
      
      // Add both user and assistant messages
      setMessages(prev => [
        ...(prev || []),
        response.userMessage,
        response.assistantMessage
      ]);

      // Update session title if it's the first message
      if (messages && messages.length === 0) {
        try {
          const newTitle = await apiClient.generateTitle(currentSession.id);
          setCurrentSession(prev => prev ? { ...prev, title: newTitle } : null);
          setSessions(prev => 
            prev.map(s => s.id === currentSession.id ? { ...s, title: newTitle } : s)
          );
        } catch {
          // Silently fail title generation
        }
      }
    } catch {
      toast.error('Failed to send message');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading || sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Session not found</h2>
          <p className="text-gray-600 mb-4">The requested chat session could not be found.</p>
          <Button onClick={() => router.push('/chat')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Button onClick={createNewSession} className="w-full mb-4">
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>

          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="space-y-2">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                    currentSession?.id === session.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => router.push(`/chat/${session.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{session.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(session.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Sidebar className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">
                {currentSession?.title || 'Chat Session'}
              </h1>
              <p className="text-sm text-gray-500">
                Chat with OBZR AI Agent
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/memory')}
            >
              <Brain className="h-4 w-4 mr-2" />
              Memory
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages && messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start a conversation
                </h3>
                <p className="text-gray-500">
                  Ask me anything! I have persistent memory and can help with various tasks.
                </p>
              </div>
            )}

            {messages && messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.role === 'USER' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'ASSISTANT' && (
                  <Avatar>
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.role === 'USER'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                {message.role === 'USER' && (
                  <Avatar>
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start space-x-3">
                <Avatar>
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white border rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="bg-white border-t p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isTyping}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isTyping}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
