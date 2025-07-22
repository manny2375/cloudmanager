// Cloudflare Worker - Backend API
import { DatabaseService } from '../lib/database';
import { AuthService } from '../lib/auth';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ENVIRONMENT: string;
}

export interface CloudflareRequest extends Request {
  cf?: {
    country?: string;
    colo?: string;
    asn?: number;
  };
}

export class CloudflareWorkerService {
  private dbService: DatabaseService;
  private authService: AuthService;

  constructor(private env: Env) {
    this.dbService = new DatabaseService(env.DB);
    this.authService = new AuthService(this.dbService);
  }

  async handleRequest(request: CloudflareRequest): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (path === '/health') {
        return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Test endpoint
      if (path === '/test') {
        return new Response(JSON.stringify({ 
          message: 'Worker is running!', 
          timestamp: new Date().toISOString(),
          environment: this.env.ENVIRONMENT || 'unknown'
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // API routes
      if (path.startsWith('/api/')) {
        const response = await this.handleAPIRequest(request, path, method);
        // Add CORS headers to API responses
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }

      // Default 404 for non-API routes
      return new Response(
        JSON.stringify({ error: 'Not found' }),
        { 
          status: 404, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }
  }

  private async handleAPIRequest(request: CloudflareRequest, path: string, method: string): Promise<Response> {
    // Authentication endpoints
    if (path === '/api/auth/login' && method === 'POST') {
      return await this.handleLogin(request);
    }

    if (path === '/api/auth/register' && method === 'POST') {
      return await this.handleRegister(request);
    }

    // Protected routes - require authentication
    const authResult = await this.authenticateRequest(request);
    if (!authResult.success) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = authResult.user!;

    // Virtual machines endpoints
    if (path === '/api/vms' && method === 'GET') {
      return await this.handleGetVMs(user.id);
    }

    if (path === '/api/vms' && method === 'POST') {
      return await this.handleCreateVM(request, user.id);
    }

    if (path.startsWith('/api/vms/') && method === 'PUT') {
      const vmId = path.split('/')[3];
      return await this.handleUpdateVM(request, vmId, user.id);
    }

    if (path.startsWith('/api/vms/') && method === 'DELETE') {
      const vmId = path.split('/')[3];
      return await this.handleDeleteVM(vmId, user.id);
    }

    // Metrics endpoints
    if (path.startsWith('/api/vms/') && path.endsWith('/metrics') && method === 'GET') {
      const vmId = path.split('/')[3];
      return await this.handleGetVMMetrics(vmId, user.id);
    }

    if (path.startsWith('/api/vms/') && path.endsWith('/metrics') && method === 'POST') {
      const vmId = path.split('/')[3];
      return await this.handleAddVMMetric(request, vmId, user.id);
    }

    // Audit logs endpoint
    if (path === '/api/audit-logs' && method === 'GET') {
      return await this.handleGetAuditLogs(user.id, user.role);
    }

    // Cost tracking endpoints
    if (path === '/api/costs/monthly' && method === 'GET') {
      const url = new URL(request.url);
      const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
      const month = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString());
      return await this.handleGetMonthlyCosts(user.id, year, month);
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  private async handleLogin(request: CloudflareRequest): Promise<Response> {
    try {
      const { email, password } = await request.json();
      
      console.log('Login attempt:', { email, password: '***' });
      
      const authResult = await this.authService.authenticateUser(email, password);
      console.log('Auth result:', { success: authResult.success, error: authResult.error });
      
      if (!authResult.success) {
        return new Response(
          JSON.stringify({ error: authResult.error }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const token = await this.authService.generateJWT(authResult.user!, this.env.JWT_SECRET);
      
      // Log the login
      await this.dbService.addAuditLog({
        user_id: authResult.user!.id,
        action: 'login',
        resource_type: 'user',
        resource_id: authResult.user!.id,
        ip_address: request.headers.get('CF-Connecting-IP') || 'unknown',
        user_agent: request.headers.get('User-Agent') || 'unknown'
      });

      return new Response(
        JSON.stringify({ 
          token, 
          user: {
            id: authResult.user!.id,
            email: authResult.user!.email,
            role: authResult.user!.role,
            first_name: authResult.user!.first_name,
            last_name: authResult.user!.last_name
          }
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  private async handleRegister(request: CloudflareRequest): Promise<Response> {
    try {
      const userData = await request.json();
      
      const authResult = await this.authService.registerUser(userData);
      if (!authResult.success) {
        return new Response(
          JSON.stringify({ error: authResult.error }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const token = await this.authService.generateJWT(authResult.user!, this.env.JWT_SECRET);

      return new Response(
        JSON.stringify({ 
          token, 
          user: {
            id: authResult.user!.id,
            email: authResult.user!.email,
            role: authResult.user!.role,
            first_name: authResult.user!.first_name,
            last_name: authResult.user!.last_name
          }
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  private async handleGetVMs(userId: string): Promise<Response> {
    const vms = await this.dbService.getVirtualMachinesByUser(userId);
    return new Response(
      JSON.stringify(vms),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  private async handleGetVMMetrics(vmId: string, userId: string): Promise<Response> {
    // Verify user has access to this VM
    const vms = await this.dbService.getVirtualMachinesByUser(userId);
    const vm = vms.find(v => v.id === vmId);
    
    if (!vm) {
      return new Response(
        JSON.stringify({ error: 'VM not found or access denied' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const metrics = await this.dbService.getVMMetrics(vmId);
    return new Response(
      JSON.stringify(metrics),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  private async handleGetAuditLogs(userId: string, userRole: string): Promise<Response> {
    // Only admins can see all logs, others see only their own
    const logs = await this.dbService.getAuditLogs(
      userRole === 'admin' ? undefined : userId
    );
    
    return new Response(
      JSON.stringify(logs),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  private async handleGetMonthlyCosts(userId: string, year: number, month: number): Promise<Response> {
    const costs = await this.dbService.getMonthlyCosts(userId, year, month);
    return new Response(
      JSON.stringify(costs),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  private async authenticateRequest(request: CloudflareRequest): Promise<{ success: boolean; user?: any }> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false };
    }

    const token = authHeader.substring(7);
    const payload = await this.authService.verifyJWT(token, this.env.JWT_SECRET);
    
    if (!payload) {
      return { success: false };
    }

    const user = await this.dbService.getUserById(payload.userId);
    if (!user) {
      return { success: false };
    }

    return { success: true, user };
  }

  // Placeholder methods for VM operations
  private async handleCreateVM(request: CloudflareRequest, userId: string): Promise<Response> {
    return new Response(JSON.stringify({ message: 'VM creation not implemented yet' }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleUpdateVM(request: CloudflareRequest, vmId: string, userId: string): Promise<Response> {
    return new Response(JSON.stringify({ message: 'VM update not implemented yet' }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleDeleteVM(vmId: string, userId: string): Promise<Response> {
    return new Response(JSON.stringify({ message: 'VM deletion not implemented yet' }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleAddVMMetric(request: CloudflareRequest, vmId: string, userId: string): Promise<Response> {
    return new Response(JSON.stringify({ message: 'Metric addition not implemented yet' }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Main worker entry point
export default {
  async fetch(request: CloudflareRequest, env: Env): Promise<Response> {
    const workerService = new CloudflareWorkerService(env);
    return await workerService.handleRequest(request);
  }
};