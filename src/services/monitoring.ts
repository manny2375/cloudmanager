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
      const now = Date.now();
      const mockCloudWatchLogs: CloudWatchLog[] = [
        {
          timestamp: now - Math.random() * 300000,
          message: 'Instance i-1234567890abcdef0 state changed from pending to running',
          logGroup: '/aws/ec2/instances',
          logStream: 'i-1234567890abcdef0'
        },
        {
          timestamp: now - Math.random() * 240000,
          message: `CPU utilization: ${(Math.random() * 50 + 10).toFixed(1)}%`,
          logGroup: '/aws/ec2/cloudwatch',
          logStream: 'i-1234567890abcdef0'
        },
        {
          timestamp: now - Math.random() * 180000,
          message: `Memory utilization: ${(Math.random() * 40 + 40).toFixed(1)}%`,
          logGroup: '/aws/ec2/cloudwatch',
          logStream: 'i-1234567890abcdef0'
        },
        {
          timestamp: now - Math.random() * 120000,
          message: `Network packets in: ${Math.floor(Math.random() * 2000 + 500)} packets/sec`,
          logGroup: '/aws/ec2/cloudwatch',
          logStream: 'i-1234567890abcdef0'
        },
        {
          timestamp: now - Math.random() * 60000,
          message: `Disk I/O: Read ${(Math.random() * 20 + 5).toFixed(1)} MB/s, Write ${(Math.random() * 15 + 3).toFixed(1)} MB/s`,
          logGroup: '/aws/ec2/cloudwatch',
          logStream: 'i-1234567890abcdef0'
        },
        {
          timestamp: now - Math.random() * 30000,
          message: 'Auto Scaling group activity: Launched instance i-0987654321fedcba0',
          logGroup: '/aws/autoscaling',
          logStream: 'auto-scaling-group-1'
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
      const now = Date.now();
      const mockAzureLogs: AzureLog[] = [
        {
          TimeGenerated: new Date(now - Math.random() * 300000).toISOString(),
          Computer: 'dev-db-01',
          Category: 'Administrative',
          OperationName: 'Microsoft.Compute/virtualMachines/start/action',
          ResultDescription: 'Virtual machine started successfully',
          Level: 'Informational'
        },
        {
          TimeGenerated: new Date(now - Math.random() * 240000).toISOString(),
          Computer: 'dev-db-01',
          Category: 'Performance',
          OperationName: 'Microsoft.Insights/metrics/read',
          ResultDescription: `CPU percentage: ${(Math.random() * 30 + 10).toFixed(1)}%`,
          Level: 'Informational'
        },
        {
          TimeGenerated: new Date(now - Math.random() * 180000).toISOString(),
          Computer: 'dev-db-01',
          Category: 'Performance',
          OperationName: 'Microsoft.Insights/metrics/read',
          ResultDescription: `Memory available: ${(Math.random() * 4 + 4).toFixed(1)} GB`,
          Level: 'Informational'
        },
        {
          TimeGenerated: new Date(now - Math.random() * 120000).toISOString(),
          Computer: 'dev-db-01',
          Category: 'Security',
          OperationName: 'Microsoft.Security/securityStatuses/read',
          ResultDescription: 'Security scan completed - no threats detected',
          Level: 'Informational'
        },
        {
          TimeGenerated: new Date(now - Math.random() * 60000).toISOString(),
          Computer: 'prod-web-01',
          Category: 'Administrative',
          OperationName: 'Microsoft.Network/networkSecurityGroups/write',
          ResultDescription: 'Network security group rule updated',
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
      const now = Date.now();
      const mockProxmoxLogs: ProxmoxLog[] = [
        {
          timestamp: new Date(now - Math.random() * 300000).toISOString(),
          node: 'pve',
          service: 'qemu',
          level: 'info',
          message: 'VM 101 (test-app-01) started'
        },
        {
          timestamp: new Date(now - Math.random() * 240000).toISOString(),
          node: 'pve',
          service: 'pvestatd',
          level: 'info',
          message: `VM 101: CPU usage ${(Math.random() * 40 + 20).toFixed(1)}%, Memory usage ${(Math.random() * 30 + 30).toFixed(1)}%`
        },
        {
          timestamp: new Date(now - Math.random() * 180000).toISOString(),
          node: 'pve',
          service: 'pvedaemon',
          level: 'info',
          message: 'Backup job started for VM 101'
        },
        {
          timestamp: new Date(now - Math.random() * 120000).toISOString(),
          node: 'pve',
          service: 'pvestatd',
          level: 'info',
          message: `Storage usage: local-lvm ${(Math.random() * 30 + 30).toFixed(1)}% used`
        },
        {
          timestamp: new Date(now - Math.random() * 60000).toISOString(),
          node: 'pve',
          service: 'qemu',
          level: 'info',
          message: `VM 101: Network traffic - RX: ${(Math.random() * 5 + 1).toFixed(1)} MB/s, TX: ${(Math.random() * 3 + 1).toFixed(1)} MB/s`
        },
        {
          timestamp: new Date(now - Math.random() * 30000).toISOString(),
          node: 'pve',
          service: 'pve-cluster',
          level: 'info',
          message: 'Cluster status: All nodes online'
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

    // AWS CloudWatch Metrics - simulate real AWS metrics
    const awsCpuValue = 15 + Math.random() * 25 + Math.sin(Date.now() / 60000) * 5;
    const awsMemoryValue = 50 + Math.random() * 30;
    const awsNetworkValue = 500000 + Math.random() * 2000000;
    
    metrics.push(
      {
        timestamp,
        metricName: 'CPUUtilization',
        value: awsCpuValue,
        unit: 'Percent',
        dimensions: { InstanceId: 'i-1234567890abcdef0', Platform: 'AWS' }
      },
      {
        timestamp,
        metricName: 'NetworkIn',
        value: awsNetworkValue,
        unit: 'Bytes',
        dimensions: { InstanceId: 'i-1234567890abcdef0', Platform: 'AWS' }
      },
      {
        timestamp,
        metricName: 'MemoryUtilization',
        value: awsMemoryValue,
        unit: 'Percent',
        dimensions: { InstanceId: 'i-1234567890abcdef0', Platform: 'AWS' }
      }
    );

    // Azure Monitor Metrics - simulate real Azure metrics
    const azureCpuValue = 10 + Math.random() * 20 + Math.cos(Date.now() / 45000) * 3;
    const azureMemoryValue = 4000000000 + Math.random() * 2000000000; // Available memory in bytes
    const azureNetworkValue = 300000 + Math.random() * 1500000;
    
    metrics.push(
      {
        timestamp,
        metricName: 'Percentage CPU',
        value: azureCpuValue,
        unit: 'Percent',
        dimensions: { VMName: 'dev-db-01', Platform: 'Azure' }
      },
      {
        timestamp,
        metricName: 'Available Memory Bytes',
        value: azureMemoryValue,
        unit: 'Bytes',
        dimensions: { VMName: 'dev-db-01', Platform: 'Azure' }
      },
      {
        timestamp,
        metricName: 'Network In Total',
        value: azureNetworkValue,
        unit: 'Bytes',
        dimensions: { VMName: 'dev-db-01', Platform: 'Azure' }
      }
    );

    // Proxmox Metrics - simulate real Proxmox metrics
    const proxmoxCpuValue = 25 + Math.random() * 30 + Math.sin(Date.now() / 30000) * 8;
    const proxmoxMemoryValue = 40 + Math.random() * 35;
    const proxmoxNetworkValue = 800000 + Math.random() * 1800000;
    
    metrics.push(
      {
        timestamp,
        metricName: 'cpu',
        value: proxmoxCpuValue,
        unit: 'Percent',
        dimensions: { VMID: '101', Platform: 'Proxmox' }
      },
      {
        timestamp,
        metricName: 'memory',
        value: proxmoxMemoryValue,
        unit: 'Percent',
        dimensions: { VMID: '101', Platform: 'Proxmox' }
      },
      {
        timestamp,
        metricName: 'netin',
        value: proxmoxNetworkValue,
        unit: 'Bytes',
        dimensions: { VMID: '101', Platform: 'Proxmox' }
      }
    );

    this.metrics.push(...metrics);
    
    // Keep only last 200 metrics for performance
    if (this.metrics.length > 200) {
      this.metrics = this.metrics.slice(0, 200);
    }

    // Log collection activity
    this.logEvent('debug', `Collected ${metrics.length} metrics from AWS, Azure, and Proxmox`);

    return metrics;
  }

  // Start automatic log collection
  private startLogCollection(): void {
    // Initial collection
    this.collectAllLogs();
    
    // Collect logs every 30 seconds
    setInterval(async () => {
      await this.collectAllLogs();
    }, 30000);
  }

  private async collectAllLogs(): Promise<void> {
    try {
      const [awsLogs, azureLogs, proxmoxLogs] = await Promise.all([
        this.getAWSLogs(),
        this.getAzureLogs(),
        this.getProxmoxLogs()
      ]);

      const allLogs = [...awsLogs, ...azureLogs, ...proxmoxLogs];
      
      // Add new logs to the beginning (most recent first)
      this.logs.unshift(...allLogs);
      
      // Remove duplicates based on timestamp and message
      this.logs = this.logs.filter((log, index, self) => 
        index === self.findIndex(l => 
          l.timestamp === log.timestamp && 
          l.message === log.message && 
          l.source === log.source
        )
      );
      
      // Sort by timestamp (most recent first)
      this.logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Keep only last 1000 logs
      if (this.logs.length > 1000) {
        this.logs = this.logs.slice(0, 1000);
      }

      // Collect metrics
      await this.collectMetrics();

      this.notifySubscribers();
      
      // Log collection activity
      this.logEvent('debug', `Collected logs: ${awsLogs.length} AWS, ${azureLogs.length} Azure, ${proxmoxLogs.length} Proxmox`);
    } catch (error) {
      console.error('Error collecting logs:', error);
      this.logEvent('error', 'Failed to collect logs from cloud providers', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
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