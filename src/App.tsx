import { useState, useRef, useEffect } from 'react';
import { 
  Cloud, Server, Settings, Activity, Database, Monitor, Power, RefreshCw, PlusCircle, 
  AlertCircle, X, Save, AlertTriangle, DollarSign, Moon, Sun, Trash2, KeyRound, 
  MoreVertical, Play, Cog, CpuIcon, HardDrive, Terminal, Check, FileText, TrendingUp
} from 'lucide-react';
import TacticalRMMService from './services/rmm';
import CloudMonitoringService from './services/monitoring';
import LogsView from './components/LogsView';
import MetricsView from './components/MetricsView';

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
  publicIp: boolean;
}

interface VMType {
  name: string;
  cpu: number;
  memory: number;
  storage: number;
  costPerHour: number;
}

interface RMMSettings {
  baseUrl: string;
  apiKey: string;
}

const vmTypes: Record<string, VMType[]> = {
  aws: [
    { name: 't3.micro', cpu: 2, memory: 1, storage: 20, costPerHour: 0.0104 },
    { name: 't3.small', cpu: 2, memory: 2, storage: 20, costPerHour: 0.0208 },
    { name: 't3.medium', cpu: 2, memory: 4, storage: 40, costPerHour: 0.0416 },
    { name: 't3.large', cpu: 2, memory: 8, storage: 60, costPerHour: 0.0832 },
  ],
  azure: [
    { name: 'B1s', cpu: 1, memory: 1, storage: 20, costPerHour: 0.0104 },
    { name: 'B2s', cpu: 2, memory: 4, storage: 40, costPerHour: 0.0416 },
    { name: 'B4ms', cpu: 4, memory: 16, storage: 80, costPerHour: 0.166 },
    { name: 'B8ms', cpu: 8, memory: 32, storage: 120, costPerHour: 0.333 },
  ],
  proxmox: [
    { name: 'small', cpu: 1, memory: 2, storage: 32, costPerHour: 0.015 },
    { name: 'medium', cpu: 2, memory: 4, storage: 64, costPerHour: 0.03 },
    { name: 'large', cpu: 4, memory: 8, storage: 128, costPerHour: 0.06 },
    { name: 'xlarge', cpu: 8, memory: 16, storage: 256, costPerHour: 0.12 },
  ]
};

const osByPlatform = {
  aws: [
    'Amazon Linux 2', 'Ubuntu', 'Red Hat Enterprise Linux', 'CentOS', 'Debian', 
    'SUSE Linux Enterprise Server', 'Windows Server 2022', 'Windows Server 2019', 'Windows Server 2016'
  ],
  azure: [
    'Windows Server 2022', 'Windows Server 2019', 'Windows Server 2016', 'Ubuntu', 
    'CentOS', 'Red Hat Enterprise Linux', 'Debian', 'SUSE Linux Enterprise Server', 'Oracle Linux'
  ],
  proxmox: [
    'Ubuntu', 'Debian', 'CentOS', 'Red Hat Enterprise Linux', 'SUSE Linux Enterprise Server', 
    'Windows Server 2022', 'Windows Server 2019', 'Windows Server 2016'
  ]
};

const initialCredentials = {
  aws: { accessKeyId: '', secretAccessKey: '', region: '' },
  azure: { clientId: '', clientSecret: '', tenantId: '', subscriptionId: '' },
  proxmox: { apiToken: '', endpoint: '' }
};

const initialVMForm = {
  name: '', 
  platform: 'aws', 
  type: 't3.medium', 
  cpu: 2, 
  memory: 4, 
  storage: 50, 
  costPerHour: 0.0416, 
  os: 'Amazon Linux 2',
  publicIp: false
};

const initialVMs = [
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
    os: 'Amazon Linux 2',
    publicIp: true 
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
    os: 'Ubuntu',
    publicIp: false 
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
    os: 'Debian',
    publicIp: false 
  }
];

const simulateApiCall = async (platform: string, action: string, data?: any) => {
  console.log(`Simulating ${platform} API call for ${action}`, data);
  
  // Log the action to monitoring service
  const monitoring = CloudMonitoringService.getInstance();
  monitoring.logEvent('info', `${action} initiated on ${platform}`, { platform, action, data });
  
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
  
  // Log completion
  monitoring.logEvent('info', `${action} completed successfully on ${platform}`, { platform, action, success: true });
  
  return { success: true };
};

