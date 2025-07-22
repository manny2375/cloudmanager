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
    try {
      if (!this.config) {
        throw new Error('RMM configuration not set');
      }
      
      // TODO: Implement actual Tactical RMM API integration
      const response = await fetch(`${this.config.baseUrl}/api/agents/`, {
        headers: {
          'Authorization': `Token ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      return [];
    }
  }

  async installAgent(hostname: string, os: string): Promise<void> {
    try {
      if (!this.config) {
        throw new Error('RMM configuration not set');
      }
      
      // TODO: Implement actual agent installation via Tactical RMM API
      const response = await fetch(`${this.config.baseUrl}/api/agents/install/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname,
          operating_system: os
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log(`Agent installation initiated for ${hostname} (${os})`);
    } catch (error) {
      console.error('Failed to install agent:', error);
      throw error;
    }
  }

  async initiateRemoteSession(agentId: string): Promise<void> {
    try {
      if (!this.config) {
        throw new Error('RMM configuration not set');
      }
      
      // TODO: Implement actual remote session initiation via Tactical RMM API
      const response = await fetch(`${this.config.baseUrl}/api/agents/${agentId}/remote-session/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const sessionData = await response.json();
      
      // Open remote session in new window
      if (sessionData.session_url) {
        window.open(sessionData.session_url, '_blank', 'width=1200,height=800');
      } else {
        throw new Error('No session URL provided');
      }
    } catch (error) {
      console.error('Failed to initiate remote session:', error);
      throw error;
    }
  }
}

export default TacticalRMMService;