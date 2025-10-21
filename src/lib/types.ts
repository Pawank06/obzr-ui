// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Session Types
export interface Session {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export interface CreateSessionRequest {
  title: string;
}

// Message Types
export interface Message {
  id: string;
  sessionId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  metadata?: Record<string, unknown> | null;
  embedding?: unknown | null;
  createdAt: string;
  toolCalls?: unknown[];
}

export interface ChatRequest {
  message: string;
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    includeMemory?: boolean;
  };
}

export interface ChatResponse {
  response: string;
  userMessage: Message;
  assistantMessage: Message;
  sessionId: string;
}

// Memory Types
export interface Memory {
  id: string;
  userId: string;
  content: string;
  memoryType: 'CONVERSATION' | 'FACT' | 'PREFERENCE' | 'SKILL';
  importance?: number;
  metadata?: Record<string, unknown>;
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoryRequest {
  content: string;
  memoryType: 'CONVERSATION' | 'FACT' | 'PREFERENCE' | 'SKILL';
  importance?: number;
  metadata?: Record<string, unknown>;
  sessionId?: string;
}

export interface SearchMemoryRequest {
  query: string;
  limit?: number;
  type?: 'CONVERSATION' | 'FACT' | 'PREFERENCE' | 'SKILL';
}

// AI Model Types
export interface AIModel {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  pricing: string;
}

export interface ModelsResponse {
  models: AIModel[];
  default: string;
}

// Health Check Types
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  services?: {
    database: string;
    redis: string;
  };
  error?: string;
}

// Structured Generation Types
export interface StructuredGenerationRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  schema: Record<string, string>;
  options?: {
    model?: string;
    temperature?: number;
  };
}
