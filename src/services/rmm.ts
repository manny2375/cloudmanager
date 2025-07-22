import axios from 'axios';

interface RMMConfig {
  baseUrl: string;
  apiKey: string;
}

interface Agent {
  id: string;
  hostname: string;
  status: 'online' | 'offline';
  lastSeen: string;
  operatingSystem: string;
  totalMemory: number;
  cpuCount: number;
  diskSpace: number;
  cpuLoad: number;
  memoryUsage: number;
  diskUsage: number;
  agentVersion: string;
  pendingActions: number;
}

// Mock data for testing
const mockAgents: Agent[] = [
  {
    id: '1',
    hostname: 'prod-web-01',
    status: 'online',
    lastSeen: new Date().toISOString(),
    operatingSystem: 'Amazon Linux 2',
    totalMemory: 4096,
    cpuCount: 2,
    diskSpace: 50,
    cpuLoad: 25,
    memoryUsage: 65,
    diskUsage: 45,
    agentVersion: '2.5.0',
    pendingActions: 0
  },
  {
    id: '2',
    hostname: 'dev-db-01',
    status: 'offline',
    lastSeen: new Date(Date.now() - 3600000).toISOString(),
    operatingSystem: 'Ubuntu',
    totalMemory: 8192,
    cpuCount: 2,
    diskSpace: 100,
    cpuLoad: 0,
    memoryUsage: 0,
    diskUsage: 35,
    agentVersion: '2.5.0',
    pendingActions: 2
  }
];

class TacticalRMMService {
  private static instance: TacticalRMMService;
  private config?: RMMConfig;

  private constructor() {}

  static getInstance(config?: RMMConfig): TacticalRMMService {
    if (!TacticalRMMService.instance) {
      TacticalRMMService.instance = new TacticalRMMService();
    }
    if (config) {
      TacticalRMMService.instance.config = config;
    }
    return TacticalRMMService.instance;
  }

  async getAgents(): Promise<Agent[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockAgents;
  }

  async installAgent(hostname: string, os: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`Installing agent on ${hostname} (${os})`);
  }

  async initiateRemoteSession(agentId: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const agent = mockAgents.find(a => a.id === agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }
    
    if (agent.status === 'offline') {
      throw new Error('Agent is offline');
    }

    // Create a mock terminal interface
    const terminalWindow = window.open('', '_blank', 'width=800,height=600');
    if (terminalWindow) {
      terminalWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Remote Terminal - ${agent.hostname}</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                background: #1e1e1e;
                color: #fff;
                font-family: 'Courier New', monospace;
              }
              .terminal {
                background: #000;
                padding: 20px;
                border-radius: 5px;
                height: calc(100vh - 80px);
                overflow: auto;
                line-height: 1.5;
              }
              .header {
                margin-bottom: 20px;
                padding-bottom: 20px;
                border-bottom: 1px solid #333;
              }
              .status {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 3px;
                font-size: 12px;
                margin-left: 10px;
              }
              .status.online {
                background: #198754;
                color: white;
              }
              .status.offline {
                background: #dc3545;
                color: white;
              }
              .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
                margin: 20px 0;
              }
              .info-item {
                color: #888;
              }
              .info-item span {
                color: #fff;
                margin-left: 10px;
              }
              .prompt {
                color: #00ff00;
                margin-top: 20px;
              }
              .cursor {
                display: inline-block;
                width: 8px;
                height: 15px;
                background: #fff;
                margin-left: 5px;
                animation: blink 1s infinite;
              }
              @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0; }
              }
            </style>
          </head>
          <body>
            <div class="terminal">
              <div class="header">
                <h2 style="margin:0">
                  ${agent.hostname}
                  <span class="status ${agent.status}">${agent.status}</span>
                </h2>
              </div>
              
              <div class="info-grid">
                <div class="info-item">Operating System:<span>${agent.operatingSystem}</span></div>
                <div class="info-item">Agent Version:<span>${agent.agentVersion}</span></div>
                <div class="info-item">CPU Cores:<span>${agent.cpuCount}</span></div>
                <div class="info-item">Memory:<span>${agent.totalMemory}MB</span></div>
                <div class="info-item">Disk Space:<span>${agent.diskSpace}GB</span></div>
                <div class="info-item">Last Seen:<span>${new Date(agent.lastSeen).toLocaleString()}</span></div>
                <div class="info-item">CPU Load:<span>${agent.cpuLoad}%</span></div>
                <div class="info-item">Memory Usage:<span>${agent.memoryUsage}%</span></div>
              </div>

              <div style="color: #888;">Establishing secure connection...</div>
              <div style="color: #888;">Authenticating...</div>
              <div style="color: #0f0;">Connection established!</div>
              
              <div class="prompt">
                [root@${agent.hostname} ~]# <span class="cursor"></span>
              </div>
            </div>
          </body>
        </html>
      `);
    }
  }
}

export default TacticalRMMService;