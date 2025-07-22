interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: Record<string, any>;
  source: 'aws' | 'azure' | 'proxmox' | 'app';
  vmId?: string;
  userId?: string;
}

interface MetricData {
  timestamp: string;
  metricName: string;
  value: number;
  unit: string;
  dimensions?: Record<string, string>;
}

interface CloudWatchLog {
  timestamp: number;
  message: string;
  logGroup: string;
  logStream: string;
}

interface AzureLog {
  TimeGenerated: string;
  Computer: string;
  Category: string;
  OperationName: string;
  ResultDescription: string;
  Level: string;
}

interface ProxmoxLog {
  timestamp: string;
  node: string;
  service: string;
  level: string;
  message: string;
}

class CloudMonitoringService {
  private static instance: CloudMonitoringService;
  private logs: LogEntry[] = [];
  private metrics: MetricData[] = [];
  private subscribers: ((logs: LogEntry[]) => void)[] = [];

  private constructor() {
    this.startLogCollection();
  }

  static getInstance(): CloudMonitoringService {
    if (!CloudMonitoringService.instance) {
      CloudMonitoringService.instance = new CloudMonitoringService();
    }
    return CloudMonitoringService.instance;
  }

  // AWS CloudWatch Integration
  async getAWSLogs(logGroupName: string = '/aws/ec2/instances'): Promise<LogEntry[]> {
    try {
      // Simulate AWS CloudWatch Logs API call
      const mockCloudWatchLogs: CloudWatchLog[] = [
        {
          timestamp: Date.now() - 300000,
          message: 'Instance i-1234567890abcdef0 state changed from pending to running',
          logGroup: '/aws/ec2/instances',
          logStream: 'i-1234567890abcdef0'
        },
        {
          timestamp: Date.now() - 240000,
          message: 'CPU utilization: 25.4%',
          logGroup: '/aws/ec2/cloudwatch',
          logStream: 'i-1234567890abcdef0'
        },
        {
          timestamp: Date.now() - 180000,
          message: 'Memory utilization: 65.2%',
          logGroup: '/aws/ec2/cloudwatch',
          logStream: 'i-1234567890abcdef0'
        },
        {
          timestamp: Date.now() - 120000,
          message: 'Network packets in: 1,245 packets/sec',
          logGroup: '/aws/ec2/cloudwatch',
          logStream: 'i-1234567890abcdef0'
        },
        {
          timestamp: Date.now() - 60000,
          message: 'Disk I/O: Read 15.2 MB/s, Write 8.7 MB/s',
          logGroup: '/aws/ec2/cloudwatch',
          logStream: 'i-1234567890abcdef0'
        }
      ];

      return mockCloudWatchLogs.map(log => ({
        timestamp: new Date(log.timestamp).toISOString(),
        level: this.determineLogLevel(log.message),
        message: log.message,
        source: 'aws',
        metadata: {
          logGroup: log.logGroup,
          logStream: log.logStream
        }
      }));
    } catch (error) {
      console.error('Failed to fetch AWS logs:', error);
      return [];
    }
  }

  // Azure Monitor Integration
  async getAzureLogs(resourceGroup: string = 'cloud-manager-rg'): Promise<LogEntry[]> {
    try {
      // Simulate Azure Monitor Logs API call
      const mockAzureLogs: AzureLog[] = [
        {
          TimeGenerated: new Date(Date.now() - 300000).toISOString(),
          Computer: 'dev-db-01',
          Category: 'Administrative',
          OperationName: 'Microsoft.Compute/virtualMachines/start/action',
          ResultDescription: 'Virtual machine started successfully',
          Level: 'Informational'
        },
        {
          TimeGenerated: new Date(Date.now() - 240000).toISOString(),
          Computer: 'dev-db-01',
          Category: 'Performance',
          OperationName: 'Microsoft.Insights/metrics/read',
          ResultDescription: 'CPU percentage: 15.8%',
          Level: 'Informational'
        },
        {
          TimeGenerated: new Date(Date.now() - 180000).toISOString(),
          Computer: 'dev-db-01',
          Category: 'Performance',
          OperationName: 'Microsoft.Insights/metrics/read',
          ResultDescription: 'Memory available: 6.2 GB',
          Level: 'Informational'
        },
        {
          TimeGenerated: new Date(Date.now() - 120000).toISOString(),
          Computer: 'dev-db-01',
          Category: 'Security',
          OperationName: 'Microsoft.Security/securityStatuses/read',
          ResultDescription: 'Security scan completed - no threats detected',
          Level: 'Informational'
        }
      ];

      return mockAzureLogs.map(log => ({
        timestamp: log.TimeGenerated,
        level: this.mapAzureLogLevel(log.Level),
        message: `${log.OperationName}: ${log.ResultDescription}`,
        source: 'azure',
        metadata: {
          computer: log.Computer,
          category: log.Category,
          operationName: log.OperationName
        }
      }));
    } catch (error) {
      console.error('Failed to fetch Azure logs:', error);
      return [];
    }
  }

