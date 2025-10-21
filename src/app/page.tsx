'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, MessageCircle, Brain, Zap } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/chat');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Bot className="h-16 w-16 text-indigo-600 mr-4" />
            <h1 className="text-5xl font-bold text-gray-900">OBZR AI Agent</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your intelligent conversation partner with persistent memory and advanced AI capabilities
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <MessageCircle className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <CardTitle>Smart Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Engage in natural conversations with AI that understands context and maintains conversation flow
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Brain className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <CardTitle>Persistent Memory</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                AI remembers your preferences, past conversations, and important information across sessions
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Zap className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <CardTitle>Advanced Features</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Streaming responses, conversation summaries, structured data generation, and more
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <div className="space-x-4">
            <Button
              size="lg"
              onClick={() => router.push('/register')}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/login')}
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
