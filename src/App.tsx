import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import Login from './pages/Login';
import LogsView from './components/LogsView';
import MetricsView from './components/MetricsView';
import apiClient from './lib/api';

type View = 'dashboard' | 'logs' | 'metrics';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
    if (token) {
      apiClient.setToken(token);
      setIsAuthenticated(true);
    }
    setIsLoading(false);

    // Check for dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleLogin = (token: string) => {
    apiClient.setToken(token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    apiClient.clearToken();
    setIsAuthenticated(false);
    setCurrentView('dashboard');
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Render different views based on currentView state
  switch (currentView) {
    case 'logs':
      return (
        <LogsView 
          darkMode={darkMode} 
          onClose={() => setCurrentView('dashboard')} 
        />
      );
    case 'metrics':
      return (
        <MetricsView 
          darkMode={darkMode} 
          onClose={() => setCurrentView('dashboard')} 
        />
      );
    default:
      return (
        <Dashboard
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          onLogout={handleLogout}
          onViewLogs={() => setCurrentView('logs')}
          onViewMetrics={() => setCurrentView('metrics')}
        />
      );
  }
}

export default App;