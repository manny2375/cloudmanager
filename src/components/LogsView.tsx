import { useState, useEffect } from 'react';
import { 
  Activity, 
  Filter, 
  Search, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  Bug,
  Cloud,
  Server,
  Monitor,
  Calendar,
  Clock
} from 'lucide-react';
import CloudMonitoringService, { LogEntry } from '../services/monitoring';

interface LogsViewProps {
  darkMode: boolean;
  onClose: () => void;
}

export default function LogsView({ darkMode, onClose }: LogsViewProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [selectedSource, setSelectedSource] = useState<'all' | 'aws' | 'azure' | 'proxmox' | 'app'>('all');
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const monitoring = CloudMonitoringService.getInstance();
    
    // Get initial logs
    setLogs(monitoring.getLogs());
    
    // Subscribe to log updates
    const unsubscribe = monitoring.subscribe((newLogs) => {
      setLogs(newLogs);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = logs;

    // Filter by source
    if (selectedSource !== 'all') {
      filtered = filtered.filter(log => log.source === selectedSource);
    }

    // Filter by level
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredLogs(filtered);
  }, [logs, selectedSource, selectedLevel, searchTerm]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const monitoring = CloudMonitoringService.getInstance();
    
    // Force collection of new logs
    await monitoring.collectMetrics();
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleExportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `cloud-manager-logs-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'debug':
        return <Bug className="w-4 h-4 text-purple-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'aws':
        return <Cloud className="w-4 h-4 text-orange-500" />;
      case 'azure':
        return <Cloud className="w-4 h-4 text-blue-500" />;
      case 'proxmox':
        return <Server className="w-4 h-4 text-green-500" />;
      default:
        return <Monitor className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return darkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800';
      case 'warn':
        return darkMode ? 'bg-yellow-900 text-yellow-100' : 'bg-yellow-100 text-yellow-800';
      case 'debug':
        return darkMode ? 'bg-purple-900 text-purple-100' : 'bg-purple-100 text-purple-800';
      default:
        return darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className={`h-full ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="w-6 h-6 mr-3 text-blue-500" />
            <h2 className="text-2xl font-semibold">System Logs</h2>
            <span className={`ml-3 px-2 py-1 rounded-full text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              {filteredLogs.length} entries
            </span>
          </div>
          <div className="flex items-center space-x-2">
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
            <button
              onClick={handleExportLogs}
              className={`flex items-center px-3 py-2 rounded-md ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-md border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
            </div>
          </div>

          {/* Source Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as any)}
              className={`px-3 py-2 rounded-md border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="all">All Sources</option>
              <option value="aws">AWS</option>
              <option value="azure">Azure</option>
              <option value="proxmox">Proxmox</option>
              <option value="app">Application</option>
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as any)}
              className={`px-3 py-2 rounded-md border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
              <option value="debug">Debug</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="flex-1 overflow-auto">
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No logs found
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Try adjusting your filters or wait for new logs to arrive
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredLogs.map((log, index) => {
              const { date, time } = formatTimestamp(log.timestamp);
              
              return (
                <div
                  key={index}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Level Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getLogIcon(log.level)}
                    </div>

                    {/* Log Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {/* Source */}
                        <div className="flex items-center space-x-1">
                          {getSourceIcon(log.source)}
                          <span className="text-sm font-medium uppercase">
                            {log.source}
                          </span>
                        </div>

                        {/* Level Badge */}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLogLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>

                        {/* Timestamp */}
                        <div className={`flex items-center space-x-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          <Calendar className="w-3 h-3" />
                          <span>{date}</span>
                          <Clock className="w-3 h-3" />
                          <span>{time}</span>
                        </div>
                      </div>

                      {/* Message */}
                      <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'} mb-2`}>
                        {log.message}
                      </p>

                      {/* Metadata */}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <details className="cursor-pointer">
                            <summary className="hover:text-blue-500">
                              View metadata ({Object.keys(log.metadata).length} fields)
                            </summary>
                            <pre className={`mt-2 p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} overflow-x-auto`}>
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}