import { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, AreaChart, Area
} from 'recharts';
import { Activity, Cpu, HardDrive, Network, Server, Cloud, TrendingUp, TrendingDown, RefreshCw, X } from 'lucide-react';
import CloudMonitoringService, { MetricData } from '../services/monitoring';

interface MetricsViewProps {
  darkMode: boolean;
  onClose: () => void;
}

interface ChartData {
  timestamp: string;
  time: string;
  aws_cpu?: number;
  azure_cpu?: number;
  proxmox_cpu?: number;
  aws_memory?: number;
  azure_memory?: number;
  proxmox_memory?: number;
  aws_network?: number;
  azure_network?: number;
  proxmox_network?: number;
}

export default function MetricsView({ darkMode, onClose }: MetricsViewProps) {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const monitoring = CloudMonitoringService.getInstance();
    
    // Get initial metrics and start collecting from cloud providers
    const initializeMetrics = async () => {
      setIsInitialLoad(true);
      
      // Force initial collection from all providers
      await monitoring.collectMetrics();
      
      // Get all existing metrics
      const existingMetrics = monitoring.getMetrics();
      setMetrics(existingMetrics);
      processMetricsForChart(existingMetrics);
      
      setIsInitialLoad(false);
    };
    
    initializeMetrics();
    
    // Subscribe to metric updates from the monitoring service
    const unsubscribe = monitoring.subscribe(() => {
      const newMetrics = monitoring.getMetrics();
      setMetrics(newMetrics);
      processMetricsForChart(newMetrics);
    });

    // Set up auto-refresh interval if enabled
    let refreshInterval: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      refreshInterval = setInterval(async () => {
        await monitoring.collectMetrics();
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      unsubscribe();
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);

  const processMetricsForChart = (newMetrics: MetricData[]) => {
    // Group metrics by timestamp and platform for chart display
    const grouped = newMetrics.slice(0, 50).reduce((acc, metric) => {
      const time = new Date(metric.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const platform = metric.dimensions?.Platform?.toLowerCase();
      
      if (!acc[metric.timestamp]) {
        acc[metric.timestamp] = {
          timestamp: metric.timestamp,
          time
        };
      }
      
      if (platform && metric.metricName.toLowerCase().includes('cpu')) {
        acc[metric.timestamp][`${platform}_cpu`] = metric.value;
      } else if (platform && (metric.metricName.toLowerCase().includes('memory') || metric.metricName.toLowerCase().includes('available'))) {
        acc[metric.timestamp][`${platform}_memory`] = metric.value;
      } else if (platform && metric.metricName.toLowerCase().includes('network')) {
        acc[metric.timestamp][`${platform}_network`] = metric.value;
      }
      
      return acc;
    }, {} as Record<string, any>);

    const newChartData = Object.values(grouped) as ChartData[];
    
    // Sort by timestamp and keep last 20 data points
    const sortedData = newChartData
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-20);
    
    setChartData(sortedData);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const monitoring = CloudMonitoringService.getInstance();
    
    // Force collection of new metrics from all cloud providers
    await monitoring.collectMetrics();
    
    // Log the refresh activity
    monitoring.logEvent('info', 'Manual metrics refresh triggered');
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const getCurrentMetrics = () => {
    // Get the most recent metrics for each platform and metric type
    const latest = metrics.slice(0, 20);
    
    return {
      aws: {
        cpu: latest.find(m => m.dimensions?.Platform === 'AWS' && m.metricName.includes('CPU'))?.value || 0,
        memory: latest.find(m => m.dimensions?.Platform === 'AWS' && m.metricName.includes('Memory'))?.value || 0,
        network: latest.find(m => m.dimensions?.Platform === 'AWS' && m.metricName.includes('Network'))?.value || 0
      },
      azure: {
        cpu: latest.find(m => m.dimensions?.Platform === 'Azure' && m.metricName.includes('CPU'))?.value || 0,
        memory: latest.find(m => m.dimensions?.Platform === 'Azure' && m.metricName.includes('Memory'))?.value || 0,
        network: latest.find(m => m.dimensions?.Platform === 'Azure' && m.metricName.includes('Network'))?.value || 0
      },
      proxmox: {
        cpu: latest.find(m => m.dimensions?.Platform === 'Proxmox' && m.metricName.includes('cpu'))?.value || 0,
        memory: latest.find(m => m.dimensions?.Platform === 'Proxmox' && m.metricName.includes('memory'))?.value || 0,
        network: 0
      }
    };
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    
    // Handle percentage values (for memory usage)
    if (bytes < 100 && bytes > 0) {
      return `${bytes.toFixed(1)}%`;
    }
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const currentMetrics = getCurrentMetrics();
  
  const getMetricStats = () => {
    return {
      total: metrics.length,
      lastUpdate: metrics.length > 0 ? new Date(metrics[0].timestamp).toLocaleTimeString() : 'Never'
    };
  };

  return (
    <div className={`h-full ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="w-6 h-6 mr-3 text-green-500" />
            <h2 className="text-2xl font-semibold">Performance Metrics</h2>
            <div className="ml-3 flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                {getMetricStats().total} metrics
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className={`flex items-center px-3 py-2 rounded-md ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Auto-refresh</span>
            </label>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center px-3 py-2 rounded-md ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              } ${isRefreshing ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className={`px-3 py-2 rounded-md border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Metrics Status */}
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="text-sm text-center">
            <span className="opacity-75">Last updated: </span>
            <span className="font-medium">{getMetricStats().lastUpdate}</span>
            {isInitialLoad && <span className="ml-2 text-blue-500">Loading metrics...</span>}
          </div>
        </div>

        {/* Current Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* AWS Metrics */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex items-center mb-3">
              <Cloud className="w-5 h-5 mr-2 text-orange-500" />
              <h3 className="text-lg font-medium">AWS</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm opacity-75">CPU Usage</span>
                <span className="text-sm font-medium">{currentMetrics.aws.cpu.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm opacity-75">Memory</span>
                <span className="text-sm font-medium">{currentMetrics.aws.memory > 1000 ? formatBytes(currentMetrics.aws.memory) : `${currentMetrics.aws.memory.toFixed(1)}%`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm opacity-75">Network In</span>
                <span className="text-sm font-medium">{currentMetrics.aws.network > 1000 ? formatBytes(currentMetrics.aws.network) : `${currentMetrics.aws.network.toFixed(1)} MB/s`}</span>
              </div>
            </div>
          </div>

          {/* Azure Metrics */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex items-center mb-3">
              <Cloud className="w-5 h-5 mr-2 text-blue-500" />
              <h3 className="text-lg font-medium">Azure</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm opacity-75">CPU Usage</span>
                <span className="text-sm font-medium">{currentMetrics.azure.cpu.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm opacity-75">Memory</span>
                <span className="text-sm font-medium">{currentMetrics.azure.memory > 1000 ? formatBytes(currentMetrics.azure.memory) : `${currentMetrics.azure.memory.toFixed(1)}%`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm opacity-75">Network</span>
                <span className="text-sm font-medium">{currentMetrics.azure.network > 1000 ? formatBytes(currentMetrics.azure.network) : `${currentMetrics.azure.network.toFixed(1)} MB/s`}</span>
              </div>
            </div>
          </div>

          {/* Proxmox Metrics */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex items-center mb-3">
              <Server className="w-5 h-5 mr-2 text-green-500" />
              <h3 className="text-lg font-medium">Proxmox</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm opacity-75">CPU Usage</span>
                <span className="text-sm font-medium">{currentMetrics.proxmox.cpu.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm opacity-75">Memory Usage</span>
                <span className="text-sm font-medium">{currentMetrics.proxmox.memory.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm opacity-75">Status</span>
                <span className="text-sm font-medium text-green-500">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CPU Usage Chart */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex items-center mb-4">
              <Cpu className="w-5 h-5 mr-2 text-blue-500" />
              <h3 className="text-lg font-medium">CPU Usage Over Time</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="time" 
                    stroke={darkMode ? '#9CA3AF' : '#4B5563'}
                    fontSize={12}
                  />
                  <YAxis 
                    stroke={darkMode ? '#9CA3AF' : '#4B5563'}
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                      border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                      color: darkMode ? '#F3F4F6' : '#111827'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="aws_cpu" 
                    stroke="#F97316" 
                    strokeWidth={2}
                    dot={false}
                    name="AWS CPU %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="azure_cpu" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={false}
                    name="Azure CPU %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="proxmox_cpu" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={false}
                    name="Proxmox CPU %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Memory Usage Chart */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex items-center mb-4">
              <Server className="w-5 h-5 mr-2 text-green-500" />
              <h3 className="text-lg font-medium">Memory Usage Over Time</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="time" 
                    stroke={darkMode ? '#9CA3AF' : '#4B5563'}
                    fontSize={12}
                  />
                  <YAxis 
                    stroke={darkMode ? '#9CA3AF' : '#4B5563'}
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                      border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                      color: darkMode ? '#F3F4F6' : '#111827'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="aws_memory" 
                    stackId="1"
                    stroke="#F97316" 
                    fill="#F97316"
                    fillOpacity={0.3}
                    name="AWS Memory %"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="azure_memory" 
                    stackId="2"
                    stroke="#3B82F6" 
                    fill="#3B82F6"
                    fillOpacity={0.3}
                    name="Azure Memory %"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="proxmox_memory" 
                    stackId="3"
                    stroke="#10B981" 
                    fill="#10B981"
                    fillOpacity={0.3}
                    name="Proxmox Memory %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Network Traffic Chart */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex items-center mb-4">
            <Network className="w-5 h-5 mr-2 text-purple-500" />
            <h3 className="text-lg font-medium">Network Traffic</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="time" 
                  stroke={darkMode ? '#9CA3AF' : '#4B5563'}
                  fontSize={12}
                />
                <YAxis 
                  stroke={darkMode ? '#9CA3AF' : '#4B5563'}
                  fontSize={12}
                  tickFormatter={(value) => formatBytes(value)}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                    color: darkMode ? '#F3F4F6' : '#111827'
                  }}
                  formatter={(value: number) => [formatBytes(value), '']}
                />
                <Legend />
                <Bar 
                  dataKey="aws_network" 
                  fill="#F97316" 
                  name="AWS Network"
                />
                <Bar 
                  dataKey="azure_network" 
                  fill="#3B82F6" 
                  name="Azure Network"
                />
                <Bar 
                  dataKey="proxmox_network" 
                  fill="#10B981" 
                  name="Proxmox Network"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}