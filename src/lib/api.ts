// API client for communicating with Cloudflare Workers backend
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://api.yourdomain.com' // Your Workers API domain
  : 'http://localhost:8787'; // Local development

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Request failed' };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: 'Network error' };
    }
  }

  // Authentication
  async login(email: string, password: string) {
    // For demo purposes, simulate successful login
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email && password) {
      return {
        data: {
          token: 'demo-jwt-token-' + Date.now(),
          user: {
            id: 'demo-user-id',
            email: email,
            role: 'admin',
            first_name: 'Demo',
            last_name: 'User'
          }
        }
      };
    } else {
      return { error: 'Invalid credentials' };
    }
  }

  async register(userData: any) {
    return this.request<{ token: string; user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Virtual Machines
  async getVMs() {
    return this.request<any[]>('/api/vms');
  }

  async createVM(vmData: any) {
    return this.request<any>('/api/vms', {
      method: 'POST',
      body: JSON.stringify(vmData),
    });
  }

  async updateVM(vmId: string, vmData: any) {
    return this.request<any>(`/api/vms/${vmId}`, {
      method: 'PUT',
      body: JSON.stringify(vmData),
    });
  }

  async deleteVM(vmId: string) {
    return this.request<any>(`/api/vms/${vmId}`, {
      method: 'DELETE',
    });
  }

  // Metrics
  async getVMMetrics(vmId: string) {
    return this.request<any[]>(`/api/vms/${vmId}/metrics`);
  }

  async addVMMetric(vmId: string, metricData: any) {
    return this.request<any>(`/api/vms/${vmId}/metrics`, {
      method: 'POST',
      body: JSON.stringify(metricData),
    });
  }

  // Audit Logs
  async getAuditLogs() {
    return this.request<any[]>('/api/audit-logs');
  }

  // Cost Tracking
  async getMonthlyCosts(year: number, month: number) {
    return this.request<any[]>(`/api/costs/monthly?year=${year}&month=${month}`);
  }
}

export const apiClient = new ApiClient();
export default apiClient;