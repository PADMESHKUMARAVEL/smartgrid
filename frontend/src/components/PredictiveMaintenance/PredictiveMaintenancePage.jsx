import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Zap, Wrench, Calendar } from 'lucide-react';
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const PredictiveMaintenancePage = () => {
  const [maintenanceData, setMaintenanceData] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadMaintenanceData();
  }, []);

  const loadMaintenanceData = () => {
    const data = {
      summary: {
        totalEquipment: 127,
        criticalIssues: 3,
        scheduledMaintenance: 12,
        healthScore: 87.5,
      },
      equipment: [
        {
          id: 1,
          name: 'Transformer T-01',
          location: 'Substation A',
          type: 'Power Transformer',
          status: 'critical',
          healthScore: 42,
          temperature: 85,
          lastMaintenance: '2025-10-15',
          nextScheduled: '2026-03-01',
          remainingLife: '2 months',
          failureProbability: 0.87,
          notes: 'High temperature detected, immediate inspection recommended',
        },
        {
          id: 2,
          name: 'Circuit Breaker CB-05',
          location: 'Distribution Center B',
          type: 'Circuit Breaker',
          status: 'warning',
          healthScore: 61,
          temperature: 58,
          lastMaintenance: '2025-09-20',
          nextScheduled: '2026-02-15',
          remainingLife: '4 months',
          failureProbability: 0.52,
          notes: 'Slight degradation in insulation resistance',
        },
        {
          id: 3,
          name: 'Generator G-02',
          location: 'Power Plant C',
          type: 'Generator',
          status: 'critical',
          healthScore: 38,
          temperature: 92,
          lastMaintenance: '2025-08-10',
          nextScheduled: '2026-01-20',
          remainingLife: '1 month',
          failureProbability: 0.92,
          notes: 'Bearing wear detected, maintenance overdue',
        },
        {
          id: 4,
          name: 'Capacitor Bank CB-12',
          location: 'Substation A',
          type: 'Capacitor Bank',
          status: 'warning',
          healthScore: 72,
          temperature: 52,
          lastMaintenance: '2025-11-01',
          nextScheduled: '2026-04-01',
          remainingLife: '6 months',
          failureProbability: 0.35,
          notes: 'Within normal parameters, routine check recommended',
        },
        {
          id: 5,
          name: 'Transmission Line TL-15',
          location: 'Route D',
          type: 'Transmission Line',
          status: 'good',
          healthScore: 88,
          temperature: 45,
          lastMaintenance: '2025-11-15',
          nextScheduled: '2026-05-15',
          remainingLife: '8 months',
          failureProbability: 0.12,
          notes: 'Good condition, no issues detected',
        },
        {
          id: 6,
          name: 'Rectifier Unit REC-08',
          location: 'Control Center',
          type: 'Rectifier',
          status: 'good',
          healthScore: 85,
          temperature: 48,
          lastMaintenance: '2025-10-25',
          nextScheduled: '2026-04-25',
          remainingLife: '7 months',
          failureProbability: 0.18,
          notes: 'Operating normally',
        },
      ],
      predictionTrend: [
        { week: 'W1', transformer: 95, breaker: 88, generator: 82 },
        { week: 'W2', transformer: 88, breaker: 85, generator: 75 },
        { week: 'W3', transformer: 78, breaker: 80, generator: 68 },
        { week: 'W4', transformer: 65, breaker: 72, generator: 55 },
        { week: 'W5', transformer: 52, breaker: 61, generator: 42 },
        { week: 'W6', transformer: 42, breaker: 58, generator: 38 },
      ],
      riskAssessment: [
        { equipment: 'Transformer T-01', riskScore: 87, cost: 125000, downtime: 8 },
        { equipment: 'Generator G-02', riskScore: 92, cost: 250000, downtime: 16 },
        { equipment: 'Circuit Breaker CB-05', riskScore: 52, cost: 45000, downtime: 2 },
        { equipment: 'Capacitor Bank CB-12', riskScore: 35, cost: 35000, downtime: 1 },
      ],
    };

    setMaintenanceData(data);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'good':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5" />;
      case 'warning':
        return <Clock className="w-5 h-5" />;
      case 'good':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  if (!maintenanceData) {
    return <div className="p-6">Loading predictive maintenance data...</div>;
  }

  const filteredEquipment =
    filter === 'all'
      ? maintenanceData.equipment
      : maintenanceData.equipment.filter((eq) => eq.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Predictive Maintenance</h1>
          <p className="text-gray-600">AI-powered equipment health monitoring and maintenance planning</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">Total Equipment</p>
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold">{maintenanceData.summary.totalEquipment}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">Critical Issues</p>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{maintenanceData.summary.criticalIssues}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">Scheduled</p>
              <Calendar className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-yellow-600">{maintenanceData.summary.scheduledMaintenance}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">Overall Health</p>
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{maintenanceData.summary.healthScore.toFixed(1)}%</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Prediction Trend */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4">Health Score Prediction (6 Weeks)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={maintenanceData.predictionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="transformer" stackId="1" stroke="#EF4444" fill="#FECACA" />
                <Area type="monotone" dataKey="breaker" stackId="1" stroke="#F59E0B" fill="#FED7AA" />
                <Area type="monotone" dataKey="generator" stackId="1" stroke="#3B82F6" fill="#BFDBFE" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Assessment */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4">Risk Assessment</h2>
            <div className="space-y-3">
              {maintenanceData.riskAssessment.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.equipment}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full ${item.riskScore > 75 ? 'bg-red-500' : item.riskScore > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${item.riskScore}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-bold w-12 text-right">{item.riskScore}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Equipment Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Equipment Status</h2>
              <div className="flex gap-2">
                {['all', 'critical', 'warning', 'good'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition capitalize ${
                      filter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Equipment</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Health</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Next Maintenance</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Remaining Life</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEquipment.map((eq) => (
                  <tr key={eq.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">{eq.name}</p>
                        <p className="text-xs text-gray-600">{eq.type}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{eq.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(eq.status)}`}>
                        {getStatusIcon(eq.status)}
                        {eq.status.charAt(0).toUpperCase() + eq.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${eq.healthScore > 70 ? 'bg-green-500' : eq.healthScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${eq.healthScore}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold">{eq.healthScore}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{eq.nextScheduled}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{eq.remainingLife}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedEquipment(eq)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Modal */}
        {selectedEquipment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold">{selectedEquipment.name}</h3>
                  <p className="text-gray-600">{selectedEquipment.type}</p>
                </div>
                <button
                  onClick={() => setSelectedEquipment(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-600 text-sm">Location</p>
                  <p className="font-semibold text-gray-900">{selectedEquipment.location}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Health Score</p>
                  <p className="font-semibold text-gray-900">{selectedEquipment.healthScore}%</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Temperature</p>
                  <p className="font-semibold text-gray-900">{selectedEquipment.temperature}°C</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Failure Probability</p>
                  <p className="font-semibold text-gray-900">{(selectedEquipment.failureProbability * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Last Maintenance</p>
                  <p className="font-semibold text-gray-900">{selectedEquipment.lastMaintenance}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Next Scheduled</p>
                  <p className="font-semibold text-gray-900">{selectedEquipment.nextScheduled}</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 text-sm font-medium mb-2">Notes</p>
                <p className="text-gray-900 bg-blue-50 p-3 rounded">{selectedEquipment.notes}</p>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-medium">
                  Schedule Maintenance
                </button>
                <button
                  onClick={() => setSelectedEquipment(null)}
                  className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictiveMaintenancePage;
