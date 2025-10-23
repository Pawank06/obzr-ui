import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Session,
  CreateSessionRequest,
  Message,
  ChatRequest,
  ChatResponse,
  Memory,
  CreateMemoryRequest,
  SearchMemoryRequest,
  ModelsResponse,
  StructuredGenerationRequest,
  HealthCheckResponse,
  MemoryV2StoreRequest,
  MemoryV2QueryRequest,
  MemoryQueryResponse,
  MemoryStats,
  PromotionResult,
  ConsolidationResult,
  MemoryHealthStatus,
  AuditLogResponse,
  PaginatedResponse,
} from './types';
import { requestCache } from './request-cache';

// Configuration
const API_BASE_URL = 'http://localhost:3001'; // Change this to match your server port

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
          // Redirect to login or emit event
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  getToken() {
    return this.token;
  }

  // Health Check
  async healthCheck(): Promise<HealthCheckResponse> {
    const response: AxiosResponse<HealthCheckResponse> = await this.client.get('/health');
    return response.data;
  }

  // Authentication
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.client.post('/api/users/login', data);
    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.token);
      return response.data.data;
    }
    throw new Error(response.data.error || 'Login failed');
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.client.post('/api/users/register', data);
    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.token);
      return response.data.data;
    }
    throw new Error(response.data.error || 'Registration failed');
  }

  async logout(): Promise<void> {
    this.clearToken();
  }

  // Sessions
  async getSessions(): Promise<Session[]> {
    return requestCache.dedupe('sessions', async () => {
      const response: AxiosResponse<ApiResponse<Session[]>> = await this.client.get('/api/sessions');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch sessions');
    });
  }

  async createSession(data: CreateSessionRequest): Promise<Session> {
    const response: AxiosResponse<ApiResponse<Session>> = await this.client.post('/api/sessions', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create session');
  }

  async getSession(sessionId: string): Promise<Session> {
    return requestCache.dedupe(`session-${sessionId}`, async () => {
      const response: AxiosResponse<ApiResponse<Session>> = await this.client.get(`/api/sessions/${sessionId}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch session');
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    const response: AxiosResponse<ApiResponse> = await this.client.delete(`/api/sessions/${sessionId}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete session');
    }
  }

  // Messages
  async getSessionMessages(sessionId: string, page = 1, limit = 50): Promise<{ messages: Message[]; total: number; hasMore: boolean }> {
    return requestCache.dedupe(`messages-${sessionId}-${page}-${limit}`, async () => {
      try {
        const response: AxiosResponse<{ success: boolean; data: Message[]; pagination: { total: number; hasNext: boolean; } }> = 
          await this.client.get(`/api/messages/sessions/${sessionId}/messages?page=${page}&limit=${limit}`);
        
        // Handle 304 Not Modified - return cached data structure
        if (response.status === 304) {
          return {
            messages: [],
            total: 0,
            hasMore: false
          };
        }
        
        if (response.data.success && response.data.data) {
          return {
            messages: response.data.data,
            total: response.data.pagination.total,
            hasMore: response.data.pagination.hasNext
          };
        }
        
        throw new Error('Failed to fetch messages');
      } catch (error: unknown) {
        // Don't throw error for 304 status
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response: { status: number } };
          if (axiosError.response?.status === 304) {
            return {
              messages: [],
              total: 0,
              hasMore: false
            };
          }
        }
        throw error;
      }
    });
  }

  // AI Chat
  async sendMessage(sessionId: string, data: ChatRequest): Promise<ChatResponse> {
    const response: AxiosResponse<ApiResponse<ChatResponse>> = 
      await this.client.post(`/api/ai/sessions/${sessionId}/chat`, data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to send message');
  }

  async streamMessage(sessionId: string, data: ChatRequest): Promise<ReadableStream> {
    const response = await this.client.post(`/api/ai/sessions/${sessionId}/stream`, data, {
      responseType: 'stream',
    });
    return response.data;
  }

  async summarizeConversation(sessionId: string, maxMessages?: number): Promise<string> {
    const url = `/api/ai/sessions/${sessionId}/summarize${maxMessages ? `?maxMessages=${maxMessages}` : ''}`;
    const response: AxiosResponse<ApiResponse<{ summary: string }>> = await this.client.post(url);
    if (response.data.success && response.data.data) {
      return response.data.data.summary;
    }
    throw new Error(response.data.error || 'Failed to generate summary');
  }

  async generateTitle(sessionId: string): Promise<string> {
    const response: AxiosResponse<ApiResponse<{ title: string }>> = 
      await this.client.post(`/api/ai/sessions/${sessionId}/generate-title`);
    if (response.data.success && response.data.data) {
      return response.data.data.title;
    }
    throw new Error(response.data.error || 'Failed to generate title');
  }

  async getModels(): Promise<ModelsResponse> {
    const response: AxiosResponse<ApiResponse<ModelsResponse>> = await this.client.get('/api/ai/models');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch models');
  }

  async generateStructured(data: StructuredGenerationRequest): Promise<unknown> {
    const response: AxiosResponse<ApiResponse<unknown>> = await this.client.post('/api/ai/generate-structured', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to generate structured response');
  }

  // Memory
  async getMemories(): Promise<Memory[]> {
    const response: AxiosResponse<ApiResponse<Memory[]>> = await this.client.get('/api/memories');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch memories');
  }

  async createMemory(data: CreateMemoryRequest): Promise<Memory> {
    const response: AxiosResponse<ApiResponse<Memory>> = await this.client.post('/api/memories', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create memory');
  }

  async searchMemories(data: SearchMemoryRequest): Promise<Memory[]> {
    const params = new URLSearchParams();
    params.append('q', data.query);
    if (data.limit) params.append('limit', data.limit.toString());
    if (data.type) params.append('type', data.type);

    const response: AxiosResponse<ApiResponse<Memory[]>> = 
      await this.client.get(`/api/memories/search?${params.toString()}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to search memories');
  }

  async deleteMemory(memoryId: string): Promise<void> {
    const response: AxiosResponse<ApiResponse> = await this.client.delete(`/api/memories/${memoryId}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete memory');
    }
  }

  // Memory V2 - New Memory System
  async storeMemoryV2(data: MemoryV2StoreRequest): Promise<{ stmId?: string; ltmId?: string; importance: number }> {
    const response: AxiosResponse<ApiResponse<{ stmId?: string; ltmId?: string; importance: number }>> = 
      await this.client.post('/api/memory/store', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to store memory');
  }

  async queryMemoriesV2(data: MemoryV2QueryRequest): Promise<MemoryQueryResponse> {
    const response: AxiosResponse<ApiResponse<MemoryQueryResponse>> = 
      await this.client.post('/api/memory/query', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to query memories');
  }

  async batchStoreMemories(memories: MemoryV2StoreRequest[]): Promise<{ results: Array<{ stmId?: string; ltmId?: string; importance: number }> }> {
    const response: AxiosResponse<ApiResponse<{ results: Array<{ stmId?: string; ltmId?: string; importance: number }> }>> = 
      await this.client.post('/api/memory/batch-store', { memories });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to batch store memories');
  }

  async getMemoryStats(): Promise<MemoryStats> {
    const response: AxiosResponse<ApiResponse<MemoryStats>> = 
      await this.client.get('/api/memory/stats');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to get memory stats');
  }

  async getCacheStats(): Promise<{ cache: { hitRate: number; totalEntries: number; avgResponseTime: number }; telemetry: { totalQueries: number; avgRelevanceScore: number; errorRate: number } }> {
    const response: AxiosResponse<ApiResponse<{ cache: { hitRate: number; totalEntries: number; avgResponseTime: number }; telemetry: { totalQueries: number; avgRelevanceScore: number; errorRate: number } }>> = 
      await this.client.get('/api/memory/cache-stats');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to get cache stats');
  }

  async promoteMemories(options?: { maxPromotions?: number; minImportance?: number }): Promise<PromotionResult> {
    const response: AxiosResponse<ApiResponse<PromotionResult>> = 
      await this.client.post('/api/memory/promote', options || {});
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to promote memories');
  }

  async consolidateMemories(options?: { maxAge?: number; similarityThreshold?: number }): Promise<ConsolidationResult> {
    const response: AxiosResponse<ApiResponse<ConsolidationResult>> = 
      await this.client.post('/api/memory/consolidate', options || {});
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to consolidate memories');
  }

  async clearMemories(type?: 'stm' | 'ltm' | 'cache'): Promise<{ cleared: number }> {
    const response: AxiosResponse<ApiResponse<{ cleared: number }>> = 
      await this.client.delete('/api/memory/clear', { data: { type } });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to clear memories');
  }

  async getMemoryHealth(): Promise<MemoryHealthStatus> {
    const response: AxiosResponse<ApiResponse<MemoryHealthStatus>> = 
      await this.client.get('/api/memory/health');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to get memory health');
  }

  async warmUpCache(): Promise<{ warmedUp: number }> {
    const response: AxiosResponse<ApiResponse<{ warmedUp: number }>> = 
      await this.client.post('/api/memory/cache/warm-up');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to warm up cache');
  }

  async runMemoryMaintenance(): Promise<{ tasksCompleted: number }> {
    const response: AxiosResponse<ApiResponse<{ tasksCompleted: number }>> = 
      await this.client.post('/api/memory/maintenance');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to run maintenance');
  }

  async updateMemoryConfig(config: Record<string, unknown>): Promise<{ updated: boolean }> {
    const response: AxiosResponse<ApiResponse<{ updated: boolean }>> = 
      await this.client.put('/api/memory/config', config);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update config');
  }

  // Security & Audit
  async getAuditLogs(options?: {
    page?: number;
    limit?: number;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<AuditLogResponse['logs'][0]>> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.action) params.append('action', options.action);
    if (options?.resource) params.append('resource', options.resource);
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    const response: AxiosResponse<PaginatedResponse<AuditLogResponse['logs'][0]>> = 
      await this.client.get(`/api/security/audit-logs?${params.toString()}`);
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.error || 'Failed to get audit logs');
  }

  async encryptData(data: string): Promise<{ encrypted: string; checksum: string }> {
    const response: AxiosResponse<ApiResponse<{ encrypted: string; checksum: string }>> = 
      await this.client.post('/api/security/encrypt', { data });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to encrypt data');
  }

  async decryptData(encrypted: string): Promise<{ decrypted: string }> {
    const response: AxiosResponse<ApiResponse<{ decrypted: string }>> = 
      await this.client.post('/api/security/decrypt', { encrypted });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to decrypt data');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
