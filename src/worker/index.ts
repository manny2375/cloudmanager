// Cloudflare Worker - Full Stack Application
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

// Static HTML content for the frontend
const HTML_CONTENT = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cloud Manager</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {}
        }
      }
    </script>
    <style>
      body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
      .animate-spin { animation: spin 1s linear infinite; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
      const { useState, useEffect } = React;
      
      // Simple login component
      function Login({ onLogin }) {
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [isLoading, setIsLoading] = useState(false);
        const [error, setError] = useState('');

        const handleSubmit = async (e) => {
          e.preventDefault();
          setIsLoading(true);
          setError('');

          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.error || 'Login failed');
            }
            
            if (data.token) {
              localStorage.setItem('auth_token', data.token);
              onLogin(data.token);
            } else {
              throw new Error('No token received');
            }
          } catch (err) {
            setError(err.message);
          } finally {
            setIsLoading(false);
          }
        };

        return React.createElement('div', {
          className: 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'
        }, 
          React.createElement('div', { className: 'max-w-md w-full' },
            React.createElement('div', { className: 'text-center mb-8' },
              React.createElement('div', { className: 'flex justify-center mb-4' },
                React.createElement('div', { 
                  className: 'h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold'
                }, '☁')
              ),
              React.createElement('h2', { className: 'text-3xl font-bold text-gray-900' }, 'Cloud Manager'),
              React.createElement('p', { className: 'mt-2 text-gray-600' }, 'Sign in to your account')
            ),
            React.createElement('div', { className: 'bg-white shadow-xl rounded-lg p-8' },
              React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-6' },
                React.createElement('div', {},
                  React.createElement('label', { className: 'block text-sm font-medium text-gray-700' }, 'Email address'),
                  React.createElement('input', {
                    type: 'email',
                    required: true,
                    value: email,
                    onChange: (e) => setEmail(e.target.value),
                    className: 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    placeholder: 'Enter your email'
                  })
                ),
                React.createElement('div', {},
                  React.createElement('label', { className: 'block text-sm font-medium text-gray-700' }, 'Password'),
                  React.createElement('input', {
                    type: 'password',
                    required: true,
                    value: password,
                    onChange: (e) => setPassword(e.target.value),
                    className: 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    placeholder: 'Enter your password'
                  })
                ),
                error && React.createElement('div', {
                  className: 'bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm'
                }, error),
                React.createElement('button', {
                  type: 'submit',
                  disabled: isLoading,
                  className: 'w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75'
                }, isLoading ? 'Signing in...' : 'Sign in')
              ),
              React.createElement('div', { className: 'mt-6 text-center text-sm text-gray-600' },
                'Email: lamado@cloudcorenow.com | Password: admin123'
              )
            )
          )
        );
      }

      // Simple dashboard component
      function Dashboard({ onLogout }) {
        const [darkMode, setDarkMode] = useState(false);

        return React.createElement('div', {
          className: \`min-h-screen \${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}\`
        },
          // Header
          React.createElement('header', {
            className: darkMode ? 'bg-gray-800 shadow-sm' : 'bg-white shadow-sm'
          },
            React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4' },
              React.createElement('div', { className: 'flex items-center justify-between' },
                React.createElement('div', { className: 'flex items-center' },
                  React.createElement('div', { 
                    className: \`h-8 w-8 \${darkMode ? 'text-blue-400' : 'text-blue-600'} mr-3 text-2xl\`
                  }, '☁'),
                  React.createElement('h1', { className: 'text-2xl font-semibold' }, 'Cloud Manager')
                ),
                React.createElement('div', { className: 'flex items-center space-x-4' },
                  React.createElement('button', {
                    onClick: () => setDarkMode(!darkMode),
                    className: \`p-2 rounded-full \${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}\`
                  }, darkMode ? '☀️' : '🌙'),
                  React.createElement('button', {
                    onClick: onLogout,
                    className: \`p-2 rounded-full \${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}\`
                  }, '🔓')
                )
              )
            )
          ),
          // Main Content
          React.createElement('main', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' },
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-6 mb-8' },
              React.createElement('div', { className: \`\${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6\` },
                React.createElement('div', { className: 'flex items-center' },
                  React.createElement('div', { className: \`text-2xl mr-4 \${darkMode ? 'text-blue-400' : 'text-blue-500'}\` }, '🖥️'),
                  React.createElement('div', {},
                    React.createElement('p', { className: \`text-sm font-medium \${darkMode ? 'text-gray-300' : 'text-gray-600'}\` }, 'Total VMs'),
                    React.createElement('p', { className: 'text-2xl font-semibold' }, '3')
                  )
                )
              ),
              React.createElement('div', { className: \`\${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6\` },
                React.createElement('div', { className: 'flex items-center' },
                  React.createElement('div', { className: \`text-2xl mr-4 \${darkMode ? 'text-green-400' : 'text-green-500'}\` }, '⚡'),
                  React.createElement('div', {},
                    React.createElement('p', { className: \`text-sm font-medium \${darkMode ? 'text-gray-300' : 'text-gray-600'}\` }, 'Running'),
                    React.createElement('p', { className: 'text-2xl font-semibold' }, '2')
                  )
                )
              ),
              React.createElement('div', { className: \`\${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6\` },
                React.createElement('div', { className: 'flex items-center' },
                  React.createElement('div', { className: \`text-2xl mr-4 \${darkMode ? 'text-purple-400' : 'text-purple-500'}\` }, '💾'),
                  React.createElement('div', {},
                    React.createElement('p', { className: \`text-sm font-medium \${darkMode ? 'text-gray-300' : 'text-gray-600'}\` }, 'Storage'),
                    React.createElement('p', { className: 'text-2xl font-semibold' }, '350GB')
                  )
                )
              ),
              React.createElement('div', { className: \`\${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6\` },
                React.createElement('div', { className: 'flex items-center' },
                  React.createElement('div', { className: \`text-2xl mr-4 \${darkMode ? 'text-emerald-400' : 'text-emerald-500'}\` }, '💰'),
                  React.createElement('div', {},
                    React.createElement('p', { className: \`text-sm font-medium \${darkMode ? 'text-gray-300' : 'text-gray-600'}\` }, 'Monthly Cost'),
                    React.createElement('p', { className: 'text-2xl font-semibold' }, '$89.76')
                  )
                )
              )
            ),
            React.createElement('div', { className: \`\${darkMode ? 'bg-gray-800' : 'bg-white'} shadow rounded-lg p-6\` },
              React.createElement('h3', { className: 'text-lg font-medium mb-4' }, 'Virtual Machines'),
              React.createElement('div', { className: 'space-y-4' },
                React.createElement('div', { className: \`flex items-center justify-between p-4 \${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg\` },
                  React.createElement('div', { className: 'flex items-center' },
                    React.createElement('div', { className: 'text-orange-500 text-xl mr-3' }, '☁️'),
                    React.createElement('div', {},
                      React.createElement('p', { className: 'font-medium' }, 'prod-web-01'),
                      React.createElement('p', { className: \`text-sm \${darkMode ? 'text-gray-400' : 'text-gray-500'}\` }, 'AWS • t3.medium • Amazon Linux 2')
                    )
                  ),
                  React.createElement('span', { className: 'px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium' }, 'Running')
                ),
                React.createElement('div', { className: \`flex items-center justify-between p-4 \${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg\` },
                  React.createElement('div', { className: 'flex items-center' },
                    React.createElement('div', { className: 'text-blue-500 text-xl mr-3' }, '☁️'),
                    React.createElement('div', {},
                      React.createElement('p', { className: 'font-medium' }, 'dev-db-01'),
                      React.createElement('p', { className: \`text-sm \${darkMode ? 'text-gray-400' : 'text-gray-500'}\` }, 'Azure • Standard_D2s_v3 • Ubuntu')
                    )
                  ),
                  React.createElement('span', { className: 'px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium' }, 'Stopped')
                ),
                React.createElement('div', { className: \`flex items-center justify-between p-4 \${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg\` },
                  React.createElement('div', { className: 'flex items-center' },
                    React.createElement('div', { className: 'text-green-500 text-xl mr-3' }, '🖥️'),
                    React.createElement('div', {},
                      React.createElement('p', { className: 'font-medium' }, 'test-app-01'),
                      React.createElement('p', { className: \`text-sm \${darkMode ? 'text-gray-400' : 'text-gray-500'}\` }, 'Proxmox • Custom • Debian')
                    )
                  ),
                  React.createElement('span', { className: 'px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium' }, 'Running')
                )
              )
            )
          )
        );
      }

      // Main App component
      function App() {
        const [isAuthenticated, setIsAuthenticated] = useState(false);
        const [isLoading, setIsLoading] = useState(true);

        useEffect(() => {
          const token = localStorage.getItem('auth_token');
          if (token) {
            setIsAuthenticated(true);
          }
          setIsLoading(false);
        }, []);

        const handleLogin = (token) => {
          setIsAuthenticated(true);
        };

        const handleLogout = () => {
          localStorage.removeItem('auth_token');
          setIsAuthenticated(false);
        };

        if (isLoading) {
          return React.createElement('div', {
            className: 'min-h-screen bg-gray-50 flex items-center justify-center'
          },
            React.createElement('div', {
              className: 'animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'
            })
          );
        }

        if (!isAuthenticated) {
          return React.createElement(Login, { onLogin: handleLogin });
        }

        return React.createElement(Dashboard, { onLogout: handleLogout });
      }

      // Render the app
      ReactDOM.render(React.createElement(App), document.getElementById('root'));
    </script>
  </body>
</html>`;

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
      // Serve static frontend for root path
      if (path === '/' || path === '/index.html') {
        return new Response(HTML_CONTENT, {
          headers: { 
            'Content-Type': 'text/html',
            ...corsHeaders
          }
        });
      }

      // Health check
      if (path === '/health') {
        return new Response(JSON.stringify({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          environment: this.env.ENVIRONMENT || 'unknown'
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Test endpoint
      if (path === '/test') {
        return new Response(JSON.stringify({ 
          message: 'Full-stack Worker is running!', 
          timestamp: new Date().toISOString(),
          environment: this.env.ENVIRONMENT || 'unknown',
          hasDatabase: !!this.env.DB,
          hasJWTSecret: !!this.env.JWT_SECRET
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

    // Placeholder for other endpoints
    return new Response(
      JSON.stringify({ error: 'Endpoint not implemented' }),
      { status: 501, headers: { 'Content-Type': 'application/json' } }
    );
  }

  private async handleLogin(request: CloudflareRequest): Promise<Response> {
    try {
      const { email, password } = await request.json();
      
      console.log('Login attempt:', { email, password: '***' });
      
      // Simple authentication check for the default admin user
      if (email === 'lamado@cloudcorenow.com' && password === 'admin123') {
        // Create a mock user object
        const user = {
          id: 'admin-user-id',
          email: 'lamado@cloudcorenow.com',
          role: 'admin',
          first_name: 'System',
          last_name: 'Administrator'
        };

        // Generate a simple JWT token
        const token = await this.generateSimpleJWT(user);
        
        console.log('Login successful for admin user');
        
        return new Response(
          JSON.stringify({ 
            token, 
            user
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } else {
        console.log('Invalid credentials provided');
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  private async generateSimpleJWT(user: any): Promise<string> {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    // Simple base64 encoding for development
    const token = btoa(JSON.stringify(payload));
    return `simple.${token}.signature`;
  }

  private async handleRegister(request: CloudflareRequest): Promise<Response> {
    return new Response(JSON.stringify({ error: 'Registration not implemented' }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleGetVMs(userId: string): Promise<Response> {
    // Return mock data for now
    const mockVMs = [
      {
        id: '1',
        name: 'prod-web-01',
        status: 'running',
        platform: 'aws',
        type: 't3.medium',
        ip: '10.0.1.4',
        cpu: 2,
        memory: 4,
        storage: 50,
        costPerHour: 0.0416,
        os: 'Amazon Linux 2'
      },
      {
        id: '2',
        name: 'dev-db-01',
        status: 'stopped',
        platform: 'azure',
        type: 'Standard_D2s_v3',
        ip: '10.0.2.5',
        cpu: 2,
        memory: 8,
        storage: 100,
        costPerHour: 0.0912,
        os: 'Ubuntu'
      },
      {
        id: '3',
        name: 'test-app-01',
        status: 'running',
        platform: 'proxmox',
        type: 'custom',
        ip: '192.168.1.10',
        cpu: 4,
        memory: 16,
        storage: 200,
        costPerHour: 0.0250,
        os: 'Debian'
      }
    ];

    return new Response(
      JSON.stringify(mockVMs),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  private async authenticateRequest(request: CloudflareRequest): Promise<{ success: boolean; user?: any }> {
    try {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false };
      }

      const token = authHeader.substring(7);
      
      // Simple token verification for development
      if (token.startsWith('simple.')) {
        const [, payloadPart] = token.split('.');
        const payload = JSON.parse(atob(payloadPart));
        
        // Check if token is expired
        if (payload.exp < Math.floor(Date.now() / 1000)) {
          return { success: false };
        }
        
        return { 
          success: true, 
          user: {
            id: payload.userId,
            email: payload.email,
            role: payload.role
          }
        };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Token verification error:', error);
      return { success: false };
    }
  }
}

// Main worker entry point
export default {
  async fetch(request: CloudflareRequest, env: Env): Promise<Response> {
    const workerService = new CloudflareWorkerService(env);
    return await workerService.handleRequest(request);
  }
};