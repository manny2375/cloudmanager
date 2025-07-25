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
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNewVMModal, setShowNewVMModal] = useState(false);
  const [vmConfigMode, setVmConfigMode] = useState<'preset' | 'custom'>('preset');
  const [isCreatingVM, setIsCreatingVM] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    aws_secret: false,
    azure_secret: false,
    proxmox_password: false
  });

  const [newVmData, setNewVmData] = useState({
    name: '',
    provider: '',
    instanceType: '',
    operatingSystem: '',
    cpu: 1,
    memory: 1,
    storage: 20,
    region: '',
    securityGroup: ''
  });
  const [selectedPresetType, setSelectedPresetType] = useState('');
  const [selectedPresetConfig, setSelectedPresetConfig] = useState<any>(null);
  const [vmMode, setVmMode] = useState<'preset' | 'custom'>('preset');

  // Get preset configurations based on provider and type
  const getPresetConfigurations = (provider: string, type: string) => {
    const configurations: Record<string, Record<string, any[]>> = {
      aws: {
        'web-server': [
          { name: 'Basic Web Server', instanceType: 't3.micro', cpu: 1, memory: 1, storage: 20, os: 'Ubuntu 22.04 LTS', costPerHour: 0.0104 },
          { name: 'Standard Web Server', instanceType: 't3.small', cpu: 2, memory: 2, storage: 30, os: 'Ubuntu 22.04 LTS', costPerHour: 0.0208 },
          { name: 'High Traffic Web Server', instanceType: 't3.medium', cpu: 2, memory: 4, storage: 50, os: 'Ubuntu 22.04 LTS', costPerHour: 0.0416 },
          { name: 'Enterprise Web Server', instanceType: 't3.large', cpu: 2, memory: 8, storage: 100, os: 'Ubuntu 22.04 LTS', costPerHour: 0.0832 },
          { name: 'Load Balanced Web Server', instanceType: 't3.xlarge', cpu: 4, memory: 16, storage: 200, os: 'Ubuntu 22.04 LTS', costPerHour: 0.1664 },
          { name: 'CDN Web Server', instanceType: 't3.2xlarge', cpu: 8, memory: 32, storage: 300, os: 'Ubuntu 22.04 LTS', costPerHour: 0.3328 }
        ],
        'database-server': [
          { name: 'MySQL Basic', instanceType: 't3.small', cpu: 2, memory: 2, storage: 50, os: 'Ubuntu 22.04 LTS', costPerHour: 0.0208 },
          { name: 'PostgreSQL Standard', instanceType: 't3.medium', cpu: 2, memory: 4, storage: 100, os: 'Ubuntu 22.04 LTS', costPerHour: 0.0416 },
          { name: 'MongoDB Replica', instanceType: 't3.large', cpu: 2, memory: 8, storage: 200, os: 'Ubuntu 22.04 LTS', costPerHour: 0.0832 },
          { name: 'Redis Cache Server', instanceType: 'r5.large', cpu: 2, memory: 16, storage: 100, os: 'Ubuntu 22.04 LTS', costPerHour: 0.126 },
          { name: 'Oracle Enterprise', instanceType: 'r5.xlarge', cpu: 4, memory: 32, storage: 500, os: 'Oracle Linux 8', costPerHour: 0.252 },
          { name: 'SQL Server Cluster', instanceType: 'r5.2xlarge', cpu: 8, memory: 64, storage: 1000, os: 'Windows Server 2022', costPerHour: 0.504 }
        ],
        'application-server': [
          { name: 'Node.js App Server', instanceType: 't3.medium', cpu: 2, memory: 4, storage: 50, os: 'Ubuntu 22.04 LTS', costPerHour: 0.0416 },
          { name: 'Java Spring Boot', instanceType: 't3.large', cpu: 2, memory: 8, storage: 100, os: 'Ubuntu 22.04 LTS', costPerHour: 0.0832 },
          { name: 'Python Django', instanceType: 't3.xlarge', cpu: 4, memory: 16, storage: 200, os: 'Ubuntu 22.04 LTS', costPerHour: 0.1664 },
          { name: '.NET Core Server', instanceType: 't3.large', cpu: 2, memory: 8, storage: 100, os: 'Windows Server 2022', costPerHour: 0.0936 },
          { name: 'Microservices Cluster', instanceType: 'c5.xlarge', cpu: 4, memory: 8, storage: 200, os: 'Ubuntu 22.04 LTS', costPerHour: 0.17 },
          { name: 'High Performance API', instanceType: 'c5.2xlarge', cpu: 8, memory: 16, storage: 300, os: 'Ubuntu 22.04 LTS', costPerHour: 0.34 }
        ],
        'windows-desktop': [
          { name: 'Basic Windows Desktop', instanceType: 't3.medium', cpu: 2, memory: 4, storage: 100, os: 'Windows Server 2022', costPerHour: 0.052 },
          { name: 'Developer Workstation', instanceType: 't3.large', cpu: 2, memory: 8, storage: 200, os: 'Windows 11 Pro', costPerHour: 0.0936 },
          { name: 'Design Workstation', instanceType: 'm5.xlarge', cpu: 4, memory: 16, storage: 300, os: 'Windows 11 Pro', costPerHour: 0.192 },
          { name: 'CAD Workstation', instanceType: 'g4dn.xlarge', cpu: 4, memory: 16, storage: 500, os: 'Windows 11 Pro', costPerHour: 0.526 },
          { name: 'Gaming Server', instanceType: 'g4dn.2xlarge', cpu: 8, memory: 32, storage: 1000, os: 'Windows Server 2022', costPerHour: 0.752 },
          { name: 'Virtual Desktop Pool', instanceType: 'm5.2xlarge', cpu: 8, memory: 32, storage: 200, os: 'Windows Server 2022', costPerHour: 0.384 }
        ],
        'development-environment': [
          { name: 'Basic Dev Environment', instanceType: 't3.micro', cpu: 1, memory: 1, storage: 30, os: 'Ubuntu 22.04 LTS', costPerHour: 0.0104 },
          { name: 'Full Stack Dev', instanceType: 't3.small', cpu: 2, memory: 2, storage: 50, os: 'Ubuntu 22.04 LTS', costPerHour: 0.0208 },
          { name: 'Docker Development', instanceType: 't3.medium', cpu: 2, memory: 4, storage: 100, os: 'Ubuntu 22.04 LTS', costPerHour: 0.0416 },
          { name: 'Kubernetes Dev Cluster', instanceType: 't3.large', cpu: 2, memory: 8, storage: 200, os: 'Ubuntu 22.04 LTS', costPerHour: 0.0832 },
          { name: 'CI/CD Pipeline Server', instanceType: 'c5.large', cpu: 2, memory: 4, storage: 100, os: 'Ubuntu 22.04 LTS', costPerHour: 0.085 },
          { name: 'Multi-Language IDE', instanceType: 'm5.large', cpu: 2, memory: 8, storage: 150, os: 'Ubuntu 22.04 LTS', costPerHour: 0.096 }
        ],
        'ml-workstation': [
          { name: 'Basic ML Training', instanceType: 'p3.2xlarge', cpu: 8, memory: 61, storage: 500, os: 'Ubuntu 22.04 LTS', costPerHour: 3.06 },
          { name: 'Deep Learning GPU', instanceType: 'p3.8xlarge', cpu: 32, memory: 244, storage: 1000, os: 'Ubuntu 22.04 LTS', costPerHour: 12.24 },
          { name: 'AI Research Station', instanceType: 'p4d.24xlarge', cpu: 96, memory: 1152, storage: 2000, os: 'Ubuntu 22.04 LTS', costPerHour: 32.77 },
          { name: 'Data Science Notebook', instanceType: 'm5.xlarge', cpu: 4, memory: 16, storage: 200, os: 'Ubuntu 22.04 LTS', costPerHour: 0.192 },
          { name: 'TensorFlow Cluster', instanceType: 'p3.16xlarge', cpu: 64, memory: 488, storage: 2000, os: 'Ubuntu 22.04 LTS', costPerHour: 24.48 },
          { name: 'PyTorch Workstation', instanceType: 'g4dn.12xlarge', cpu: 48, memory: 192, storage: 1000, os: 'Ubuntu 22.04 LTS', costPerHour: 3.912 }
        ]
      },
      azure: {
        'web-server': [
          { name: 'Basic Web Server', instanceType: 'Standard_B1s', cpu: 1, memory: 1, storage: 20, os: 'Ubuntu 22.04 LTS', costPerHour: 0.0104 },
          { name: 'Standard Web Server', instanceType: 'Standard_B2s', cpu: 2, memory: 4, storage: 30, os: 'Ubuntu 22.04 LTS', costPerHour: 0.0416 },
          { name: 'High Traffic Web Server', instanceType: 'Standard_D2s_v3', cpu: 2, memory: 8, storage: 50, os: 'Ubuntu 22.04 LTS', costPerHour: 0.096 },
          { name: 'Enterprise Web Server', instanceType: 'Standard_D4s_v3', cpu: 4, memory: 16, storage: 100, os: 'Ubuntu 22.04 LTS', costPerHour: 0.192 },
          { name: 'Load Balanced Web Server', instanceType: 'Standard_D8s_v3', cpu: 8, memory: 32, storage: 200, os: 'Ubuntu 22.04 LTS', costPerHour: 0.384 },
          { name: 'CDN Web Server', instanceType: 'Standard_D16s_v3', cpu: 16, memory: 64, storage: 300, os: 'Ubuntu 22.04 LTS', costPerHour: 0.768 }
        ],
        'database-server': [
          { name: 'MySQL Basic', instanceType: 'Standard_B2ms', cpu: 2, memory: 8, storage: 50, os: 'Ubuntu 22.04 LTS', costPerHour: 0.0832 },
          { name: 'PostgreSQL Standard', instanceType: 'Standard_D2s_v3', cpu: 2, memory: 8, storage: 100, os: 'Ubuntu 22.04 LTS', costPerHour: 0.096 },
          { name: 'MongoDB Replica', instanceType: 'Standard_D4s_v3', cpu: 4, memory: 16, storage: 200, os: 'Ubuntu 22.04 LTS', costPerHour: 0.192 },
          { name: 'Redis Cache Server', instanceType: 'Standard_E2s_v3', cpu: 2, memory: 16, storage: 100, os: 'Ubuntu 22.04 LTS', costPerHour: 0.126 },
          { name: 'SQL Server Enterprise', instanceType: 'Standard_E4s_v3', cpu: 4, memory: 32, storage: 500, os: 'Windows Server 2022', costPerHour: 0.252 },
          { name: 'Cosmos DB Cluster', instanceType: 'Standard_E8s_v3', cpu: 8, memory: 64, storage: 1000, os: 'Ubuntu 22.04 LTS', costPerHour: 0.504 }
        ],
        'application-server': [
          { name: 'Node.js App Server', instanceType: 'Standard_B2s', cpu: 2, memory: 4, storage: 50, os: 'Ubuntu 22.04 LTS', costPerHour: 0.0416 },
          { name: 'Java Spring Boot', instanceType: 'Standard_D2s_v3', cpu: 2, memory: 8, storage: 100, os: 'Ubuntu 22.04 LTS', costPerHour: 0.096 },
          { name: 'Python Django', instanceType: 'Standard_D4s_v3', cpu: 4, memory: 16, storage: 200, os: 'Ubuntu 22.04 LTS', costPerHour: 0.192 },
          { name: '.NET Core Server', instanceType: 'Standard_D2s_v3', cpu: 2, memory: 8, storage: 100, os: 'Windows Server 2022', costPerHour: 0.108 },
          { name: 'Microservices Cluster', instanceType: 'Standard_F4s_v2', cpu: 4, memory: 8, storage: 200, os: 'Ubuntu 22.04 LTS', costPerHour: 0.169 },
          { name: 'High Performance API', instanceType: 'Standard_F8s_v2', cpu: 8, memory: 16, storage: 300, os: 'Ubuntu 22.04 LTS', costPerHour: 0.338 }
        ],
        'windows-desktop': [
          { name: 'Basic Windows Desktop', instanceType: 'Standard_B2s', cpu: 2, memory: 4, storage: 100, os: 'Windows Server 2022', costPerHour: 0.0624 },
          { name: 'Developer Workstation', instanceType: 'Standard_D2s_v3', cpu: 2, memory: 8, storage: 200, os: 'Windows 11 Pro', costPerHour: 0.108 },
          { name: 'Design Workstation', instanceType: 'Standard_D4s_v3', cpu: 4, memory: 16, storage: 300, os: 'Windows 11 Pro', costPerHour: 0.216 },
          { name: 'CAD Workstation', instanceType: 'Standard_NV6', cpu: 6, memory: 56, storage: 500, os: 'Windows 11 Pro', costPerHour: 1.14 },
          { name: 'Gaming Server', instanceType: 'Standard_NV12', cpu: 12, memory: 112, storage: 1000, os: 'Windows Server 2022', costPerHour: 2.28 },
          { name: 'Virtual Desktop Pool', instanceType: 'Standard_D8s_v3', cpu: 8, memory: 32, storage: 200, os: 'Windows Server 2022', costPerHour: 0.432 }
        ],
        'development-environment': [
          { name: 'Basic Dev Environment', instanceType: 'Standard_B1s', cpu: 1, memory: 1, storage: 30, os: 'Ubuntu 22.04 LTS', costPerHour: 0.0104 },
          { name: 'Full Stack Dev', instanceType: 'Standard_B2s', cpu: 2, memory: 4, storage: 50, os: 'Ubuntu 22.04 LTS', costPerHour: 0.0416 },
          { name: 'Docker Development', instanceType: 'Standard_D2s_v3', cpu: 2, memory: 8, storage: 100, os: 'Ubuntu 22.04 LTS', costPerHour: 0.096 },
          { name: 'Kubernetes Dev Cluster', instanceType: 'Standard_D4s_v3', cpu: 4, memory: 16, storage: 200, os: 'Ubuntu 22.04 LTS', costPerHour: 0.192 },
          { name: 'CI/CD Pipeline Server', instanceType: 'Standard_F2s_v2', cpu: 2, memory: 4, storage: 100, os: 'Ubuntu 22.04 LTS', costPerHour: 0.085 },
          { name: 'Multi-Language IDE', instanceType: 'Standard_E2s_v3', cpu: 2, memory: 16, storage: 150, os: 'Ubuntu 22.04 LTS', costPerHour: 0.126 }
        ],
        'ml-workstation': [
          { name: 'Basic ML Training', instanceType: 'Standard_NC6s_v3', cpu: 6, memory: 112, storage: 500, os: 'Ubuntu 22.04 LTS', costPerHour: 3.06 },
          { name: 'Deep Learning GPU', instanceType: 'Standard_NC24s_v3', cpu: 24, memory: 448, storage: 1000, os: 'Ubuntu 22.04 LTS', costPerHour: 12.24 },
          { name: 'AI Research Station', instanceType: 'Standard_ND40rs_v2', cpu: 40, memory: 672, storage: 2000, os: 'Ubuntu 22.04 LTS', costPerHour: 22.32 },
          { name: 'Data Science Notebook', instanceType: 'Standard_D4s_v3', cpu: 4, memory: 16, storage: 200, os: 'Ubuntu 22.04 LTS', costPerHour: 0.192 },
          { name: 'TensorFlow Cluster', instanceType: 'Standard_NC24rs_v3', cpu: 24, memory: 448, storage: 2000, os: 'Ubuntu 22.04 LTS', costPerHour: 13.20 },
          { name: 'PyTorch Workstation', instanceType: 'Standard_NC12s_v3', cpu: 12, memory: 224, storage: 1000, os: 'Ubuntu 22.04 LTS', costPerHour: 6.12 }
        ]
      },
      proxmox: {
        'web-server': [
          { name: 'Basic Web Server', instanceType: 'web-basic', cpu: 1, memory: 2, storage: 20, os: 'Ubuntu 22.04 LTS', costPerHour: 0.005 },
          { name: 'Standard Web Server', instanceType: 'web-standard', cpu: 2, memory: 4, storage: 40, os: 'Ubuntu 22.04 LTS', costPerHour: 0.010 },
          { name: 'High Traffic Web Server', instanceType: 'web-performance', cpu: 4, memory: 8, storage: 80, os: 'Ubuntu 22.04 LTS', costPerHour: 0.020 },
          { name: 'Enterprise Web Server', instanceType: 'web-enterprise', cpu: 8, memory: 16, storage: 160, os: 'Ubuntu 22.04 LTS', costPerHour: 0.040 },
          { name: 'Load Balanced Web Server', instanceType: 'web-cluster', cpu: 6, memory: 12, storage: 120, os: 'Ubuntu 22.04 LTS', costPerHour: 0.030 },
          { name: 'CDN Web Server', instanceType: 'web-cdn', cpu: 4, memory: 8, storage: 200, os: 'Ubuntu 22.04 LTS', costPerHour: 0.025 }
        ],
        'database-server': [
          { name: 'MySQL Basic', instanceType: 'db-mysql-basic', cpu: 2, memory: 4, storage: 50, os: 'Ubuntu 22.04 LTS', costPerHour: 0.012 },
          { name: 'PostgreSQL Standard', instanceType: 'db-postgres-std', cpu: 4, memory: 8, storage: 100, os: 'Ubuntu 22.04 LTS', costPerHour: 0.024 },
          { name: 'MongoDB Replica', instanceType: 'db-mongo-replica', cpu: 6, memory: 12, storage: 200, os: 'Ubuntu 22.04 LTS', costPerHour: 0.036 },
          { name: 'Redis Cache Server', instanceType: 'db-redis-cache', cpu: 2, memory: 16, storage: 50, os: 'Ubuntu 22.04 LTS', costPerHour: 0.020 },
          { name: 'MariaDB Cluster', instanceType: 'db-mariadb-cluster', cpu: 8, memory: 32, storage: 500, os: 'Ubuntu 22.04 LTS', costPerHour: 0.048 },
          { name: 'InfluxDB Time Series', instanceType: 'db-influx-ts', cpu: 4, memory: 16, storage: 300, os: 'Ubuntu 22.04 LTS', costPerHour: 0.032 }
        ],
        'application-server': [
          { name: 'Node.js App Server', instanceType: 'app-nodejs', cpu: 2, memory: 4, storage: 40, os: 'Ubuntu 22.04 LTS', costPerHour: 0.012 },
          { name: 'Java Spring Boot', instanceType: 'app-java-spring', cpu: 4, memory: 8, storage: 80, os: 'Ubuntu 22.04 LTS', costPerHour: 0.024 },
          { name: 'Python Django', instanceType: 'app-python-django', cpu: 4, memory: 8, storage: 80, os: 'Ubuntu 22.04 LTS', costPerHour: 0.024 },
          { name: 'PHP Laravel', instanceType: 'app-php-laravel', cpu: 2, memory: 4, storage: 60, os: 'Ubuntu 22.04 LTS', costPerHour: 0.012 },
          { name: 'Docker Container Host', instanceType: 'app-docker-host', cpu: 6, memory: 16, storage: 120, os: 'Ubuntu 22.04 LTS', costPerHour: 0.036 },
          { name: 'Kubernetes Node', instanceType: 'app-k8s-node', cpu: 8, memory: 32, storage: 200, os: 'Ubuntu 22.04 LTS', costPerHour: 0.048 }
        ],
        'windows-desktop': [
          { name: 'Basic Windows Desktop', instanceType: 'win-basic', cpu: 2, memory: 4, storage: 80, os: 'Windows Server 2022', costPerHour: 0.015 },
          { name: 'Developer Workstation', instanceType: 'win-dev', cpu: 4, memory: 8, storage: 120, os: 'Windows 11 Pro', costPerHour: 0.030 },
          { name: 'Design Workstation', instanceType: 'win-design', cpu: 6, memory: 16, storage: 200, os: 'Windows 11 Pro', costPerHour: 0.045 },
          { name: 'CAD Workstation', instanceType: 'win-cad', cpu: 8, memory: 32, storage: 300, os: 'Windows 11 Pro', costPerHour: 0.060 },
          { name: 'Terminal Server', instanceType: 'win-terminal', cpu: 8, memory: 16, storage: 150, os: 'Windows Server 2022', costPerHour: 0.048 },
          { name: 'File Server', instanceType: 'win-fileserver', cpu: 4, memory: 8, storage: 500, os: 'Windows Server 2022', costPerHour: 0.035 }
        ],
        'development-environment': [
          { name: 'Basic Dev Environment', instanceType: 'dev-basic', cpu: 1, memory: 2, storage: 30, os: 'Ubuntu 22.04 LTS', costPerHour: 0.005 },
          { name: 'Full Stack Dev', instanceType: 'dev-fullstack', cpu: 2, memory: 4, storage: 60, os: 'Ubuntu 22.04 LTS', costPerHour: 0.010 },
          { name: 'Docker Development', instanceType: 'dev-docker', cpu: 4, memory: 8, storage: 100, os: 'Ubuntu 22.04 LTS', costPerHour: 0.020 },
          { name: 'GitLab Runner', instanceType: 'dev-gitlab', cpu: 2, memory: 4, storage: 50, os: 'Ubuntu 22.04 LTS', costPerHour: 0.012 },
          { name: 'Jenkins CI/CD', instanceType: 'dev-jenkins', cpu: 4, memory: 8, storage: 80, os: 'Ubuntu 22.04 LTS', costPerHour: 0.024 },
          { name: 'Code Server IDE', instanceType: 'dev-codeserver', cpu: 2, memory: 8, storage: 100, os: 'Ubuntu 22.04 LTS', costPerHour: 0.016 }
        ],
        'ml-workstation': [
          { name: 'Basic ML Training', instanceType: 'ml-basic', cpu: 8, memory: 32, storage: 200, os: 'Ubuntu 22.04 LTS', costPerHour: 0.080 },
          { name: 'GPU ML Workstation', instanceType: 'ml-gpu', cpu: 12, memory: 64, storage: 500, os: 'Ubuntu 22.04 LTS', costPerHour: 0.150 },
          { name: 'Data Science Lab', instanceType: 'ml-datascience', cpu: 16, memory: 128, storage: 1000, os: 'Ubuntu 22.04 LTS', costPerHour: 0.200 },
          { name: 'Jupyter Notebook Server', instanceType: 'ml-jupyter', cpu: 4, memory: 16, storage: 100, os: 'Ubuntu 22.04 LTS', costPerHour: 0.032 },
          { name: 'TensorFlow Training', instanceType: 'ml-tensorflow', cpu: 16, memory: 64, storage: 500, os: 'Ubuntu 22.04 LTS', costPerHour: 0.128 },
          { name: 'PyTorch Research', instanceType: 'ml-pytorch', cpu: 12, memory: 48, storage: 300, os: 'Ubuntu 22.04 LTS', costPerHour: 0.096 }
        ]
      }
    };

    return configurations[provider]?.[type] || [];
  };

  // Preset VM configurations
  const presetVMs = [
    {
      id: 'web-server-small',
      name: 'Web Server (Small)',
      description: 'Perfect for small websites and development',
      provider: 'aws',
      instanceType: 't3.small',
      os: 'ubuntu-20.04',
      cpuCores: 2,
      memory: 2,
      storage: 20,
      costPerHour: 0.0208,
      icon: '🌐',
      tags: ['web', 'development']
    },
    {
      id: 'database-medium',
      name: 'Database Server (Medium)',
      description: 'Optimized for database workloads',
      provider: 'aws',
      instanceType: 't3.medium',
      os: 'ubuntu-20.04',
      cpuCores: 2,
      memory: 4,
      storage: 100,
      costPerHour: 0.0416,
      icon: '🗄️',
      tags: ['database', 'production']
    },
    {
      id: 'app-server-large',
      name: 'Application Server (Large)',
      description: 'High-performance application hosting',
      provider: 'aws',
      instanceType: 't3.large',
      os: 'ubuntu-20.04',
      cpuCores: 2,
      memory: 8,
      storage: 50,
      costPerHour: 0.0832,
      icon: '⚡',
      tags: ['application', 'production']
    },
    {
      id: 'windows-desktop',
      name: 'Windows Desktop',
      description: 'Windows Server for remote desktop',
      provider: 'azure',
      instanceType: 'Standard_B2s',
      os: 'windows-server-2022',
      cpuCores: 2,
      memory: 4,
      storage: 30,
      costPerHour: 0.0496,
      icon: '🖥️',
      tags: ['windows', 'desktop']
    },
    {
      id: 'dev-environment',
      name: 'Development Environment',
      description: 'Cost-effective development setup',
      provider: 'proxmox',
      instanceType: 'dev-small',
      os: 'ubuntu-22.04',
      cpuCores: 1,
      memory: 2,
      storage: 25,
      costPerHour: 0.015,
      icon: '💻',
      tags: ['development', 'testing']
    },
    {
      id: 'ml-workstation',
      name: 'ML Workstation',
      description: 'Machine learning and AI workloads',
      provider: 'aws',
      instanceType: 'p3.2xlarge',
      os: 'ubuntu-20.04',
      cpuCores: 8,
      memory: 61,
      storage: 100,
      costPerHour: 3.06,
      icon: '🤖',
      tags: ['ml', 'gpu', 'compute']
    }
  ];

  const [selectedPreset, setSelectedPreset] = useState<string>('');

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

  const handleCreateVM = async () => {
    setIsCreatingVM(true);
    
    try {
      let vmDataToSend;
      
      if (vmMode === 'preset') {
        if (!selectedPresetConfig || !newVmData.provider || !newVmData.name) {
          throw new Error('Please fill in all required fields');
        }
        
        vmDataToSend = {
          name: newVmData.name,
          provider: newVmData.provider,
          instanceType: selectedPresetConfig.instanceType,
          operatingSystem: selectedPresetConfig.os,
          cpu: selectedPresetConfig.cpu,
          memory: selectedPresetConfig.memory,
          storage: selectedPresetConfig.storage,
          region: newVmData.region,
          securityGroup: newVmData.securityGroup,
          costPerHour: selectedPresetConfig.costPerHour
        };
      } else {
        if (!newVmData.name || !newVmData.provider) {
          throw new Error('Please fill in all required fields');
        }
        
        vmDataToSend = { ...newVmData };
      }
      
      const result = await apiClient.createVM(vmDataToSend);
      if (result.error) {
        throw new Error(result.error);
      }
      
      setShowNewVMModal(false);
      setNewVmData({
        name: '', provider: '', instanceType: '', operatingSystem: '',
        cpu: 1, memory: 1, storage: 20, region: '', securityGroup: ''
      });
      setSelectedPresetType('');
      setSelectedPresetConfig(null);
      setVmMode('preset');
      
      // Refresh VM list
      const vmsResult = await apiClient.getVMs();
      if (!vmsResult.error) {
        setVms(vmsResult.data || []);
      }
    } catch (error) {
      console.error('Failed to create VM:', error);
      // TODO: Show error message to user
    } finally {
      setIsCreatingVM(false);
    }
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
                onClick={onViewLogs}
                className={`p-2 rounded-md ${
                  darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="System Logs"
              >
                <FileText className="w-5 h-5" />
              </button>
              <button
                onClick={onViewMetrics}
                className={`p-2 rounded-md ${
                  darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Performance Metrics"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowSettingsModal(true)}
                className={`p-2 rounded-md ${
                  darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
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

        {/* Virtual Machines */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow`}>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Virtual Machines</h2>
              <button 
                onClick={() => setShowNewVMModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
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

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Settings</h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className={`p-2 rounded-md ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-6">
              {/* General Settings */}
              <div className="mb-8">
                <h4 className={`text-md font-medium mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  General Settings
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Dark Mode
                      </label>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Toggle between light and dark theme
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
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Auto-refresh Dashboard
                      </label>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Automatically refresh VM status every 30 seconds
                      </p>
                    </div>
                    <button
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-blue-600`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="mb-8">
                <h4 className={`text-md font-medium mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Notifications
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        VM Status Alerts
                      </label>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Get notified when VMs go offline or encounter errors
                      </p>
                    </div>
                    <button
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-blue-600`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Cost Alerts
                      </label>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Alert when monthly costs exceed budget thresholds
                      </p>
                    </div>
                    <button
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-gray-200`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Data & Privacy */}
              <div className="mb-8">
                <h4 className={`text-md font-medium mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Data & Privacy
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Data Retention Period
                    </label>
                    <select className={`w-full px-3 py-2 border rounded-md ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}>
                      <option value="30">30 days</option>
                      <option value="90" selected>90 days</option>
                      <option value="180">180 days</option>
                      <option value="365">1 year</option>
                    </select>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      How long to keep logs and metrics data
                    </p>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Export Data
                    </label>
                    <button className={`px-4 py-2 text-sm border rounded-md ${
                      darkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}>
                      Download All Data
                    </button>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Export all your data in JSON format
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Settings */}
              <div>
                <h4 className={`text-md font-medium mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Account
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Change Password
                    </label>
                    <button className={`px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700`}>
                      Update Password
                    </button>
                  </div>
                  
                  <div className={`p-4 rounded-md ${darkMode ? 'bg-red-900 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
                    <h5 className={`text-sm font-medium ${darkMode ? 'text-red-100' : 'text-red-800'} mb-2`}>
                      Danger Zone
                    </h5>
                    <p className={`text-sm ${darkMode ? 'text-red-200' : 'text-red-700'} mb-3`}>
                      These actions cannot be undone. Please be careful.
                    </p>
                    <button className={`px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700`}>
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3`}>
              <button
                onClick={() => setShowSettingsModal(false)}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                } border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSettingsModal(false)}
                className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New VM Modal */}
      {showNewVMModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Create New Virtual Machine</h3>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVmConfigMode('preset');
                      setSelectedPreset('');
                    }}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      vmConfigMode === 'preset'
                        ? darkMode 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-blue-600 text-white'
                        : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => setVmConfigMode('custom')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      vmConfigMode === 'custom'
                        ? darkMode 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-blue-600 text-white'
                        : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Custom
                  </button>
                </div>
                <button
                  onClick={() => setShowNewVMModal(false)}
                  className={`p-2 rounded-md ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const vmData = {
                name: formData.get('name'),
                provider: formData.get('provider'),
                instanceType: formData.get('instanceType'),
                operatingSystem: formData.get('operatingSystem'),
                region: formData.get('region'),
                cpu: parseInt(formData.get('cpu') as string),
                memory: parseInt(formData.get('memory') as string),
                storage: parseInt(formData.get('storage') as string)
              };
              handleCreateVM(vmData);
            }}>
              <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto">
                {/* Mode Toggle */}
                <div className="flex space-x-1 mb-6">
                  <button
                    type="button"
                    onClick={() => setVmMode('preset')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      vmMode === 'preset'
                        ? 'bg-blue-600 text-white'
                        : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Preset Configuration
                  </button>
                  <button
                    type="button"
                    onClick={() => setVmMode('custom')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      vmMode === 'custom'
                        ? 'bg-blue-600 text-white'
                        : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Custom Configuration
                  </button>
                </div>

                {vmMode === 'preset' ? (
                  <div className="space-y-6">
                    {/* Cloud Provider Selection */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        Cloud Provider *
                      </label>
                      <select
                        value={newVmData.provider}
                        onChange={(e) => {
                          setNewVmData({ ...newVmData, provider: e.target.value });
                          setSelectedPresetType('');
                          setSelectedPresetConfig(null);
                        }}
                        className={`w-full px-3 py-2 border rounded-md ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        required
                      >
                        <option value="">Select Cloud Provider</option>
                        <option value="aws">Amazon Web Services (AWS)</option>
                        <option value="azure">Microsoft Azure</option>
                        <option value="proxmox">Proxmox VE</option>
                      </select>
                    </div>

                    {/* Preset Type Selection */}
                    {newVmData.provider && (
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                          Preset Configuration Type *
                        </label>
                        <select
                          value={selectedPresetType}
                          onChange={(e) => {
                            setSelectedPresetType(e.target.value);
                            setSelectedPresetConfig(null);
                          }}
                          className={`w-full px-3 py-2 border rounded-md ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                          required
                        >
                          <option value="">Choose Configuration Type</option>
                          <option value="web-server">🌐 Web Server</option>
                          <option value="database-server">🗄️ Database Server</option>
                          <option value="application-server">⚡ Application Server</option>
                          <option value="windows-desktop">🖥️ Windows Desktop</option>
                          <option value="development-environment">💻 Development Environment</option>
                          <option value="ml-workstation">🤖 ML Workstation</option>
                        </select>
                      </div>
                    )}

                    {/* Specific Preset Configurations */}
                    {selectedPresetType && newVmData.provider && (
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                          Available Configurations *
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {getPresetConfigurations(newVmData.provider, selectedPresetType).map((config, index) => (
                            <div
                              key={index}
                              onClick={() => setSelectedPresetConfig(config)}
                              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                selectedPresetConfig?.name === config.name
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                  : darkMode 
                                    ? 'border-gray-600 bg-gray-700 hover:border-gray-500' 
                                    : 'border-gray-300 bg-white hover:border-gray-400'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {config.name}
                                </h4>
                                <span className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                  ${config.costPerHour}/hr
                                </span>
                              </div>
                              <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} space-y-1`}>
                                <div>Instance: {config.instanceType}</div>
                                <div>CPU: {config.cpu} vCPU | RAM: {config.memory}GB</div>
                                <div>Storage: {config.storage}GB | OS: {config.os}</div>
                              </div>
                              <div className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Monthly: ~${(config.costPerHour * 24 * 30).toFixed(0)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Basic Configuration for Preset */}
                    {selectedPresetConfig && (
                      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Basic Configuration
                        </h4>
                        
                        {/* VM Name */}
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            VM Name *
                          </label>
                          <input
                            type="text"
                            value={newVmData.name}
                            onChange={(e) => setNewVmData({ ...newVmData, name: e.target.value })}
                            placeholder={`my-${selectedPresetConfig.name.toLowerCase().replace(/\s+/g, '-')}`}
                            className={`w-full px-3 py-2 border rounded-md ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                            required
                          />
                        </div>

                        {/* Region and Security Group */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                              Region *
                            </label>
                            <select
                              value={newVmData.region}
                              onChange={(e) => setNewVmData({ ...newVmData, region: e.target.value })}
                              className={`w-full px-3 py-2 border rounded-md ${
                                darkMode 
                                  ? 'bg-gray-700 border-gray-600 text-white' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                              required
                            >
                              <option value="">Select Region</option>
                              <option value="us-east-1">US East (N. Virginia)</option>
                              <option value="us-west-2">US West (Oregon)</option>
                              <option value="eu-west-1">EU (Ireland)</option>
                              <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                            </select>
                          </div>

                          <div>
                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                              Security Group
                            </label>
                            <select
                              value={newVmData.securityGroup}
                              onChange={(e) => setNewVmData({ ...newVmData, securityGroup: e.target.value })}
                              className={`w-full px-3 py-2 border rounded-md ${
                                darkMode 
                                  ? 'bg-gray-700 border-gray-600 text-white' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                            >
                              <option value="">Default Security Group</option>
                              <option value="web-server">Web Server (HTTP/HTTPS)</option>
                              <option value="database">Database Server</option>
                              <option value="ssh-only">SSH Only</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Custom VM Configuration
                  <div className="space-y-4">
                    {/* Basic Information */}
                    <div>
                      <h4 className={`text-md font-medium mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        Basic Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            VM Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            required
                            placeholder="my-web-server"
                            className={`w-full px-3 py-2 border rounded-md ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Cloud Provider *
                          </label>
                          <select
                            name="provider"
                            required
                            className={`w-full px-3 py-2 border rounded-md ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                          >
                            <option value="">Select Provider</option>
                            <option value="aws">Amazon Web Services</option>
                            <option value="azure">Microsoft Azure</option>
                            <option value="proxmox">Proxmox</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Instance Configuration */}
                    <div>
                      <h4 className={`text-md font-medium mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        Instance Configuration
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Instance Type *
                          </label>
                          <select
                            name="instanceType"
                            required
                            className={`w-full px-3 py-2 border rounded-md ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                          >
                            <option value="">Select Instance Type</option>
                            <option value="t3.micro">t3.micro (1 vCPU, 1GB RAM)</option>
                            <option value="t3.small">t3.small (2 vCPU, 2GB RAM)</option>
                            <option value="t3.medium">t3.medium (2 vCPU, 4GB RAM)</option>
                            <option value="t3.large">t3.large (2 vCPU, 8GB RAM)</option>
                            <option value="m5.large">m5.large (2 vCPU, 8GB RAM)</option>
                            <option value="m5.xlarge">m5.xlarge (4 vCPU, 16GB RAM)</option>
                          </select>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Operating System *
                          </label>
                          <select
                            name="operatingSystem"
                            required
                            className={`w-full px-3 py-2 border rounded-md ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                          >
                            <option value="">Select OS</option>
                            <option value="ubuntu-22.04">Ubuntu 22.04 LTS</option>
                            <option value="ubuntu-20.04">Ubuntu 20.04 LTS</option>
                            <option value="centos-8">CentOS 8</option>
                            <option value="debian-11">Debian 11</option>
                            <option value="windows-server-2022">Windows Server 2022</option>
                            <option value="windows-server-2019">Windows Server 2019</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Resource Allocation */}
                    <div>
                      <h4 className={`text-md font-medium mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        Resource Allocation
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            CPU Cores *
                          </label>
                          <select
                            name="cpu"
                            required
                            className={`w-full px-3 py-2 border rounded-md ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                          >
                            <option value="">Select CPU</option>
                            <option value="1">1 vCPU</option>
                            <option value="2">2 vCPU</option>
                            <option value="4">4 vCPU</option>
                            <option value="8">8 vCPU</option>
                            <option value="16">16 vCPU</option>
                          </select>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Memory (GB) *
                          </label>
                          <select
                            name="memory"
                            required
                            className={`w-full px-3 py-2 border rounded-md ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                          >
                            <option value="">Select RAM</option>
                            <option value="1">1 GB</option>
                            <option value="2">2 GB</option>
                            <option value="4">4 GB</option>
                            <option value="8">8 GB</option>
                            <option value="16">16 GB</option>
                            <option value="32">32 GB</option>
                          </select>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Storage (GB) *
                          </label>
                          <select
                            name="storage"
                            required
                            className={`w-full px-3 py-2 border rounded-md ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                          >
                            <option value="">Select Storage</option>
                            <option value="20">20 GB</option>
                            <option value="50">50 GB</option>
                            <option value="100">100 GB</option>
                            <option value="200">200 GB</option>
                            <option value="500">500 GB</option>
                            <option value="1000">1 TB</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <h4 className={`text-md font-medium mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        Location & Network
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Region *
                          </label>
                          <select
                            name="region"
                            required
                            className={`w-full px-3 py-2 border rounded-md ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                          >
                            <option value="">Select Region</option>
                            <option value="us-east-1">US East (N. Virginia)</option>
                            <option value="us-west-2">US West (Oregon)</option>
                            <option value="eu-west-1">Europe (Ireland)</option>
                            <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                            <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                          </select>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Security Group
                          </label>
                          <select
                            name="securityGroup"
                            className={`w-full px-3 py-2 border rounded-md ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                          >
                            <option value="default">Default Security Group</option>
                            <option value="web-server">Web Server (HTTP/HTTPS)</option>
                            <option value="database">Database Server</option>
                            <option value="custom">Custom Configuration</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Cost Estimate */}
                    <div className={`p-4 rounded-md ${darkMode ? 'bg-blue-900 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
                      <div className="flex items-start">
                        <DollarSign className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h4 className={`text-sm font-medium ${darkMode ? 'text-blue-100' : 'text-blue-800'}`}>
                            Estimated Cost
                          </h4>
                          <p className={`text-sm mt-1 ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                            Approximately <strong>$0.05 - $0.15 per hour</strong> depending on configuration.
                            Monthly estimate: <strong>$35 - $110</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3`}>
                <button
                  type="button"
                  onClick={() => setShowNewVMModal(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                  } border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateVM}
                  disabled={isCreatingVM || (vmMode === 'preset' ? !selectedPresetConfig : false)}
                  className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isCreatingVM || (vmMode === 'preset' ? !selectedPresetConfig : false) ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isCreatingVM ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating VM...
                    </div>
                  ) : (
                    'Create Virtual Machine'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}