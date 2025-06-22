interface LLMCall {
  id: string;
  type: 'chat' | 'report' | 'explanation' | 'synthetic_data' | 'health_check';
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  error?: string;
  model: string;
  tokenCount?: number;
}

interface LLMMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  lastCallTime?: number;
  currentStatus: 'offline' | 'standby' | 'healthy' | 'busy' | 'error';
  apiHealthScore: number; // 0-100
  recentErrors: string[];
  callsLast24h: number;
  callsLastHour: number;
}

class LLMMonitor {
  private static instance: LLMMonitor;
  private calls: Map<string, LLMCall> = new Map();
  private recentCalls: LLMCall[] = [];
  private maxRecentCalls = 100;
  private listeners: ((metrics: LLMMetrics) => void)[] = [];
  private healthCheckInterval?: NodeJS.Timeout;
  private apiKey: string | null = null;

  private constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || null;
    this.startHealthChecking();
    this.loadFromStorage();
  }

  public static getInstance(): LLMMonitor {
    if (!LLMMonitor.instance) {
      LLMMonitor.instance = new LLMMonitor();
    }
    return LLMMonitor.instance;
  }

  // Start tracking an API call
  public startCall(type: LLMCall['type'], model: string = 'gemini-2.5-flash'): string {
    const callId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const call: LLMCall = {
      id: callId,
      type,
      startTime: Date.now(),
      status: 'pending',
      model
    };

    this.calls.set(callId, call);
    this.notifyListeners();
    
    console.log(`[LLM Monitor] Started ${type} call:`, callId);
    return callId;
  }

  // Complete a successful API call
  public completeCall(callId: string, tokenCount?: number): void {
    const call = this.calls.get(callId);
    if (!call) return;

    const endTime = Date.now();
    call.endTime = endTime;
    call.duration = endTime - call.startTime;
    call.status = 'success';
    call.tokenCount = tokenCount;

    this.addToRecentCalls(call);
    this.calls.delete(callId);
    this.saveToStorage();
    this.notifyListeners();
    
    console.log(`[LLM Monitor] Completed ${call.type} call in ${call.duration}ms:`, callId);
  }

  // Fail an API call
  public failCall(callId: string, error: string): void {
    const call = this.calls.get(callId);
    if (!call) return;

    const endTime = Date.now();
    call.endTime = endTime;
    call.duration = endTime - call.startTime;
    call.status = 'error';
    call.error = error;

    this.addToRecentCalls(call);
    this.calls.delete(callId);
    this.saveToStorage();
    this.notifyListeners();
    
    console.error(`[LLM Monitor] Failed ${call.type} call after ${call.duration}ms:`, callId, error);
  }

  // Get current metrics
  public getMetrics(): LLMMetrics {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const lastHour = now - 60 * 60 * 1000;

    const recentCalls24h = this.recentCalls.filter(call => call.startTime >= last24h);
    const recentCallsHour = this.recentCalls.filter(call => call.startTime >= lastHour);
    const successfulCalls = this.recentCalls.filter(call => call.status === 'success');
    const failedCalls = this.recentCalls.filter(call => call.status === 'error');

    // Calculate average response time (successful calls only)
    const avgResponseTime = successfulCalls.length > 0 
      ? successfulCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / successfulCalls.length
      : 0;

    // Calculate API health score
    const healthScore = this.calculateHealthScore();

    // Determine current status
    const currentStatus = this.getCurrentStatus();

    // Get recent errors (last 10)
    const recentErrors = failedCalls
      .slice(-10)
      .map(call => call.error || 'Unknown error')
      .filter((error, index, arr) => arr.indexOf(error) === index); // Remove duplicates

    return {
      totalCalls: this.recentCalls.length,
      successfulCalls: successfulCalls.length,
      failedCalls: failedCalls.length,
      averageResponseTime: Math.round(avgResponseTime),
      lastCallTime: this.recentCalls.length > 0 ? Math.max(...this.recentCalls.map(c => c.startTime)) : undefined,
      currentStatus,
      apiHealthScore: healthScore,
      recentErrors,
      callsLast24h: recentCalls24h.length,
      callsLastHour: recentCallsHour.length
    };
  }

  // Subscribe to metrics updates
  public subscribe(listener: (metrics: LLMMetrics) => void): () => void {
    this.listeners.push(listener);
    // Immediately call with current metrics
    listener(this.getMetrics());
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Test API connectivity
  public async testApiHealth(): Promise<{ success: boolean; responseTime: number; error?: string }> {
    if (!this.apiKey) {
      return { success: false, responseTime: 0, error: 'API key not configured' };
    }

    const callId = this.startCall('health_check');
    const startTime = Date.now();

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const result = await model.generateContent('Health check: respond with "OK"');
      const response = await result.response;
      const text = response.text();
      
      const responseTime = Date.now() - startTime;
      this.completeCall(callId);
      
      return { success: true, responseTime };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.failCall(callId, errorMessage);
      
      return { success: false, responseTime, error: errorMessage };
    }
  }

  // Get active calls count
  public getActiveCalls(): number {
    return this.calls.size;
  }

  // Get calls by type in last hour
  public getCallsByType(): Record<string, number> {
    const lastHour = Date.now() - 60 * 60 * 1000;
    const recentCalls = this.recentCalls.filter(call => call.startTime >= lastHour);
    
    const callsByType: Record<string, number> = {};
    recentCalls.forEach(call => {
      callsByType[call.type] = (callsByType[call.type] || 0) + 1;
    });
    
    return callsByType;
  }

  // Private methods
  private addToRecentCalls(call: LLMCall): void {
    this.recentCalls.push(call);
    
    // Keep only recent calls
    if (this.recentCalls.length > this.maxRecentCalls) {
      this.recentCalls = this.recentCalls.slice(-this.maxRecentCalls);
    }
    
    // Sort by start time
    this.recentCalls.sort((a, b) => a.startTime - b.startTime);
  }

  private calculateHealthScore(): number {
    if (this.recentCalls.length === 0) return this.apiKey ? 50 : 0;

    const last24h = Date.now() - 24 * 60 * 60 * 1000;
    const recentCalls = this.recentCalls.filter(call => call.startTime >= last24h);
    
    if (recentCalls.length === 0) return this.apiKey ? 75 : 0;

    const successRate = recentCalls.filter(call => call.status === 'success').length / recentCalls.length;
    const avgResponseTime = recentCalls
      .filter(call => call.status === 'success')
      .reduce((sum, call) => sum + (call.duration || 0), 0) / recentCalls.length;

    // Score based on success rate (70%) and response time (30%)
    const successScore = successRate * 70;
    const responseScore = Math.max(0, 30 - (avgResponseTime / 1000) * 10); // Penalty for slow responses
    
    return Math.min(100, Math.max(0, successScore + responseScore));
  }

  private getCurrentStatus(): LLMMetrics['currentStatus'] {
    if (!this.apiKey) return 'offline';
    
    const activeCalls = this.calls.size;
    if (activeCalls > 0) return 'busy';

    const healthScore = this.calculateHealthScore();
    const lastHour = Date.now() - 60 * 60 * 1000;
    const recentFailures = this.recentCalls.filter(
      call => call.startTime >= lastHour && call.status === 'error'
    ).length;

    if (recentFailures > 3 || healthScore < 30) return 'error';
    if (healthScore >= 80) return 'healthy';
    
    return 'standby';
  }

  private notifyListeners(): void {
    const metrics = this.getMetrics();
    this.listeners.forEach(listener => {
      try {
        listener(metrics);
      } catch (error) {
        console.error('Error notifying LLM metrics listener:', error);
      }
    });
  }

  private startHealthChecking(): void {
    // Periodic health check every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      if (this.apiKey && this.calls.size === 0) {
        await this.testApiHealth();
      }
    }, 5 * 60 * 1000);
  }

  private saveToStorage(): void {
    try {
      const data = {
        recentCalls: this.recentCalls.slice(-50), // Save only last 50 calls
        timestamp: Date.now()
      };
      localStorage.setItem('llm-monitor-data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save LLM monitor data to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('llm-monitor-data');
      if (data) {
        const parsed = JSON.parse(data);
        // Only load data from last 24 hours
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        this.recentCalls = parsed.recentCalls.filter((call: LLMCall) => call.startTime >= cutoff);
      }
    } catch (error) {
      console.warn('Failed to load LLM monitor data from localStorage:', error);
    }
  }

  // Cleanup
  public destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.listeners = [];
    this.calls.clear();
  }
}

export const llmMonitor = LLMMonitor.getInstance();
export type { LLMMetrics, LLMCall }; 