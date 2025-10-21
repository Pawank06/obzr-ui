import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import {
  LoginRequest,
  RegisterRequest,
  CreateSessionRequest,
  ChatRequest,
  CreateMemoryRequest,
  SearchMemoryRequest,
  StructuredGenerationRequest,
} from '@/lib/types';

// Query Keys
export const queryKeys = {
  health: ['health'],
  sessions: ['sessions'],
  session: (id: string) => ['session', id],
  messages: (sessionId: string, page: number) => ['messages', sessionId, page],
  memories: ['memories'],
  memorySearch: (query: string) => ['memory-search', query],
  models: ['models'],
} as const;

// Health Check
export const useHealthCheck = () => {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => apiClient.healthCheck(),
    refetchInterval: 30000, // Check every 30 seconds
  });
};

// Authentication
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: LoginRequest) => apiClient.login(data),
    onSuccess: (data) => {
      toast.success('Login successful!');
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Login failed');
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RegisterRequest) => apiClient.register(data),
    onSuccess: (data) => {
      toast.success('Registration successful!');
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Registration failed');
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      toast.success('Logged out successfully');
      queryClient.clear(); // Clear all cached data
    },
  });
};

// Sessions
export const useSessions = () => {
  return useQuery({
    queryKey: queryKeys.sessions,
    queryFn: () => apiClient.getSessions(),
    enabled: !!apiClient.getToken(), // Only fetch if authenticated
  });
};

export const useSession = (sessionId: string) => {
  return useQuery({
    queryKey: queryKeys.session(sessionId),
    queryFn: () => apiClient.getSession(sessionId),
    enabled: !!sessionId && !!apiClient.getToken(),
  });
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSessionRequest) => apiClient.createSession(data),
    onSuccess: (newSession) => {
      toast.success('Session created successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      return newSession;
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create session');
    },
  });
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sessionId: string) => apiClient.deleteSession(sessionId),
    onSuccess: () => {
      toast.success('Session deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete session');
    },
  });
};

// Messages
export const useMessages = (sessionId: string, page = 1) => {
  return useQuery({
    queryKey: queryKeys.messages(sessionId, page),
    queryFn: () => apiClient.getSessionMessages(sessionId, page),
    enabled: !!sessionId && !!apiClient.getToken(),
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: ChatRequest }) => 
      apiClient.sendMessage(sessionId, data),
    onSuccess: (_, variables) => {
      // Invalidate messages for this session
      queryClient.invalidateQueries({ 
        queryKey: ['messages', variables.sessionId] 
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send message');
    },
  });
};

export const useSummarizeConversation = () => {
  return useMutation({
    mutationFn: ({ sessionId, maxMessages }: { sessionId: string; maxMessages?: number }) => 
      apiClient.summarizeConversation(sessionId, maxMessages),
    onSuccess: () => {
      toast.success('Summary generated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate summary');
    },
  });
};

export const useGenerateTitle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sessionId: string) => apiClient.generateTitle(sessionId),
    onSuccess: (_, sessionId) => {
      toast.success('Title generated successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.session(sessionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate title');
    },
  });
};

// AI Models
export const useModels = () => {
  return useQuery({
    queryKey: queryKeys.models,
    queryFn: () => apiClient.getModels(),
    enabled: !!apiClient.getToken(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGenerateStructured = () => {
  return useMutation({
    mutationFn: (data: StructuredGenerationRequest) => apiClient.generateStructured(data),
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate structured response');
    },
  });
};

// Memory
export const useMemories = () => {
  return useQuery({
    queryKey: queryKeys.memories,
    queryFn: () => apiClient.getMemories(),
    enabled: !!apiClient.getToken(),
  });
};

export const useCreateMemory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateMemoryRequest) => apiClient.createMemory(data),
    onSuccess: () => {
      toast.success('Memory created successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.memories });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create memory');
    },
  });
};

export const useSearchMemories = (query: string) => {
  return useQuery({
    queryKey: queryKeys.memorySearch(query),
    queryFn: () => apiClient.searchMemories({ query }),
    enabled: !!query && query.length > 2 && !!apiClient.getToken(),
  });
};

export const useDeleteMemory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (memoryId: string) => apiClient.deleteMemory(memoryId),
    onSuccess: () => {
      toast.success('Memory deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.memories });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete memory');
    },
  });
};
