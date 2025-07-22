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
      // TODO: Implement actual AWS CloudWatch Logs API integration
      // This would require AWS SDK and proper credentials
      console.log('AWS CloudWatch Logs integration not implemented yet');
      return [];
    } catch (error) {
      console.error('Failed to fetch AWS logs:', error);
      return [];
    }
  }

  // Azure Monitor Integration
  async getAzureLogs(resourceGroup: string = 'cloud-manager-rg'): Promise<LogEntry[]> {
    try {
      // TODO: Implement actual Azure Monitor Logs API integration
      // This would require Azure SDK and proper credentials
      console.log('Azure Monitor Logs integration not implemented yet');
      return [];
    } catch (error) {
      console.error('Failed to fetch Azure logs:', error);
      return [];
    }
  }

  // Proxmox Logging Integration
  async getProxmoxLogs(node: string = 'pve'): Promise<LogEntry[]> {
    try {
      // TODO: Implement actual Proxmox API integration
      // This would require Proxmox API credentials and proper authentication
      console.log('Proxmox API integration not implemented yet');
      return [];
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

    // TODO: Implement actual AWS CloudWatch metrics collection
    // TODO: Implement actual Azure Monitor metrics collection  
    // TODO: Implement actual Proxmox metrics collection
    
    console.log('Cloud provider metrics collection not implemented yet');

    this.metrics.push(...metrics);
    
    // Keep only last 200 metrics for performance
    if (this.metrics.length > 200) {
      this.metrics = this.metrics.slice(0, 200);
    }

    // Log collection activity
    this.logEvent('debug', `Metrics collection attempted - implementation needed for cloud providers`);

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
      this.logEvent('debug', `Log collection attempted - cloud provider integrations needed`);
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