// Database utilities for Cloudflare D1
export interface DatabaseBinding {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  exec(query: string): Promise<D1Result>;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'operator' | 'viewer';
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface CloudProvider {
  id: string;
  user_id: string;
  provider_type: 'aws' | 'azure' | 'proxmox';
  name: string;
  credentials_encrypted: string;
  region?: string;
  endpoint_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VirtualMachine {
  id: string;
  provider_id: string;
  external_id: string;
  name: string;
  hostname?: string;
  status: 'running' | 'stopped' | 'pending' | 'error' | 'terminated';
  instance_type: string;
  operating_system?: string;
  ip_address?: string;
  private_ip?: string;
  cpu_cores: number;
  memory_gb: number;
  storage_gb: number;
  cost_per_hour: number;
  tags?: string;
  created_at: string;
  updated_at: string;
  launched_at?: string;
  terminated_at?: string;
}

export interface VMMetric {
  id: string;
  vm_id: string;
  metric_type: 'cpu_usage' | 'memory_usage' | 'disk_usage' | 'network_in' | 'network_out';
  value: number;
  unit: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export class DatabaseService {
  constructor(private db: DatabaseBinding) {}

  // User management
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const stmt = this.db.prepare(`
      INSERT INTO users (email, password_hash, role, first_name, last_name, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *
    `);
    
    const result = await stmt.bind(
      userData.email,
      userData.password_hash,
      userData.role,
      userData.first_name || null,
      userData.last_name || null,
      userData.is_active
    ).first<User>();

    if (!result) {
      throw new Error('Failed to create user');
    }

    return result;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1');
    return await stmt.bind(email).first<User>();
  }

  async getUserById(id: string): Promise<User | null> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1');
    return await stmt.bind(id).first<User>();
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    const stmt = this.db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
    await stmt.bind(userId).run();
  }

  // Cloud provider management
  async createCloudProvider(providerData: Omit<CloudProvider, 'id' | 'created_at' | 'updated_at'>): Promise<CloudProvider> {
    const stmt = this.db.prepare(`
      INSERT INTO cloud_providers (user_id, provider_type, name, credentials_encrypted, region, endpoint_url, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);
    
    const result = await stmt.bind(
      providerData.user_id,
      providerData.provider_type,
      providerData.name,
      providerData.credentials_encrypted,
      providerData.region || null,
      providerData.endpoint_url || null,
      providerData.is_active
    ).first<CloudProvider>();

    if (!result) {
      throw new Error('Failed to create cloud provider');
    }

    return result;
  }

  async getCloudProvidersByUser(userId: string): Promise<CloudProvider[]> {
    const stmt = this.db.prepare('SELECT * FROM cloud_providers WHERE user_id = ? AND is_active = 1');
    const result = await stmt.bind(userId).all<CloudProvider>();
    return result.results || [];
  }

  // Virtual machine management
  async createVirtualMachine(vmData: Omit<VirtualMachine, 'id' | 'created_at' | 'updated_at'>): Promise<VirtualMachine> {
    const stmt = this.db.prepare(`
      INSERT INTO virtual_machines (
        provider_id, external_id, name, hostname, status, instance_type, 
        operating_system, ip_address, private_ip, cpu_cores, memory_gb, 
        storage_gb, cost_per_hour, tags, launched_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);
    
    const result = await stmt.bind(
      vmData.provider_id,
      vmData.external_id,
      vmData.name,
      vmData.hostname || null,
      vmData.status,
      vmData.instance_type,
      vmData.operating_system || null,
      vmData.ip_address || null,
      vmData.private_ip || null,
      vmData.cpu_cores,
      vmData.memory_gb,
      vmData.storage_gb,
      vmData.cost_per_hour,
      vmData.tags || null,
      vmData.launched_at || null
    ).first<VirtualMachine>();

    if (!result) {
      throw new Error('Failed to create virtual machine');
    }

    return result;
  }

  async getVirtualMachinesByProvider(providerId: string): Promise<VirtualMachine[]> {
    const stmt = this.db.prepare('SELECT * FROM virtual_machines WHERE provider_id = ? ORDER BY created_at DESC');
    const result = await stmt.bind(providerId).all<VirtualMachine>();
    return result.results || [];
  }

  async getVirtualMachinesByUser(userId: string): Promise<VirtualMachine[]> {
    const stmt = this.db.prepare(`
      SELECT vm.* FROM virtual_machines vm
      JOIN cloud_providers cp ON vm.provider_id = cp.id
      WHERE cp.user_id = ?
      ORDER BY vm.created_at DESC
    `);
    const result = await stmt.bind(userId).all<VirtualMachine>();
    return result.results || [];
  }

  async updateVirtualMachineStatus(vmId: string, status: VirtualMachine['status']): Promise<void> {
    const stmt = this.db.prepare('UPDATE virtual_machines SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    await stmt.bind(status, vmId).run();
  }

  // Metrics management
  async addVMMetric(metricData: Omit<VMMetric, 'id' | 'timestamp'>): Promise<VMMetric> {
    const stmt = this.db.prepare(`
      INSERT INTO vm_metrics (vm_id, metric_type, value, unit)
      VALUES (?, ?, ?, ?)
      RETURNING *
    `);
    
    const result = await stmt.bind(
      metricData.vm_id,
      metricData.metric_type,
      metricData.value,
      metricData.unit
    ).first<VMMetric>();

    if (!result) {
      throw new Error('Failed to add VM metric');
    }

    return result;
  }

  async getVMMetrics(vmId: string, metricType?: string, limit: number = 100): Promise<VMMetric[]> {
    let query = 'SELECT * FROM vm_metrics WHERE vm_id = ?';
    const params = [vmId];

    if (metricType) {
      query += ' AND metric_type = ?';
      params.push(metricType);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit.toString());

    const stmt = this.db.prepare(query);
    const result = await stmt.bind(...params).all<VMMetric>();
    return result.results || [];
  }

  // Audit logging
  async addAuditLog(logData: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);
    
    const result = await stmt.bind(
      logData.user_id || null,
      logData.action,
      logData.resource_type,
      logData.resource_id || null,
      logData.details || null,
      logData.ip_address || null,
      logData.user_agent || null
    ).first<AuditLog>();

    if (!result) {
      throw new Error('Failed to add audit log');
    }

    return result;
  }

  async getAuditLogs(userId?: string, limit: number = 100): Promise<AuditLog[]> {
    let query = 'SELECT * FROM audit_logs';
    const params: string[] = [];

    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit.toString());

    const stmt = this.db.prepare(query);
    const result = await stmt.bind(...params).all<AuditLog>();
    return result.results || [];
  }

  // Cost tracking
  async updateDailyCost(vmId: string, date: string, hoursRunning: number, costAmount: number): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO cost_records (vm_id, date, hours_running, cost_amount)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(vm_id, date) DO UPDATE SET
        hours_running = excluded.hours_running,
        cost_amount = excluded.cost_amount
    `);
    
    await stmt.bind(vmId, date, hoursRunning, costAmount).run();
  }

  async getMonthlyCosts(userId: string, year: number, month: number): Promise<any[]> {
    const stmt = this.db.prepare(`
      SELECT 
        vm.name,
        vm.instance_type,
        cp.provider_type,
        SUM(cr.cost_amount) as total_cost,
        SUM(cr.hours_running) as total_hours
      FROM cost_records cr
      JOIN virtual_machines vm ON cr.vm_id = vm.id
      JOIN cloud_providers cp ON vm.provider_id = cp.id
      WHERE cp.user_id = ? 
        AND strftime('%Y', cr.date) = ? 
        AND strftime('%m', cr.date) = ?
      GROUP BY vm.id, vm.name, vm.instance_type, cp.provider_type
      ORDER BY total_cost DESC
    `);
    
    const result = await stmt.bind(
      userId, 
      year.toString(), 
      month.toString().padStart(2, '0')
    ).all();
    
    return result.results || [];
  }
}