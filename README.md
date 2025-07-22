# Cloud Management Dashboard

A modern cloud infrastructure management dashboard built with React, TypeScript, and Cloudflare D1 database.

## Features

- **Multi-Cloud Support**: Manage AWS, Azure, and Proxmox virtual machines from a single interface
- **Real-time Monitoring**: Track CPU, memory, and network metrics across all platforms
- **Cost Tracking**: Monitor and analyze cloud spending with detailed cost breakdowns
- **Audit Logging**: Complete audit trail of all user actions and system events
- **Role-based Access**: Admin, operator, and viewer roles with appropriate permissions
- **Dark/Light Mode**: Modern UI with theme switching
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Authentication**: JWT with bcrypt password hashing
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Deployment**: Cloudflare Pages

## Database Schema

The application uses a comprehensive database schema with the following main tables:

- `users` - User accounts and authentication
- `cloud_providers` - Cloud provider configurations
- `virtual_machines` - VM inventory and metadata
- `vm_metrics` - Performance metrics and monitoring data
- `audit_logs` - System audit trail
- `cost_records` - Cost tracking and billing data
- `app_settings` - User preferences and configuration

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account
- Wrangler CLI installed globally: `npm install -g wrangler`

### Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd cloud-management-dashboard
   npm install
   ```

2. **Configure Cloudflare D1 Database**:
   ```bash
   # Create D1 database
   wrangler d1 create cloudmanager-db
   
   # Update wrangler.toml with your database ID
   # Copy the database_id from the output above
   ```

3. **Run database migrations**:
   ```bash
   # For local development
   npm run db:local
   
   # For production
   npm run db:migrate
   ```

4. **Set up JWT Secret in Cloudflare Workers**:
   The JWT secret has been configured in the Worker environment:
   - **Variable:** `JWT_SECRET`
   - **Type:** Secret (encrypted)
   - **Status:** ✅ Configured
   
   This secret is used for JWT token creation and verification in the authentication system.
   ```

5. **Development**:
   ```bash
   # Start local development server
   npm run dev
   
   # Test with local D1 database
   wrangler pages dev dist --d1 cloud-manager-db
   ```

6. **Deploy**:
   ```bash
   # Build and deploy to Cloudflare Pages
   npm run build
   npm run deploy
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Virtual Machines
- `GET /api/vms` - List user's VMs
- `POST /api/vms` - Create new VM
- `PUT /api/vms/:id` - Update VM
- `DELETE /api/vms/:id` - Delete VM

### Metrics
- `GET /api/vms/:id/metrics` - Get VM metrics
- `POST /api/vms/:id/metrics` - Add VM metric

### Audit & Costs
- `GET /api/audit-logs` - Get audit logs
- `GET /api/costs/monthly` - Get monthly cost breakdown

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Role-based Access Control**: Admin, operator, viewer roles
- **Audit Logging**: Complete activity tracking
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Proper CORS headers
- **SQL Injection Protection**: Parameterized queries

## Default Credentials

For initial setup, a default admin user is created:
- **Email**: lamado@cloudcorenow.com
- **Password**: admin123

**⚠️ Important**: Change these credentials immediately in production!

## Cost Optimization

The application includes several cost optimization features:

- **Real-time Cost Tracking**: Monitor spending across all cloud providers
- **Resource Utilization**: Track CPU, memory, and storage usage
- **Idle Resource Detection**: Identify underutilized VMs
- **Cost Alerts**: Set up notifications for budget thresholds
- **Historical Analysis**: Analyze spending trends over time

## Monitoring & Observability

- **Performance Metrics**: CPU, memory, disk, network monitoring
- **System Logs**: Centralized logging from all cloud providers
- **Audit Trail**: Complete user activity tracking
- **Real-time Updates**: Live status updates for all resources
- **Custom Dashboards**: Configurable monitoring views

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API documentation

## Roadmap

- [ ] Multi-factor authentication
- [ ] Advanced cost optimization recommendations
- [ ] Integration with more cloud providers
- [ ] Mobile app
- [ ] Advanced alerting and notifications
- [ ] Backup and disaster recovery automation
- [ ] Infrastructure as Code integration