function App() {
  const [darkMode, setDarkMode] = useState(() => JSON.parse(localStorage.getItem('darkMode') || 'false'));
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'aws' | 'azure' | 'proxmox'>('aws');
  const [authenticating, setAuthenticating] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState(initialCredentials);
  const [virtualMachines, setVirtualMachines] = useState(initialVMs);
  const [newVMForm, setNewVMForm] = useState(initialVMForm);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dropdownDirection, setDropdownDirection] = useState<Record<string, 'up' | 'down'>>({});
  const [selectedVMs, setSelectedVMs] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [rmmSettings, setRMMSettings] = useState<RMMSettings>({ baseUrl: '', apiKey: '' });
  const [isRMMConfigured, setIsRMMConfigured] = useState(false);
  const [rmmConfigError, setRMMConfigError] = useState('');
  const [activeView, setActiveView] = useState<'dashboard' | 'logs' | 'metrics'>('dashboard');

  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const calculateMonthlyCost = (vm: VirtualMachine) => vm.status === 'stopped' ? 0 : (vm.costPerHour * 24 * 30).toFixed(2);
  const getTotalMonthlyCost = () => virtualMachines.filter(vm => vm.status === 'running')
    .reduce((total, vm) => total + vm.costPerHour * 24 * 30, 0).toFixed(2);
  const filteredVMs = selectedPlatform === 'all' ? virtualMachines : virtualMachines.filter(vm => vm.platform === selectedPlatform);

  const getStatusColor = (status: string) => ({
    running: darkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800',
    stopped: darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-800',
    error: darkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800'
  }[status]);

  const getPlatformIcon = (platform: string) => ({
    aws: <Cloud className="w-5 h-5 text-orange-500" />,
    azure: <Cloud className="w-5 h-5 text-blue-500" />,
    proxmox: <Server className="w-5 h-5 text-green-500" />
  }[platform]);

  const formatResources = (vm: VirtualMachine) => `${vm.cpu}C/${vm.memory}G/${vm.storage}G`;

  const truncateText = (text: string, maxLength: number) => 
    text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;

  const toggleVMSelection = (vmId: string) => {
    const newSelection = new Set(selectedVMs);
    if (newSelection.has(vmId)) {
      newSelection.delete(vmId);
    } else {
      newSelection.add(vmId);
    }
    setSelectedVMs(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  const toggleAllVMs = () => {
    if (selectedVMs.size === filteredVMs.length) {
      setSelectedVMs(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedVMs(new Set(filteredVMs.map(vm => vm.id)));
      setShowBulkActions(true);
    }
  };

  const handleCreateVM = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingVM(true);
    const response = await simulateApiCall(newVMForm.platform, 'createVM', newVMForm);
    if (response.success) {
      const newVM: VirtualMachine = {
        id: Math.random().toString(36).substr(2, 9),
        ...newVMForm,
        status: 'stopped',
        ip: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        publicIp: newVMForm.publicIp
      };
      setVirtualMachines([...virtualMachines, newVM]);
      setIsNewVMModalOpen(false);
      setNewVMForm(initialVMForm);
    }
    setIsCreatingVM(false);
  };

  const handleSaveConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVM) return;
    setIsSavingConfig(true);
    const response = await simulateApiCall(selectedVM.platform, 'updateVM', selectedVM);
    if (response.success) {
      setVirtualMachines(virtualMachines.map(vm => vm.id === selectedVM.id ? selectedVM : vm));
      setIsConfigureModalOpen(false);
      setSelectedVM(null);
    }
    setIsSavingConfig(false);
  };

  const startVM = async (vm: VirtualMachine) => {
    const response = await simulateApiCall(vm.platform, 'startVM', { id: vm.id });
    if (response.success) {
      setVirtualMachines(virtualMachines.map(v => v.id === vm.id ? {...v, status: 'running'} : v));
    }
  };

  const stopVM = async () => {
    if (!vmToStop) return;
    setIsStoppingVM(true);
    const response = await simulateApiCall(vmToStop.platform, 'stopVM', { id: vmToStop.id });
    if (response.success) {
      setVirtualMachines(virtualMachines.map(vm => vm.id === vmToStop.id ? {...vm, status: 'stopped'} : vm));
      setIsStopConfirmationOpen(false);
      setVmToStop(null);
    }
    setIsStoppingVM(false);
  };

  const deleteVM = async () => {
    if (!vmToDelete) return;
    setIsDeletingVM(true);
    const response = await simulateApiCall(vmToDelete.platform, 'deleteVM', { id: vmToDelete.id });
    if (response.success) {
      setVirtualMachines(virtualMachines.filter(vm => vm.id !== vmToDelete.id));
      setIsDeleteConfirmationOpen(false);
      setVmToDelete(null);
    }
    setIsDeletingVM(false);
  };

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticating(true);
    const response = await simulateApiCall(selectedProvider, 'authenticate', credentials[selectedProvider]);
    if (response.success) {
      setIsAuthenticated(true);
      setIsSettingsOpen(false);
    }
    setAuthenticating(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const promises = ['aws', 'azure', 'proxmox'].map(platform => 
      simulateApiCall(platform, 'getVMs')
    );
    await Promise.all(promises);
    setIsRefreshing(false);
  };

  const handlePlatformChange = (platform: 'aws' | 'azure' | 'proxmox') => {
    const type = vmTypes[platform][0];
    setNewVMForm({
      ...newVMForm,
      platform,
      type: type.name,
      cpu: type.cpu,
      memory: type.memory,
      storage: type.storage,
      costPerHour: type.costPerHour,
      os: osByPlatform[platform][0]
    });
  };

  const handleVMTypeChange = (type: VMType) => {
    setNewVMForm({
      ...newVMForm,
      type: type.name,
      cpu: type.cpu,
      memory: type.memory,
      storage: type.storage,
      costPerHour: type.costPerHour
    });
  };

  const handleConnect = async (vm: VirtualMachine) => {
    if (!isRMMConfigured) {
      setIsSettingsOpen(true);
      return;
    }

    try {
      const rmm = TacticalRMMService.getInstance({
        baseUrl: rmmSettings.baseUrl,
        apiKey: rmmSettings.apiKey
      });

      // Try to get the agent for this VM
      const agents = await rmm.getAgents();
      const agent = agents.find(a => a.hostname === vm.name);

      if (!agent) {
        // Offer to install RMM agent
        if (confirm(`No RMM agent found for ${vm.name}. Would you like to install one?`)) {
          await rmm.installAgent(vm.name, vm.os);
          alert('Agent installation initiated. Please wait a few minutes for it to complete.');
          return;
        }
      } else {
        // Initiate remote session
        await rmm.initiateRemoteSession(agent.id);
      }
    } catch (error) {
      console.error('Error connecting to VM:', error);
      alert('Failed to connect to VM. Please check RMM configuration and try again.');
    }
  };

  const handleSaveRMMSettings = async () => {
    try {
      const rmm = TacticalRMMService.getInstance({
        baseUrl: rmmSettings.baseUrl,
        apiKey: rmmSettings.apiKey
      });

      // Test connection
      await rmm.getAgents();
      
      setIsRMMConfigured(true);
      setRMMConfigError('');
      localStorage.setItem('rmmSettings', JSON.stringify(rmmSettings));
      alert('RMM configuration saved successfully!');
    } catch (error) {
      setRMMConfigError('Failed to connect to RMM server. Please check your settings.');
    }
  };

  const toggleDropdown = (vmId: string, event: React.MouseEvent) => {
    const button = buttonRefs.current[vmId];
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const dropdownHeight = 120;
    const spaceBelow = window.innerHeight - rect.bottom;
    const shouldOpenUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    setDropdownDirection(prev => ({
      ...prev,
      [vmId]: shouldOpenUp ? 'up' : 'down'
    }));
    setOpenDropdownId(openDropdownId === vmId ? null : vmId);
  };

  useEffect(() => {
    const savedSettings = localStorage.getItem('rmmSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setRMMSettings(settings);
      setIsRMMConfigured(true);
    }

    // Initialize monitoring service
    CloudMonitoringService.getInstance();
  }, []);

  const Modal = ({ isOpen, onClose, title, children }) => isOpen && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full`}>
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold flex items-center">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  const ConfirmationModal = ({ isOpen, onClose, title, message, onConfirm, isProcessing, processingText, confirmText, Icon }) => isOpen && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-md w-full p-6`}>
        <div className="flex items-center mb-4">
          <Icon className="w-6 h-6 text-yellow-500 mr-2" />
          <h3 className="text-xl font-semibold">{title}</h3>
        </div>
        <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{message}</p>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className={`px-4 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isProcessing} className={`px-4 py-2 rounded-md bg-red-600 text-white flex items-center ${isProcessing ? 'opacity-75 cursor-not-allowed' : 'hover:bg-red-700'}`}>
            {isProcessing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : Icon && <Icon className="w-4 h-4 mr-2" />}
            {isProcessing ? processingText : confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  // Render different views based on activeView
  if (activeView === 'logs') {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        <header className={darkMode ? 'bg-gray-800 shadow-sm' : 'bg-white shadow-sm'}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Monitor className={`h-8 w-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <h1 className="ml-3 text-2xl font-semibold">Cloud Manager</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button onClick={() => setActiveView('dashboard')} className={`px-3 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                  Dashboard
                </button>
                <button onClick={() => setActiveView('metrics')} className={`px-3 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                  Metrics
                </button>
                <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  {darkMode ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-gray-600" />}
                </button>
              </div>
            </div>
          </div>
        </header>
        <LogsView darkMode={darkMode} onClose={() => setActiveView('dashboard')} />
      </div>
    );
  }

  if (activeView === 'metrics') {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        <header className={darkMode ? 'bg-gray-800 shadow-sm' : 'bg-white shadow-sm'}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Monitor className={`h-8 w-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <h1 className="ml-3 text-2xl font-semibold">Cloud Manager</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button onClick={() => setActiveView('dashboard')} className={`px-3 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                  Dashboard
                </button>
                <button onClick={() => setActiveView('logs')} className={`px-3 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                  Logs
                </button>
                <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  {darkMode ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-gray-600" />}
                </button>
              </div>
            </div>
          </div>
        </header>
        <MetricsView darkMode={darkMode} onClose={() => setActiveView('dashboard')} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <header className={darkMode ? 'bg-gray-800 shadow-sm' : 'bg-white shadow-sm'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Monitor className={`h-8 w-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <h1 className="ml-3 text-2xl font-semibold">Cloud Manager</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={() => setActiveView('logs')} className={`flex items-center px-3 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                <FileText className="w-4 h-4 mr-2" />
                Logs
              </button>
              <button onClick={() => setActiveView('metrics')} className={`flex items-center px-3 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Metrics
              </button>
              <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                {darkMode ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-gray-600" />}
              </button>
              <button onClick={() => setIsSettingsOpen(true)} className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                <Settings className={`w-6 h-6 ${isAuthenticated ? 'text-green-500' : darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              </button>
              <button className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                <Activity className={darkMode ? 'w-6 h-6 text-gray-300' : 'w-6 h-6 text-gray-600'} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {[
            { icon: Server, label: 'Total VMs', value: virtualMachines.length, color: 'blue' },
            { icon: Power, label: 'Running', value: virtualMachines.filter(vm => vm.status === 'running').length, color: 'green' },
            { icon: Database, label: 'Total Storage', value: virtualMachines.reduce((acc, vm) => acc + vm.storage, 0) + 'GB', color: 'purple' },
            { icon: DollarSign, label: 'Monthly Cost', value: `$${getTotalMonthlyCost()}`, color: 'emerald' },
            { icon: AlertCircle, label: 'Activity', value: 0, color: 'red' }
          ].map((stat, i) => (
            <div key={i} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
              <div className="flex items-center">
                <stat.icon className={`w-8 h-8 ${darkMode ? `text-${stat.color}-400` : `text-${stat.color}-500`}`} />
                <div className="ml-4">
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{stat.label}</p>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            {['all', 'aws', 'azure', 'proxmox'].map((platform) => (
              <button key={platform} onClick={() => setSelectedPlatform(platform as 'all' | 'aws' | 'azure' | 'proxmox')} 
                className={`px-4 py-2 rounded-md ${selectedPlatform === platform ? 
                  darkMode ? `bg-${platform === 'aws' ? 'orange' : platform === 'azure' ? 'blue' : 'green'}-900 text-${platform === 'aws' ? 'orange' : platform === 'azure' ? 'blue' : 'green'}-100` : 
                  `bg-${platform === 'aws' ? 'orange' : platform === 'azure' ? 'blue' : 'green'}-100 text-${platform === 'aws' ? 'orange' : platform === 'azure' ? 'blue' : 'green'}-800` : 
                  darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {platform === 'all' ? 'All Platforms' : platform.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={handleRefresh} disabled={isRefreshing}
              className={`flex items-center px-4 py-2 rounded-md ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'} ${isRefreshing ? 'opacity-75 cursor-not-allowed' : ''}`}>
              {isRefreshing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            {selectedVMs.size > 0 && (
              <div className="relative">
                <button
                  onClick={() => setOpenDropdownId(openDropdownId ? null : 'bulk-actions')}
                  className={`flex items-center px-4 py-2 rounded-md ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-white hover:bg-gray-50 text-gray-600'}`}
                >
                  <MoreVertical className="w-4 h-4 mr-2" />
                  Actions
                </button>
                {openDropdownId === 'bulk-actions' && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} ring-1 ring-black ring-opacity-5 z-50`}>
                    <div className="py-1" role="menu">
                      <button className={`flex items-center w-full px-4 py-2 text-sm ${darkMode ? 'hover:bg-gray-600 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}>
                        <Power className="w-4 h-4 mr-2 text-red-500" />
                        Stop Selected
                      </button>
                      <button className={`flex items-center w-full px-4 py-2 text-sm ${darkMode ? 'hover:bg-gray-600 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}>
                        <Trash2 className="w-4 h-4 mr-2 text-red-500" />
                        Delete Selected
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <button onClick={() => setIsNewVMModalOpen(true)} 
              className={`flex items-center px-4 py-2 text-white rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
              <PlusCircle className="w-4 h-4 mr-2" />
              New VM
            </button>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow rounded-lg`}>
          <div className="overflow-x-hidden max-h-[calc(100vh-400px)] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'} style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th scope="col" className="px-3 py-3 text-left">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedVMs.size === filteredVMs.length && filteredVMs.length > 0}
                      onChange={toggleAllVMs}
                    />
                  </th>
                  <th scope="col" className={`px-3 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-2/12`}>Name</th>
                  <th scope="col" className={`px-3 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-1/12`}>Status</th>
                  <th scope="col" className={`px-3 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-1/12`}>Platform</th>
                  <th scope="col" className={`px-3 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-1/12`}>Type</th>
                  <th scope="col" className={`px-3 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-2/12`}>OS</th>
                  <th scope="col" className={`px-3 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-2/12`}>IP Address</th>
                  <th scope="col" className={`px-3 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-1/12`}>Resources</th>
                  <th scope="col" className={`px-3 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-1/12`}>Cost</th>
                  <th scope="col" className={`px-3 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-1/12`}>Connect</th>
                </tr>
              </thead>
              <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {filteredVMs.map((vm) => (
                  <tr key={vm.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedVMs.has(vm.id)}
                        onChange={() => toggleVMSelection(vm.id)}
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className={`text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} truncate max-w-[150px]`} title={vm.name}>
                        {truncateText(vm.name, 15)}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(vm.status)}`}>
                        {vm.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        {getPlatformIcon(vm.platform)}
                        <span className={`ml-1 text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                          {vm.platform.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <span className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} truncate max-w-[100px]`} title={vm.type}>
                        {truncateText(vm.type, 10)}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <span className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} truncate max-w-[150px]`} title={vm.os}>
                        {truncateText(vm.os, 15)}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <span className={`${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{vm.ip}</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <span className={`${darkMode ? 'text-gray-100' : 'text-gray-900'}`} title={`CPU:${vm.cpu}C | RAM:${vm.memory}G | HD:${vm.storage}G`}>
                        {formatResources(vm)}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <div className="text-sm">
                        <div className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                          ${vm.costPerHour.toFixed(4)}
                        </div>
                        <div className={darkMode ? 'text-gray-300' : 'text-gray-500'}>
                          ${calculateMonthlyCost(vm)}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button
                        onClick={() => handleConnect(vm)}
                        disabled={vm.status !== 'running'}
                        className={`flex items-center px-3 py-1 rounded-md text-sm ${
                          vm.status === 'running'
                            ? `${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-100 hover:bg-green-200'} ${
                                darkMode ? 'text-white' : 'text-green-800'
                              }`
                            : `${darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400'} cursor-not-allowed`
                        }`}
                      >
                        <Terminal className="w-4 h-4 mr-2" />
                        Connect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Modal isOpen={isNewVMModalOpen} onClose={() => setIsNewVMModalOpen(false)} title="Create New Virtual Machine">
        <form onSubmit={handleCreateVM} className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">VM Name</label>
              <input type="text" value={newVMForm.name} onChange={(e) => setNewVMForm({ ...newVMForm, name: e.target.value })} 
                className={`w-full p-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-blue-500`} 
                placeholder="e.g., prod-web-01" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Platform</label>
              <div className="grid grid-cols-3 gap-4">
                {['aws', 'azure', 'proxmox'].map((platform) => (
                  <button key={platform} type="button" onClick={() => handlePlatformChange(platform as 'aws' | 'azure' | 'proxmox')} 
                    className={`p-4 rounded-lg border ${newVMForm.platform === platform ? 
                      darkMode ? `border-${platform === 'aws' ? 'orange' : platform === 'azure' ? 'blue' : 'green'}-500 bg-${platform === 'aws' ? 'orange' : platform === 'azure' ? 'blue' : 'green'}-500/10` : 
                      `border-${platform === 'aws' ? 'orange' : platform === 'azure' ? 'blue' : 'green'}-500 bg-${platform === 'aws' ? 'orange' : platform === 'azure' ? 'blue' : 'green'}-50` : 
                      darkMode ? 'border-gray-700 hover:border-orange-500' : 'border-gray-200 hover:border-orange-500'}`}>
                    <div className="flex items-center justify-center">
                      <Cloud className={`w-5 h-5 mr-2 ${newVMForm.platform === platform ? `text-${platform === 'aws' ? 'orange' : platform === 'azure' ? 'blue' : 'green'}-500` : 'text-gray-400'}`} />
                      {platform.toUpperCase()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Instance Type</label>
              <div className="grid grid-cols-1 gap-4">
                {vmTypes[newVMForm.platform].map((type) => (
                  <button key={type.name} type="button" onClick={() => handleVMTypeChange(type)} 
                    className={`p-4 rounded-lg border ${newVMForm.type === type.name ? 
                      darkMode ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-50' : 
                      darkMode ? 'border-gray-700 hover:border-blue-500' : 'border-gray-200 hover:border-blue-500'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="font-medium">{type.name}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <CpuIcon className="w-4 h-4 mr-1" />
                          <span>{type.cpu} vCPU</span>
                        </div>
                        <div className="flex items-center">
                          <Server className="w-4 h-4 mr-1" />
                          <span>{type.memory}GB</span>
                        </div>
                        <div className="flex items-center">
                          <HardDrive className="w-4 h-4 mr-1" />
                          <span>{type.storage}GB</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          <span>${type.costPerHour.toFixed(4)}/hr</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Operating System</label>
              <select value={newVMForm.os} onChange={(e) => setNewVMForm({ ...newVMForm, os: e.target.value })} 
                className={`w-full p-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-blue-500`}>
                {osByPlatform[newVMForm.platform].map((os) => (
                  <option key={os} value={os}>{os}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Public IP</label>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setNewVMForm({ ...newVMForm, publicIp: true })}
                  className={`px-4 py-2 rounded-md ${
                    newVMForm.publicIp
                      ? darkMode
                        ? 'bg-green-600 text-white'
                        : 'bg-green-100 text-green-800'
                      : darkMode
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setNewVMForm({ ...newVMForm, publicIp: false })}
                  className={`px-4 py-2 rounded-md ${
                    !newVMForm.publicIp
                      ? darkMode
                        ? 'bg-red-600 text-white'
                        : 'bg-red-100 text-red-800'
                      : darkMode
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  No
                </button>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button type="button" onClick={() => setIsNewVMModalOpen(false)} 
                className={`px-4 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
                Cancel
              </button>
              <button type="submit" disabled={isCreatingVM} 
                className={`px-4 py-2 rounded-md bg-blue-600 text-white flex items-center ${isCreatingVM ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-700'}`}>
                {isCreatingVM ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Server className="w-4 h-4 mr-2" />}
                {isCreatingVM ? 'Creating VM...' : 'Create VM'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isConfigureModalOpen} onClose={() => setIsConfigureModalOpen(false)} title="Configure Virtual Machine">
        <form onSubmit={handleSaveConfiguration} className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">VM Name</label>
              <input type="text" value={selectedVM?.name || ''} onChange={(e) => selectedVM && setSelectedVM({ ...selectedVM, name: e.target.value })} 
                className={`w-full p-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-blue-500`} 
                placeholder="e.g., prod-web-01" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">CPU</label>
              <input type="number" value={selectedVM?.cpu || 0} onChange={(e) => selectedVM && setSelectedVM({ ...selectedVM, cpu: parseInt(e.target.value) })} 
                className={`w-full p-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-blue-500`} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Memory (GB)</label>
              <input type="number" value={selectedVM?.memory || 0} onChange={(e) => selectedVM && setSelectedVM({ ...selectedVM, memory: parseInt(e.target.value) })} 
                className={`w-full p-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-blue-500`} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Storage (GB)</label>
              <input type="number" value={selectedVM?.storage || 0} onChange={(e) => selectedVM && setSelectedVM({ ...selectedVM, storage: parseInt(e.target.value) })} 
                className={`w-full p-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-blue-500`} required />
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button type="button" onClick={() => setIsConfigureModalOpen(false)} 
                className={`px-4 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
                Cancel
              </button>
              <button type="submit" disabled={isSavingConfig} 
                className={`px-4 py-2 rounded-md bg-blue-600 text-white flex items-center ${isSavingConfig ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-700'}`}>
                {isSavingConfig ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {isSavingConfig ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Settings">
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Select Provider</label>
              <div className="grid grid-cols-3 gap-4">
                {['aws', 'azure', 'proxmox'].map((provider) => (
                  <button key={provider} onClick={() => setSelectedProvider(provider as 'aws' | 'azure' | 'proxmox')} 
                    className={`p-4 rounded-lg border ${selectedProvider === provider ? 
                      darkMode ? `border-${provider === 'aws' ? 'orange' : provider === 'azure' ? 'blue' : 'green'}-500 bg-${provider === 'aws' ? 'orange' : provider === 'azure' ? 'blue' : 'green'}-500/10` : 
                      `border-${provider === 'aws' ? 'orange' : provider === 'azure' ? 'blue' : 'green'}-500 bg-${provider === 'aws' ? 'orange' : provider === 'azure' ? 'blue' : 'green'}-50` : 
                      darkMode ? 'border-gray-700 hover:border-orange-500' : 'border-gray-200 hover:border-orange-500'}`}>
                    <div className="flex items-center justify-center">
                      <Cloud className={`w-5 h-5 mr-2 ${selectedProvider === provider ? `text-${provider === 'aws' ? 'orange' : provider === 'azure' ? 'blue' : 'green'}-500` : 'text-gray-400'}`} />
                      {provider.toUpperCase()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <form onSubmit={handleAuthenticate} className="space-y-4">
              {selectedProvider === 'aws' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Access Key ID</label>
                    <input type="text" value={credentials.aws.accessKeyId} onChange={(e) => setCredentials({ ...credentials, aws: { ...credentials.aws, accessKeyId: e.target.value } })} 
                      className={`w-full p-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-blue-500`} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Secret Access Key</label>
                    <input type="password" value={credentials.aws.secretAccessKey} onChange={(e) => setCredentials({ ...credentials, aws: { ...credentials.aws, secretAccessKey: e.target.value } })} 
                      className={`w-full p-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-blue-500`} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Region</label>
                    <input type="text" value={credentials.aws.region} onChange={(e) => setCredentials({ ...credentials, aws: { ...credentials.aws, region: e.target.value } })} 
                      placeholder="us-east-1" className={`w-full p-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-blue-500`} required />
                  </div>
                </>
              )}
              {selectedProvider === 'azure' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Client ID</label>
                    <input type="text" value={credentials.azure.clientId} onChange={(e) => setCredentials({ ...credentials, azure: { ...credentials.azure, clientId: e.target.value } })} 
                      className={`w-full p-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-blue-500`} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Client Secret</label>
                    <input type="password" value={credentials.azure.clientSecret} onChange={(e) => setCredentials({ ...credentials, azure: { ...credentials.azure, clientSecret: e.target.value } })} 
                      className={`w-full p-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-blue-500`} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tenant ID</label>
                    <input type="text" value={credentials.azure.tenantId} onChange={(e) => setCredentials({ ...credentials, azure: { ...credentials.azure, tenantId: e.target.value } })} 
                      className={`w-full p-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-blue-500`} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Subscription ID</label>
                    <input type="text" value={credentials.azure.subscriptionId} onChange={(e) => setCredentials({ ...credentials, azure: { ...credentials.azure, subscriptionId: e.target.value } })} 
                      className={`w-full p-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-blue-500`} required />
                  </div>
                </>
              )}
              {selectedProvider === 'proxmox' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">API Token</label>
                    <input type="password" value={credentials.proxmox.apiToken} onChange={(e) => setCredentials({ ...credentials, proxmox: { ...credentials.proxmox, apiToken: e.target.value } })} 
                      className={`w-full p-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-blue-500`} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Endpoint URL</label>
                    <input type="text" value={credentials.proxmox.endpoint} onChange={(e) => setCredentials({ ...credentials, proxmox: { ...credentials.proxmox, endpoint: e.target.value } })} 
                      placeholder="https://proxmox.example.com:8006" className={`w-full p-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-blue-500`} required />
                  </div>
                </>
              )}
              <div className="flex justify-end space-x-4 mt-6">
                <button type="button" onClick={() => setIsSettingsOpen(false)} 
                  className={`px-4 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
                  Cancel
                </button>
                <button type="submit" disabled={authenticating} 
                  className={`px-4 py-2 rounded-md bg-blue-600 text-white flex items-center ${authenticating ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-700'}`}>
                  {authenticating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {authenticating ? 'Authenticating...' : 'Save Credentials'}
                </button>
              </div>
            </form>
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium mb-4">Tactical RMM Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">RMM Server URL</label>
                  <input
                    type="text"
                    value={rmmSettings.baseUrl}
                    onChange={(e) => setRMMSettings({ ...rmmSettings, baseUrl: e.target.value })}
                    placeholder="https://rmm.yourdomain.com"
                    className={`w-full p-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">API Key</label>
                  <input
                    type="password"
                    value={rmmSettings.apiKey}
                    onChange={(e) => setRMMSettings({ ...rmmSettings, apiKey: e.target.value })}
                    className={`w-full p-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                {rmmConfigError && (
                  <div className="text-red-500 text-sm">{rmmConfigError}</div>
                )}
                <button
                  onClick={handleSaveRMMSettings}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Save RMM Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmationModal isOpen={isStopConfirmationOpen} onClose={() => setIsStopConfirmationOpen(false)} 
        title="Stop Virtual Machine" message={`Are you sure you want to stop ${vmToStop?.name}? This will interrupt any running processes.`} 
        onConfirm={stopVM} isProcessing={isStoppingVM} processingText="Stopping..." confirmText="Stop VM" Icon={AlertTriangle} />

      <ConfirmationModal isOpen={isDeleteConfirmationOpen} onClose={() => setIsDeleteConfirmationOpen(false)} 
        title="Delete Virtual Machine" message={`Are you sure you want to delete ${vmToDelete?.name}? This action cannot be undone.`} 
        onConfirm={deleteVM} isProcessing={isDeletingVM} processingText="Deleting..." confirmText="Delete VM" Icon={AlertTriangle} />
    </div>
  );
}

export default App;