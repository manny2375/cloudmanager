import { useState } from 'react';
import { 
  Cloud, 
  Server, 
  Settings, 
  Activity, 
  Database,
  Monitor,
  Power,
  RefreshCw,
  PlusCircle,
  AlertCircle,
  X,
  Save,
  AlertTriangle,
  DollarSign,
  Moon,
  Sun,
  Trash2,
  KeyRound
} from 'lucide-react';

interface VirtualMachine {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  platform: 'aws' | 'azure' | 'proxmox';
  type: string;
  ip: string;
  cpu: number;
  memory: number;
  storage: number;
  costPerHour: number;
  os: string;
}

interface DashboardProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  onViewLogs?: () => void;
  onViewMetrics?: () => void;
}

export function Dashboard({ darkMode, onToggleDarkMode, onLogout, onViewLogs, onViewMetrics }: DashboardProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'aws' | 'azure' | 'proxmox'>('all');
  const [isNewVMModalOpen, setIsNewVMModalOpen] = useState(false);
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
  const [isStopConfirmationOpen, setIsStopConfirmationOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [vmToStop, setVmToStop] = useState<VirtualMachine | null>(null);
  const [vmToDelete, setVmToDelete] = useState<VirtualMachine | null>(null);
  const [selectedVM, setSelectedVM] = useState<VirtualMachine | null>(null);
  const [isCreatingVM, setIsCreatingVM] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isStoppingVM, setIsStoppingVM] = useState(false);
  const [isDeletingVM, setIsDeletingVM] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'aws' | 'azure' | 'proxmox'>('aws');
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);

  const [virtualMachines] = useState<VirtualMachine[]>([
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
  ]);

  const calculateMonthlyCost = (vm: VirtualMachine) => {
    if (vm.status === 'stopped') return 0;
    return (vm.costPerHour * 24 * 30).toFixed(2);
  };

  const getTotalMonthlyCost = () => {
    return virtualMachines
      .filter(vm => vm.status === 'running')
      .reduce((total, vm) => total + vm.costPerHour * 24 * 30, 0)
      .toFixed(2);
  };

  const filteredVMs = selectedPlatform === 'all' 
    ? virtualMachines 
    : virtualMachines.filter(vm => vm.platform === selectedPlatform);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return darkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800';
      case 'stopped':
        return darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-800';
      case 'error':
        return darkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800';
      default:
        return darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'aws':
        return <Cloud className="w-5 h-5 text-orange-500" />;
      case 'azure':
        return <Cloud className="w-5 h-5 text-blue-500" />;
      case 'proxmox':
        return <Server className="w-5 h-5 text-green-500" />;
      default:
        return <Server className="w-5 h-5" />;
    }
  };

  const formatResources = (vm: VirtualMachine) => {
    return `CPU:${vm.cpu}C | RAM:${vm.memory}G | HD:${vm.storage}G`;
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={darkMode ? 'bg-gray-800 shadow-sm' : 'bg-white shadow-sm'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Monitor className={`h-8 w-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <h1 className="ml-3 text-2xl font-semibold">Cloud Manager</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onToggleDarkMode}
                className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? (
                  <Sun className="w-6 h-6 text-yellow-400" />
                ) : (
                  <Moon className="w-6 h-6 text-gray-600" />
                )}
              </button>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                aria-label="Open settings"
              >
                <Settings className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              </button>
              <button 
                onClick={onViewMetrics}
                className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                aria-label="View activity"
              >
                <Activity className={darkMode ? 'w-6 h-6 text-gray-300' : 'w-6 h-6 text-gray-600'} />
              </button>
              <button 
                onClick={onViewLogs}
                className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                aria-label="View logs"
              >
                <Database className={darkMode ? 'w-6 h-6 text-gray-300' : 'w-6 h-6 text-gray-600'} />
              </button>
              <button
                onClick={() => setIsCredentialsModalOpen(true)}
                className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                aria-label="Cloud Provider Credentials"
              >
                <KeyRound className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              </button>
              <button
                onClick={onLogout}
                className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                aria-label="Logout"
              >
                <Power className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
            <div className="flex items-center">
              <Server className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
              <div className="ml-4">
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total VMs</p>
                <p className="text-2xl font-semibold">{virtualMachines.length}</p>
              </div>
            </div>
          </div>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
            <div className="flex items-center">
              <Power className={`w-8 h-8 ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
              <div className="ml-4">
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Running</p>
                <p className="text-2xl font-semibold">
                  {virtualMachines.filter(vm => vm.status === 'running').length}
                </p>
              </div>
            </div>
          </div>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
            <div className="flex items-center">
              <Database className={`w-8 h-8 ${darkMode ? 'text-purple-400' : 'text-purple-500'}`} />
              <div className="ml-4">
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Storage</p>
                <p className="text-2xl font-semibold">
                  {virtualMachines.reduce((acc, vm) => acc + vm.storage, 0)}GB
                </p>
              </div>
            </div>
          </div>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
            <div className="flex items-center">
              <DollarSign className={`w-8 h-8 ${darkMode ? 'text-emerald-400' : 'text-emerald-500'}`} />
              <div className="ml-4">
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Monthly Cost</p>
                <p className="text-2xl font-semibold">
                  ${getTotalMonthlyCost()}
                </p>
              </div>
            </div>
          </div>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
            <div className="flex items-center">
              <Activity className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
              <div className="ml-4">
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Activity</p>
                <p className="text-2xl font-semibold">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedPlatform('all')}
              className={`px-4 py-2 rounded-md ${
                selectedPlatform === 'all' 
                  ? darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-800'
                  : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Platforms
            </button>
            <button
              onClick={() => setSelectedPlatform('aws')}
              className={`px-4 py-2 rounded-md ${
                selectedPlatform === 'aws' 
                  ? darkMode ? 'bg-orange-900 text-orange-100' : 'bg-orange-100 text-orange-800'
                  : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              AWS
            </button>
            <button
              onClick={() => setSelectedPlatform('azure')}
              className={`px-4 py-2 rounded-md ${
                selectedPlatform === 'azure' 
                  ? darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-800'
                  : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Azure
            </button>
            <button
              onClick={() => setSelectedPlatform('proxmox')}
              className={`px-4 py-2 rounded-md ${
                selectedPlatform === 'proxmox' 
                  ? darkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800'
                  : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Proxmox
            </button>
          </div>
          <div className="flex space-x-2">
            <button className={`flex items-center px-4 py-2 rounded-md ${
              darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button 
              onClick={() => setIsNewVMModalOpen(true)}
              className={`flex items-center px-4 py-2 text-white rounded-md ${
                darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              New VM
            </button>
          </div>
        </div>

        {/* VM List */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow rounded-lg overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Name
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Status
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Platform
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Type
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    OS
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    IP Address
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Resources
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Cost
                  </th>
                  <th scope="col" className={`px-6 py-3 text-right text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {filteredVMs.map((vm) => (
                  <tr key={vm.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{vm.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(vm.status)}`}>
                        {vm.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getPlatformIcon(vm.platform)}
                        <span className={`ml-2 text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                          {vm.platform.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      {vm.type}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      {vm.os}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      {vm.ip}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        {formatResources(vm)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                          ${vm.costPerHour.toFixed(4)}/hr
                        </div>
                        <div className={darkMode ? 'text-gray-300' : 'text-gray-500'}>
                          ${calculateMonthlyCost(vm)}/mo
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-4">
                        <button 
                          onClick={() => {
                            if (vm.status === 'running') {
                              setVmToStop(vm);
                              setIsStopConfirmationOpen(true);
                            }
                          }}
                          className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'}`}
                        >
                          {vm.status === 'running' ? 'Stop' : 'Start'}
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedVM(vm);
                            setIsConfigureModalOpen(true);
                          }}
                          className={darkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-900'}
                        >
                          Configure
                        </button>
                        <button 
                          onClick={() => {
                            setVmToDelete(vm);
                            setIsDeleteConfirmationOpen(true);
                          }}
                          className={darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Cloud Provider Credentials Modal */}
      {isCredentialsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full p-6`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <KeyRound className="w-6 h-6 mr-2 text-blue-500" />
                <h3 className="text-xl font-semibold">Cloud Provider Credentials</h3>
              </div>
              <button
                onClick={() => setIsCredentialsModalOpen(false)}
                className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Provider Selection */}
              <div>
                <h4 className="text-lg font-medium mb-3">Select Cloud Provider</h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedProvider('aws')}
                    className={`flex items-center px-4 py-2 rounded-md ${
                      selectedProvider === 'aws' 
                        ? darkMode ? 'bg-orange-900 text-orange-100' : 'bg-orange-100 text-orange-800'
                        : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Cloud className="w-4 h-4 mr-2 text-orange-500" />
                    AWS
                  </button>
                  <button
                    onClick={() => setSelectedProvider('azure')}
                    className={`flex items-center px-4 py-2 rounded-md ${
                      selectedProvider === 'azure' 
                        ? darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-800'
                        : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Cloud className="w-4 h-4 mr-2 text-blue-500" />
                    Azure
                  </button>
                  <button
                    onClick={() => setSelectedProvider('proxmox')}
                    className={`flex items-center px-4 py-2 rounded-md ${
                      selectedProvider === 'proxmox' 
                        ? darkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800'
                        : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Server className="w-4 h-4 mr-2 text-green-500" />
                    Proxmox
                  </button>
                </div>
              </div>
              {/* AWS Credentials */}
              {selectedProvider === 'aws' && (
                <div>
                  <h4 className="text-lg font-medium mb-3">AWS Credentials</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                        Access Key ID *
                      </label>
                      <input
                        type="text"
                        placeholder="AKIA..."
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                        Secret Access Key *
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••••••••••••••••••••••••••••••••••"
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                        Default Region
                      </label>
                      <select
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="us-east-1">US East (N. Virginia)</option>
                        <option value="us-west-2">US West (Oregon)</option>
                        <option value="eu-west-1">Europe (Ireland)</option>
                        <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                        Session Token (Optional)
                      </label>
                      <input
                        type="password"
                        placeholder="For temporary credentials"
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Azure Credentials */}
              {selectedProvider === 'azure' && (
                <div>
                  <h4 className="text-lg font-medium mb-3">Azure Credentials</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                        Subscription ID *
                      </label>
                      <input
                        type="text"
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                        Client ID *
                      </label>
                      <input
                        type="text"
                        placeholder="Application (client) ID"
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                        Client Secret *
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••••••••••••••••••••••••••••••••••"
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                        Tenant ID *
                      </label>
                      <input
                        type="text"
                        placeholder="Directory (tenant) ID"
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Proxmox Credentials */}
              {selectedProvider === 'proxmox' && (
                <div>
                  <h4 className="text-lg font-medium mb-3">Proxmox Credentials</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                        Server URL *
                      </label>
                      <input
                        type="url"
                        placeholder="https://proxmox.example.com:8006"
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                        Username *
                      </label>
                      <input
                        type="text"
                        placeholder="root@pam"
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                        Password *
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••••••••••••••••••••••••••••••••••"
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                        Node Name
                      </label>
                      <input
                        type="text"
                        placeholder="pve"
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="ignore-ssl"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="ignore-ssl" className={`ml-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Ignore SSL certificate errors (not recommended for production)
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-yellow-900 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border`}>
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h5 className={`font-medium ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                      Security Notice
                    </h5>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                      Your credentials will be encrypted and stored securely. We recommend using dedicated service accounts 
                      with minimal required permissions for cloud provider access.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsCredentialsModalOpen(false)}
                className={`px-4 py-2 rounded-md ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsSavingCredentials(true);
                  // Simulate API call to save credentials
                  setTimeout(() => {
                    setIsSavingCredentials(false);
                    setIsCredentialsModalOpen(false);
                    // Show success message or refresh provider list
                  }, 2000);
                }}
                disabled={isSavingCredentials}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center ${
                  isSavingCredentials ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isSavingCredentials ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Credentials
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stop Confirmation Modal */}
      {isStopConfirmationOpen && vmToStop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-md w-full p-6`}>
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
              <h3 className="text-xl font-semibold">Stop Virtual Machine</h3>
            </div>
            <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Are you sure you want to stop {vmToStop.name}? This will interrupt any running processes.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setIsStopConfirmationOpen(false);
                  setVmToStop(null);
                }}
                className={`px-4 py-2 rounded-md ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsStoppingVM(true);
                  // Simulate API call
                  setTimeout(() => {
                    setIsStoppingVM(false);
                    setIsStopConfirmationOpen(false);
                    setVmToStop(null);
                  }, 2000);
                }}
                disabled={isStoppingVM}
                className={`px-4 py-2 rounded-md bg-red-600 text-white flex items-center ${
                  isStoppingVM ? 'opacity-75 cursor-not-allowed' : 'hover:bg-red-700'
                }`}
              >
                {isStoppingVM ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Stopping...
                  </>
                ) : (
                  'Stop VM'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full p-6`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Settings className="w-6 h-6 mr-2 text-blue-500" />
                <h3 className="text-xl font-semibold">Settings</h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Theme Settings */}
              <div>
                <h4 className="text-lg font-medium mb-3">Appearance</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      Dark Mode
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Toggle between light and dark themes
                    </p>
                  </div>
                  <button
                    onClick={onToggleDarkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      darkMode ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        darkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <h4 className="text-lg font-medium mb-3">Notifications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        Email Notifications
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Receive email alerts for VM status changes
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        Cost Alerts
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Get notified when monthly costs exceed budget
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Auto-refresh Settings */}
              <div>
                <h4 className="text-lg font-medium mb-3">Dashboard</h4>
                <div className="space-y-3">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                      Auto-refresh Interval
                    </label>
                    <select
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      defaultValue="30"
                    >
                      <option value="10">10 seconds</option>
                      <option value="30">30 seconds</option>
                      <option value="60">1 minute</option>
                      <option value="300">5 minutes</option>
                      <option value="0">Disabled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Account Settings */}
              <div>
                <h4 className="text-lg font-medium mb-3">Account</h4>
                <div className="space-y-3">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                      Default View
                    </label>
                    <select
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      defaultValue="dashboard"
                    >
                      <option value="dashboard">Dashboard</option>
                      <option value="metrics">Metrics</option>
                      <option value="logs">Logs</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        Show Resource Usage
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Display detailed resource information in VM table
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className={`px-4 py-2 rounded-md ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Save settings logic would go here
                  setIsSettingsOpen(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New VM Modal */}
      {isNewVMModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full p-6`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <PlusCircle className="w-6 h-6 mr-2 text-blue-500" />
                <h3 className="text-xl font-semibold">Create New Virtual Machine</h3>
              </div>
              <button
                onClick={() => setIsNewVMModalOpen(false)}
                className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-lg font-medium mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                      VM Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., prod-web-02"
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                      Platform *
                    </label>
                    <select
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Select Platform</option>
                      <option value="aws">AWS</option>
                      <option value="azure">Azure</option>
                      <option value="proxmox">Proxmox</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Instance Configuration */}
              <div>
                <h4 className="text-lg font-medium mb-3">Instance Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                      Instance Type *
                    </label>
                    <select
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Select Instance Type</option>
                      <option value="t3.micro">t3.micro (1 vCPU, 1 GB RAM)</option>
                      <option value="t3.small">t3.small (1 vCPU, 2 GB RAM)</option>
                      <option value="t3.medium">t3.medium (2 vCPU, 4 GB RAM)</option>
                      <option value="t3.large">t3.large (2 vCPU, 8 GB RAM)</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                      Operating System *
                    </label>
                    <select
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Select OS</option>
                      <option value="amazon-linux-2">Amazon Linux 2</option>
                      <option value="ubuntu-20.04">Ubuntu 20.04 LTS</option>
                      <option value="ubuntu-22.04">Ubuntu 22.04 LTS</option>
                      <option value="centos-7">CentOS 7</option>
                      <option value="debian-11">Debian 11</option>
                      <option value="windows-server-2019">Windows Server 2019</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Storage Configuration */}
              <div>
                <h4 className="text-lg font-medium mb-3">Storage Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                      Root Volume Size (GB) *
                    </label>
                    <input
                      type="number"
                      min="8"
                      max="1000"
                      defaultValue="20"
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                      Storage Type
                    </label>
                    <select
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="gp3">General Purpose SSD (gp3)</option>
                      <option value="gp2">General Purpose SSD (gp2)</option>
                      <option value="io1">Provisioned IOPS SSD (io1)</option>
                      <option value="st1">Throughput Optimized HDD (st1)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Network Configuration */}
              <div>
                <h4 className="text-lg font-medium mb-3">Network Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                      VPC/Network
                    </label>
                    <select
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="default">Default VPC</option>
                      <option value="custom-vpc-1">Custom VPC 1</option>
                      <option value="custom-vpc-2">Custom VPC 2</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                      Security Group
                    </label>
                    <select
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="default">Default Security Group</option>
                      <option value="web-servers">Web Servers</option>
                      <option value="database-servers">Database Servers</option>
                      <option value="custom-sg">Custom Security Group</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <h4 className="text-lg font-medium mb-3">Tags (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                      Environment
                    </label>
                    <select
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Select Environment</option>
                      <option value="production">Production</option>
                      <option value="staging">Staging</option>
                      <option value="development">Development</option>
                      <option value="testing">Testing</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                      Project
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., web-app, api-service"
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Cost Estimate */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className="text-lg font-medium mb-2">Estimated Cost</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Hourly:</span>
                    <span className="ml-2 font-medium">$0.0464</span>
                  </div>
                  <div>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Monthly:</span>
                    <span className="ml-2 font-medium">$33.41</span>
                  </div>
                </div>
                <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  * Estimates based on selected configuration. Actual costs may vary.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsNewVMModalOpen(false)}
                className={`px-4 py-2 rounded-md ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsCreatingVM(true);
                  // Simulate VM creation
                  setTimeout(() => {
                    setIsCreatingVM(false);
                    setIsNewVMModalOpen(false);
                    // Show success message or refresh VM list
                  }, 3000);
                }}
                disabled={isCreatingVM}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center ${
                  isCreatingVM ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isCreatingVM ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creating VM...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create Virtual Machine
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmationOpen && vmToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-md w-full p-6`}>
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
              <h3 className="text-xl font-semibold">Delete Virtual Machine</h3>
            </div>
            <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Are you sure you want to delete {vmToDelete.name}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setIsDeleteConfirmationOpen(false);
                  setVmToDelete(null);
                }}
                className={`px-4 py-2 rounded-md ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsDeletingVM(true);
                  // Simulate API call
                  setTimeout(() => {
                    setIsDeletingVM(false);
                    setIsDeleteConfirmationOpen(false);
                    setVmToDelete(null);
                  }, 2000);
                }}
                disabled={isDeletingVM}
                className={`px-4 py-2 rounded-md bg-red-600 text-white flex items-center ${
                  isDeletingVM ? 'opacity-75 cursor-not-allowed' : 'hover:bg-red-700'
                }`}
              >
                {isDeletingVM ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete VM
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}