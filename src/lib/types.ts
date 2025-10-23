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
    memoryOptions?: {
      useHybridSearch?: boolean;
      maxMemoryAge?: number;
      includeFactors?: boolean;
      diversityLambda?: number;
      maxMemories?: number;
    };
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

// New Memory System Types
export interface MemoryV2StoreRequest {
  content: string;
  type?: 'episodic' | 'semantic' | 'procedural';
  sessionId?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  explicitSave?: boolean;
  bypassSTM?: boolean;
  source?: 'user' | 'agent' | 'tool';
}

export interface MemoryV2QueryRequest {
  query: string;
  limit?: number;
  memoryType?: 'CONVERSATION' | 'FACT' | 'PREFERENCE' | 'SKILL';
  sessionId?: string;
  includeFactors?: boolean;
  maxAge?: number;
  useCache?: boolean;
  hybridSearch?: boolean;
  diversityLambda?: number;
}

export interface MemoryContext {
  id: string;
  content: string;
  type: 'CONVERSATION' | 'FACT' | 'PREFERENCE' | 'SKILL';
  importance: number;
  relevanceScore: number;
  source: 'ltm' | 'stm';
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryQueryResponse {
  memories: MemoryContext[];
  totalTokens: number;
  searchStats: {
    stmItems: number;
    ltmItems: number;
    totalCandidates: number;
    executionTime: number;
  };
  query: string;
}

export interface MemoryStats {
  memory: {
    stm: {
      totalItems: number;
      itemsByType: Record<string, number>;
      averageImportance: number;
    };
    ltm: {
      totalMemories: number;
      memoriesByType: Array<{ memoryType: string; count: number; avgImportance: number }>;
    };
  };
  cache: {
    hitRate: number;
    totalEntries: number;
    avgResponseTime: number;
  };
  telemetry: {
    totalQueries: number;
    avgRelevanceScore: number;
    errorRate: number;
  };
}

export interface PromotionResult {
  promoted: number;
  skipped: number;
  consolidated: number;
  errors: number;
  details: Array<{
    stmId: string;
    ltmId?: string;
    action: 'promoted' | 'skipped' | 'consolidated' | 'error';
    reason: string;
  }>;
}

export interface ConsolidationResult {
  clustersFound: number;
  memoriesConsolidated: number;
  consolidatedMemoriesCreated: number;
  originalMemoriesArchived: number;
  errors: number;
  details: Array<{
    clusterId: string;
    originalMemoryIds: string[];
    consolidatedMemoryId?: string;
    action: 'consolidated' | 'preserved' | 'error';
    reason: string;
  }>;
}

export interface MemoryHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    redis: boolean;
    memory: boolean;
    cache: boolean;
    telemetry: boolean;
  };
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

// Security Types
export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
}

export interface AuditLogResponse {
  logs: AuditLogEntry[];
  total: number;
}

// Pagination Types
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error?: string;
}
