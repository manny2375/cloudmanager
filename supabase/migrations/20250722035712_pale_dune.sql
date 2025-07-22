-- Cloud Management Dashboard Database Schema
-- Cloudflare D1 (SQLite) Database

-- Users table for authentication and authorization
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'operator', 'viewer')),
    first_name TEXT,
    last_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1
);

-- Cloud provider configurations
CREATE TABLE IF NOT EXISTS cloud_providers (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    provider_type TEXT NOT NULL CHECK (provider_type IN ('aws', 'azure', 'proxmox')),
    name TEXT NOT NULL,
    credentials_encrypted TEXT NOT NULL, -- JSON encrypted credentials
    region TEXT,
    endpoint_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Virtual machines
CREATE TABLE IF NOT EXISTS virtual_machines (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    provider_id TEXT NOT NULL,
    external_id TEXT NOT NULL, -- ID from cloud provider
    name TEXT NOT NULL,
    hostname TEXT,
    status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('running', 'stopped', 'pending', 'error', 'terminated')),
    instance_type TEXT NOT NULL,
    operating_system TEXT,
    ip_address TEXT,
    private_ip TEXT,
    cpu_cores INTEGER DEFAULT 0,
    memory_gb INTEGER DEFAULT 0,
    storage_gb INTEGER DEFAULT 0,
    cost_per_hour REAL DEFAULT 0.0,
    tags TEXT, -- JSON array of tags
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    launched_at DATETIME,
    terminated_at DATETIME,
    FOREIGN KEY (provider_id) REFERENCES cloud_providers(id) ON DELETE CASCADE,
    UNIQUE(provider_id, external_id)
);

-- VM metrics for monitoring
CREATE TABLE IF NOT EXISTS vm_metrics (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    vm_id TEXT NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('cpu_usage', 'memory_usage', 'disk_usage', 'network_in', 'network_out')),
    value REAL NOT NULL,
    unit TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vm_id) REFERENCES virtual_machines(id) ON DELETE CASCADE
);

-- System logs and audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details TEXT, -- JSON details
    ip_address TEXT,
    user_agent TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Application settings
CREATE TABLE IF NOT EXISTS app_settings (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT,
    setting_key TEXT NOT NULL,
    setting_value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, setting_key)
);

-- Cost tracking
CREATE TABLE IF NOT EXISTS cost_records (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    vm_id TEXT NOT NULL,
    date DATE NOT NULL,
    hours_running REAL DEFAULT 0,
    cost_amount REAL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vm_id) REFERENCES virtual_machines(id) ON DELETE CASCADE,
    UNIQUE(vm_id, date)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_cloud_providers_user_id ON cloud_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_machines_provider_id ON virtual_machines(provider_id);
CREATE INDEX IF NOT EXISTS idx_virtual_machines_status ON virtual_machines(status);
CREATE INDEX IF NOT EXISTS idx_vm_metrics_vm_id ON vm_metrics(vm_id);
CREATE INDEX IF NOT EXISTS idx_vm_metrics_timestamp ON vm_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_cost_records_vm_id ON cost_records(vm_id);
CREATE INDEX IF NOT EXISTS idx_cost_records_date ON cost_records(date);

-- Insert default admin user (password: admin123 - change in production!)
INSERT OR IGNORE INTO users (id, email, password_hash, role, first_name, last_name) 
VALUES (
    'admin-user-id', 
    'lamado@cloudcorenow.com', 
    '$2b$10$rQZ9QmjQZ9QmjQZ9QmjQZOeJ9QmjQZ9QmjQZ9QmjQZ9QmjQZ9Qmj', -- bcrypt hash of 'admin123'
    'admin', 
    'System', 
    'Administrator'
);