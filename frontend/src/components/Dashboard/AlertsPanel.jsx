import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, AlertCircle, Info, Zap } from 'lucide-react';

const AlertsPanel = ({ alerts = [] }) => {
  const [displayAlerts, setDisplayAlerts] = useState(alerts);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [updateCount, setUpdateCount] = useState(0);

  // Update alerts whenever they change from parent
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      setDisplayAlerts(alerts);
      setUpdateCount(prev => prev + 1);
      setLastUpdated(new Date());
    }
  }, [alerts]);

  const getAlertIcon = (type) => {
    const iconClass = "w-4 h-4";
    switch(type) {
      case 'danger':
      case 'critical':
        return <AlertTriangle className={`${iconClass} text-red-600`} />;
      case 'warning':
        return <AlertCircle className={`${iconClass} text-yellow-600`} />;
      case 'info':
        return <Info className={`${iconClass} text-blue-600`} />;
      default:
        return <Bell className={`${iconClass} text-gray-600`} />;
    }
  };

  const getAlertStyles = (severity) => {
    switch(severity) {
      case 'critical':
        return { border: 'border-red-500', bg: 'bg-red-50', badge: 'bg-red-200 text-red-800' };
      case 'high':
        return { border: 'border-orange-500', bg: 'bg-orange-50', badge: 'bg-orange-200 text-orange-800' };
      case 'medium':
        return { border: 'border-yellow-500', bg: 'bg-yellow-50', badge: 'bg-yellow-200 text-yellow-800' };
      case 'low':
        return { border: 'border-blue-500', bg: 'bg-blue-50', badge: 'bg-blue-200 text-blue-800' };
      default:
        return { border: 'border-gray-500', bg: 'bg-gray-50', badge: 'bg-gray-200 text-gray-800' };
    }
  };

  const noAlerts = !displayAlerts || displayAlerts.length === 0;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm h-full border border-red-100">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">🔴 Live System Alerts</h3>
          <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full font-bold animate-pulse">
            {displayAlerts.length}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Updated: {lastUpdated.toLocaleTimeString()} | Count: {updateCount}
        </div>
      </div>
      
      {noAlerts ? (
        <div className="p-6 text-center">
          <div className="text-4xl mb-2">✓</div>
          <p className="text-gray-600 font-medium">All systems operational</p>
          <p className="text-xs text-gray-500 mt-1">No active alerts detected</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {displayAlerts.map((alert, idx) => {
            const severity = alert.severity || 'medium';
            const styles = getAlertStyles(severity);
            const affectedLines = alert.affectedLines || [];
            const affectedNodes = alert.affectedNodes || [];
            
            return (
              <div 
                key={`${alert.id}-${idx}`} 
                className={`p-4 rounded-lg border-l-4 ${styles.border} ${styles.bg} animate-in fade-in`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                      <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                      {affectedLines.length > 0 && (
                        <div className="mt-2 text-xs text-gray-600 bg-gray-100 rounded p-2 font-mono">
                          <p className="font-bold mb-1 text-gray-800">📊 Affected Lines ({affectedLines.length}):</p>
                          <ul className="space-y-1 text-gray-700">
                            {affectedLines.slice(0, 5).map((line, i) => (
                              <li key={i} className="pl-1 border-l-2 border-gray-400">
                                {line}
                              </li>
                            ))}
                            {affectedLines.length > 5 && (
                              <li className="text-gray-500 italic">+{affectedLines.length - 5} more lines</li>
                            )}
                          </ul>
                        </div>
                      )}
                      {affectedNodes.length > 0 && (
                        <div className="mt-2 text-xs text-gray-600 bg-gray-100 rounded p-2 font-mono">
                          <p className="font-bold mb-1 text-gray-800">🏢 Affected Nodes ({affectedNodes.length}):</p>
                          <ul className="space-y-1 text-gray-700">
                            {affectedNodes.slice(0, 5).map((node, i) => (
                              <li key={i} className="pl-1 border-l-2 border-gray-400">
                                {node}
                              </li>
                            ))}
                            {affectedNodes.length > 5 && (
                              <li className="text-gray-500 italic">+{affectedNodes.length - 5} more nodes</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ml-2 ${styles.badge} font-semibold`}>
                    {severity.toUpperCase()}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                  <span>⏰ {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'Just now'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <button className="w-full mt-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium text-sm">
        📊 View Alert History
      </button>
    </div>
  );
};

export default AlertsPanel;