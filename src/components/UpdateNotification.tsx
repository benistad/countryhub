import { useEffect } from 'react';
import { RefreshCw, CheckCircle, X } from 'lucide-react';

interface UpdateNotificationProps {
  show: boolean;
  message: string;
  type: 'success' | 'info' | 'loading';
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export function UpdateNotification({ 
  show, 
  message, 
  type, 
  onClose, 
  autoClose = true, 
  duration = 3000 
}: UpdateNotificationProps) {
  useEffect(() => {
    if (show && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, autoClose, duration, onClose]);

  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'loading':
        return <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <RefreshCw className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'loading':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ${
      show ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
    }`}>
      <div className={`${getBgColor()} border rounded-lg shadow-lg p-4`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onClose}
            >
              <span className="sr-only">Fermer</span>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RefreshButtonProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdate?: string | null;
}

export function RefreshButton({ onRefresh, isRefreshing, lastUpdate }: RefreshButtonProps) {
  const formatLastUpdate = (dateString: string | null) => {
    if (!dateString) return 'Jamais';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'À l\'instant';
      if (diffMins < 60) return `Il y a ${diffMins} min`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Il y a ${diffHours}h`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `Il y a ${diffDays}j`;
    } catch {
      return 'Inconnu';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white transition-colors duration-200 ${
          isRefreshing 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        }`}
        title="Actualiser toutes les données"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Actualisation...' : 'Actualiser'}
      </button>
      
      {lastUpdate && (
        <span className="text-xs text-gray-500">
          Dernière mise à jour: {formatLastUpdate(lastUpdate)}
        </span>
      )}
    </div>
  );
}
