import React, { useState, useEffect } from 'react';
import { Wrench, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import gridDataSimulationService from '../../services/gridDataSimulationService';

const PredictiveMaintenance = () => {
  const [schedule, setSchedule] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    // Get maintenance schedule from service
    const maintenanceSchedule = gridDataSimulationService.getPredictiveMaintenanceSchedule();
    setSchedule(maintenanceSchedule);
  }, []);

  const getRiskColor = (priority) => {
    if (priority === 1) return 'bg-red-100 text-red-800';
    if (priority === 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getRiskLabel = (priority) => {
    if (priority === 1) return 'CRITICAL';
    if (priority === 2) return 'HIGH';
    return 'MEDIUM';
  };

  const getProgressColor = (priority) => {
    if (priority === 1) return 'bg-red-500';
    if (priority === 2) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPriorityIcon = (priority) => {
    if (priority === 1) return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (priority === 2) return <Clock className="w-5 h-5 text-yellow-600" />;
    return <CheckCircle className="w-5 h-5 text-green-600" />;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Predictive Maintenance Schedule
        </h3>
        <div className="flex gap-2">
          <button className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">Export</button>
          <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded">Full Schedule</button>
        </div>
      </div>

      <div className="space-y-4">
        {schedule && schedule.length > 0 ? (
          schedule.slice(0, 5).map((item) => (
            <div key={item.assetId} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
              <button
                onClick={() => setExpandedId(expandedId === item.assetId ? null : item.assetId)}
                className="w-full p-4 flex items-start justify-between bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex items-start gap-3 flex-1 text-left">
                  {getPriorityIcon(item.priority)}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.assetName}</h4>
                    <p className="text-sm text-gray-600">{item.assetType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">Risk: {item.riskScore}%</p>
                    <p className="text-xs text-gray-600">ETA: {item.estimatedDate}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(item.priority)}`}>
                    {getRiskLabel(item.priority)}
                  </span>
                </div>
              </button>

              {expandedId === item.assetId && (
                <div className="p-4 border-t bg-gray-50">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Risk Score</span>
                        <span className="font-semibold">{item.riskScore.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-300 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition ${getProgressColor(item.priority)}`}
                          style={{ width: `${Math.min(100, item.riskScore)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Estimated Maintenance Duration</p>
                        <p className="font-semibold">{item.estimatedDuration}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Scheduled Date</p>
                        <p className="font-semibold">{item.estimatedDate}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold mb-2 text-gray-900">Recommended Actions:</p>
                      <ul className="space-y-2">
                        {item.actionItems && item.actionItems.map((action, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button className="w-full py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition">
                      Schedule Maintenance
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-gray-600">No critical maintenance needed at this time</p>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-xs text-gray-600 mb-1">Critical Tasks</p>
          <p className="text-2xl font-bold text-red-600">{schedule.filter(s => s.priority === 1).length}</p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-xs text-gray-600 mb-1">High Priority</p>
          <p className="text-2xl font-bold text-yellow-600">{schedule.filter(s => s.priority === 2).length}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs text-gray-600 mb-1">Planned Maintenance</p>
          <p className="text-2xl font-bold text-green-600">{schedule.filter(s => s.priority === 3).length}</p>
        </div>
      </div>
    </div>
  );
};

export default PredictiveMaintenance;