  // Proxmox Logging Integration
  async getProxmoxLogs(node: string = 'pve'): Promise<LogEntry[]> {
    try {
      // Simulate Proxmox API call for logs
      const mockProxmoxLogs: ProxmoxLog[] = [
        {
          timestamp: new Date(Date.now() - 300000).toISOString(),
          node: 'pve',
          service: 'qemu',
          level: 'info',
          message: 'VM 101 (test-app-01) started'
        },
        {
          timestamp: new Date(Date.now() - 240000).toISOString(),
          node: 'pve',
          service: 'pvestatd',
          level: 'info',
          message: 'VM 101: CPU usage 35.2%, Memory usage 45.8%'
        },
        {
          timestamp: new Date(Date.now() - 180000).toISOString(),
          node: 'pve',
          service: 'pvedaemon',
          level: 'info',
          message: 'Backup job started for VM 101'
        },
        {
          timestamp: new Date(Date.now() - 120000).toISOString(),
          node: 'pve',
          service: 'pvestatd',
          level: 'info',
          message: 'Storage usage: local-lvm 45.2% used'
        },
        {
          timestamp: new Date(Date.now() - 60000).toISOString(),
          node: 'pve',
          service: 'qemu',
          level: 'info',
          message: 'VM 101: Network traffic - RX: 2.1 MB/s, TX: 1.8 MB/s'
        }
      ];

      return mockProxmoxLogs.map(log => ({
        timestamp: log.timestamp,
        level: log.level as 'info' | 'warn' | 'error' | 'debug',
        message: log.message,
        source: 'proxmox',
        metadata: {
          node: log.node,
          service: log.service
        }
      }));
    } catch (error) {
      console.error('Failed to fetch Proxmox logs:', error);
      return [];
    }
  }

  // Application Logging
  logEvent(level: 'info' | 'warn' | 'error' | 'debug', message: string, metadata?: Record<string, any>, vmId?: string, userId?: string): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      source: 'app',
      vmId,
      userId
    };

    this.logs.unshift(logEntry);
    
    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(0, 1000);
    }

    // Notify subscribers
    this.notifySubscribers();

    // Console output for development
    const consoleMethod = level === 'error' ? console.error : 
                         level === 'warn' ? console.warn : 
                         level === 'debug' ? console.debug : console.log;
    
    consoleMethod(`[${level.toUpperCase()}] ${message}`, metadata);
  }

  // Collect metrics from cloud providers
  async collectMetrics(): Promise<MetricData[]> {
    const metrics: MetricData[] = [];
    const timestamp = new Date().toISOString();

    // AWS CloudWatch Metrics
    metrics.push(
      {
        timestamp,
        metricName: 'CPUUtilization',
        value: 25.4,
        unit: 'Percent',
        dimensions: { InstanceId: 'i-1234567890abcdef0', Platform: 'AWS' }
      },
      {
        timestamp,
        metricName: 'NetworkIn',
        value: 1245000,
        unit: 'Bytes',
        dimensions: { InstanceId: 'i-1234567890abcdef0', Platform: 'AWS' }
      }
    );

    // Azure Monitor Metrics
    metrics.push(
      {
        timestamp,
        metricName: 'Percentage CPU',
        value: 15.8,
        unit: 'Percent',
        dimensions: { VMName: 'dev-db-01', Platform: 'Azure' }
      },
      {
        timestamp,
        metricName: 'Available Memory Bytes',
        value: 6644967424,
        unit: 'Bytes',
        dimensions: { VMName: 'dev-db-01', Platform: 'Azure' }
      }
    );

    // Proxmox Metrics
    metrics.push(
      {
        timestamp,
        metricName: 'cpu',
        value: 35.2,
        unit: 'Percent',
        dimensions: { VMID: '101', Platform: 'Proxmox' }
      },
      {
        timestamp,
        metricName: 'memory',
        value: 45.8,
        unit: 'Percent',
        dimensions: { VMID: '101', Platform: 'Proxmox' }
      }
    );

    this.metrics.push(...metrics);
    
    // Keep only last 500 metrics
    if (this.metrics.length > 500) {
      this.metrics = this.metrics.slice(0, 500);
    }

    return metrics;
  }

  // Start automatic log collection
  private startLogCollection(): void {
    // Collect logs every 30 seconds
    setInterval(async () => {
      try {
        const [awsLogs, azureLogs, proxmoxLogs] = await Promise.all([
          this.getAWSLogs(),
          this.getAzureLogs(),
          this.getProxmoxLogs()
        ]);

        const allLogs = [...awsLogs, ...azureLogs, ...proxmoxLogs];
        
        // Add new logs to the beginning
        this.logs.unshift(...allLogs);
        
        // Keep only last 1000 logs
        if (this.logs.length > 1000) {
          this.logs = this.logs.slice(0, 1000);
        }

        // Collect metrics
        await this.collectMetrics();

        this.notifySubscribers();
      } catch (error) {
        console.error('Error collecting logs:', error);
      }
    }, 30000);

    // Initial collection
    setTimeout(() => {
      this.startLogCollection();
    }, 1000);
  }

  // Subscribe to log updates
  subscribe(callback: (logs: LogEntry[]) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback([...this.logs]));
  }

  // Get all logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Get logs by source
  getLogsBySource(source: 'aws' | 'azure' | 'proxmox' | 'app'): LogEntry[] {
    return this.logs.filter(log => log.source === source);
  }

  // Get logs by VM ID
  getLogsByVM(vmId: string): LogEntry[] {
    return this.logs.filter(log => log.vmId === vmId || log.metadata?.vmId === vmId);
  }

  // Get metrics
  getMetrics(): MetricData[] {
    return [...this.metrics];
  }

  // Helper methods
  private determineLogLevel(message: string): 'info' | 'warn' | 'error' | 'debug' {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('error') || lowerMessage.includes('failed')) return 'error';
    if (lowerMessage.includes('warn') || lowerMessage.includes('warning')) return 'warn';
    if (lowerMessage.includes('debug')) return 'debug';
    return 'info';
  }

  private mapAzureLogLevel(azureLevel: string): 'info' | 'warn' | 'error' | 'debug' {
    switch (azureLevel.toLowerCase()) {
      case 'error': return 'error';
      case 'warning': return 'warn';
      case 'verbose': return 'debug';
      default: return 'info';
    }
  }
}

export default CloudMonitoringService;
export type { LogEntry, MetricData };