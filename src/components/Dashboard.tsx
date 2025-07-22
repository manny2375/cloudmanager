import { useState, useEffect } from 'react';
import { 
  Monitor, 
  Plus, 
  Settings, 
  Moon, 
  Sun, 
  Power, 
  KeyRound,
  Server,
  Activity,
  DollarSign,
  TrendingUp,
  Cloud,
  Cpu,
  HardDrive,
  Network,
  BarChart3,
  FileText,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import apiClient from '../lib/api';

interface VM {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'pending' | 'error';
  provider: 'aws' | 'azure' | 'proxmox';
  instanceType: string;
  cpu: number;
  memory: number;
  storage: number;
  cost: number;
  uptime: string;
  location: string;
}

interface DashboardProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  onViewLogs: () => void;
  onViewMetrics: () => void;
}

export function Dashboard({ darkMode, onToggleDarkMode, onLogout, onViewLogs, onViewMetrics }: DashboardProps) {
  const [vms, setVms] = useState<VM[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'aws' | 'azure' | 'proxmox'>('aws');
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    aws_secret: false,
    azure_secret: false,
    proxmox_password: false
  });

  // Load VMs from API
  useEffect(() => {
    const loadVMs = async () => {
      try {
        setIsLoading(true);
        const result = await apiClient.getVMs();
        if (result.error) {
          console.error('Failed to load VMs:', result.error);
          setVms([]);
        } else {
          setVms(result.data || []);
        }
      } catch (error) {
        console.error('Error loading VMs:', error);
        setVms([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadVMs();
  }, []);

  const handleSaveCredentials = async () => {
    setIsSavingCredentials(true);
    
    // TODO: Implement actual credential saving to backend
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    
    setIsSavingCredentials(false);
    setShowCredentialsModal(false);
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-500';
      case 'stopped':
        return 'text-red-500';
      case 'pending':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'aws':
        return <Cloud className="w-4 h-4 text-orange-500" />;
      case 'azure':
        return <Cloud className="w-4 h-4 text-blue-500" />;
      case 'proxmox':
        return <Server className="w-4 h-4 text-green-500" />;
      default:
        return <Server className="w-4 h-4 text-gray-500" />;
    }
  };

  const totalCost = vms.reduce((sum, vm) => sum + vm.cost, 0);
  const runningVMs = vms.filter(vm => vm.status === 'running').length;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Monitor className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold">Cloud Manager</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCredentialsModal(true)}
                className={`p-2 rounded-md ${
                  darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Cloud Provider Credentials"
              >
                <KeyRound className="w-5 h-5" />
              </button>
              <button
                onClick={onToggleDarkMode}
                className={`p-2 rounded-md ${
                  darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={onLogout}
                className={`p-2 rounded-md ${
                  darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Logout"
              >
                <Power className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
            <div className="flex items-center">
              <Server className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total VMs</p>
                <p className="text-2xl font-semibold">{vms.length}</p>
              </div>
            </div>
          </div>
          
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Running</p>
                <p className="text-2xl font-semibold">{runningVMs}</p>
              </div>
            </div>
          </div>
          
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-yellow-500" />
              <div className="ml-4">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Monthly Cost</p>
                <p className="text-2xl font-semibold">${totalCost.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Efficiency</p>
                <p className="text-2xl font-semibold">94%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={onViewLogs}
            className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} rounded-lg shadow p-6 text-left transition-colors`}
          >
            <div>
              <FileText className="w-8 h-8 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">System Logs</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                View logs from AWS, Azure, and Proxmox
              </p>
            </div>
          </button>

          <button
            onClick={onViewMetrics}
            className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} rounded-lg shadow p-6 text-left transition-colors`}
          >
            <div>
              <BarChart3 className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Performance Metrics</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Monitor CPU, memory, and network usage
              </p>
            </div>
          </button>

          <button className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} rounded-lg shadow p-6 text-left transition-colors`}>
            <div>
              <Settings className="w-8 h-8 text-purple-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Settings</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Configure cloud providers and preferences
              </p>
            </div>
          </button>
        </div>

        {/* Virtual Machines */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow`}>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Virtual Machines</h2>
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                New VM
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3">Loading virtual machines...</span>
              </div>
            ) : vms.length === 0 ? (
              <div className="text-center py-8">
                <Server className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No virtual machines found
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Create your first VM to get started
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Provider</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Instance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Resources</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Cost/Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {vms.map((vm) => (
                      <tr key={vm.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Server className="w-5 h-5 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium">{vm.name}</div>
                              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{vm.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            vm.status === 'running' ? 'bg-green-100 text-green-800' :
                            vm.status === 'stopped' ? 'bg-red-100 text-red-800' :
                            vm.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {vm.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getProviderIcon(vm.provider)}
                            <span className="ml-2 text-sm capitalize">{vm.provider}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{vm.instanceType}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="flex items-center mb-1">
                              <Cpu className="w-3 h-3 mr-1" />
                              {vm.cpu} vCPU
                            </div>
                            <div className="flex items-center mb-1">
                              <HardDrive className="w-3 h-3 mr-1" />
                              {vm.memory}GB RAM
                            </div>
                            <div className="flex items-center">
                              <Network className="w-3 h-3 mr-1" />
                              {vm.storage}GB
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">${vm.cost.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                          <button className="text-red-600 hover:text-red-900">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Cloud Provider Credentials Modal */}
      {showCredentialsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Cloud Provider Credentials</h3>
                <button
                  onClick={() => setShowCredentialsModal(false)}
                  className={`p-2 rounded-md ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Provider Tabs */}
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex space-x-1">
                {(['aws', 'azure', 'proxmox'] as const).map((provider) => (
                  <button
                    key={provider}
                    onClick={() => setSelectedProvider(provider)}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedProvider === provider
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                        : darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {provider === 'aws' && <Cloud className="w-4 h-4 mr-2 text-orange-500" />}
                    {provider === 'azure' && <Cloud className="w-4 h-4 mr-2 text-blue-500" />}
                    {provider === 'proxmox' && <Server className="w-4 h-4 mr-2 text-green-500" />}
                    {provider.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-6">
              {/* Security Notice */}
              <div className={`mb-6 p-4 rounded-md ${darkMode ? 'bg-blue-900 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex items-start">
                  <KeyRound className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className={`text-sm font-medium ${darkMode ? 'text-blue-100' : 'text-blue-800'}`}>
                      Security Notice
                    </h4>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                      Your credentials are encrypted and stored securely. We recommend using service accounts with minimal required permissions.
                    </p>
                  </div>
                </div>
              </div>

              {/* AWS Credentials */}
              {selectedProvider === 'aws' && (
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Access Key ID *
                    </label>
                    <input
                      type="text"
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      className={`w-full px-3 py-2 border rounded-md ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Secret Access Key *
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.aws_secret ? "text" : "password"}
                        placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                        className={`w-full px-3 py-2 pr-10 border rounded-md ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('aws_secret')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.aws_secret ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Default Region
                    </label>
                    <select className={`w-full px-3 py-2 border rounded-md ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}>
                      <option value="us-east-1">US East (N. Virginia)</option>
                      <option value="us-west-2">US West (Oregon)</option>
                      <option value="eu-west-1">Europe (Ireland)</option>
                      <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Session Token (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="For temporary credentials"
                      className={`w-full px-3 py-2 border rounded-md ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                  </div>
                </div>
              )}

              {/* Azure Credentials */}
              {selectedProvider === 'azure' && (
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Subscription ID *
                    </label>
                    <input
                      type="text"
                      placeholder="12345678-1234-1234-1234-123456789012"
                      className={`w-full px-3 py-2 border rounded-md ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Client ID *
                    </label>
                    <input
                      type="text"
                      placeholder="12345678-1234-1234-1234-123456789012"
                      className={`w-full px-3 py-2 border rounded-md ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Client Secret *
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.azure_secret ? "text" : "password"}
                        placeholder="Your Azure client secret"
                        className={`w-full px-3 py-2 pr-10 border rounded-md ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('azure_secret')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.azure_secret ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Tenant ID *
                    </label>
                    <input
                      type="text"
                      placeholder="12345678-1234-1234-1234-123456789012"
                      className={`w-full px-3 py-2 border rounded-md ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                  </div>
                </div>
              )}

              {/* Proxmox Credentials */}
              {selectedProvider === 'proxmox' && (
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Server URL *
                    </label>
                    <input
                      type="url"
                      placeholder="https://proxmox.example.com:8006"
                      className={`w-full px-3 py-2 border rounded-md ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Username *
                    </label>
                    <input
                      type="text"
                      placeholder="root@pam or user@pve"
                      className={`w-full px-3 py-2 border rounded-md ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.proxmox_password ? "text" : "password"}
                        placeholder="Your Proxmox password"
                        className={`w-full px-3 py-2 pr-10 border rounded-md ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('proxmox_password')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.proxmox_password ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Node Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="pve"
                      className={`w-full px-3 py-2 border rounded-md ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="ignore-ssl"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="ignore-ssl" className={`ml-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Ignore SSL certificate errors
                      <span className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        ⚠️ Only use for development environments
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3`}>
              <button
                onClick={() => setShowCredentialsModal(false)}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                } border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCredentials}
                disabled={isSavingCredentials}
                className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isSavingCredentials ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isSavingCredentials ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Credentials'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}