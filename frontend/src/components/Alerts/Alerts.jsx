import React, { useState, useEffect } from 'react';
import backendApiService from '../../services/backendApiService';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [gridState, setGridState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchAlerts();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAlerts, 2000); // Refresh every 2 seconds for alerts
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const [state, risk, stats] = await Promise.all([
        backendApiService.getGridState(),
        backendApiService.getRiskAnalysis(),
        backendApiService.getGridStatistics(),
      ]);

      setGridState(state);
      
      // Generate alerts from real-time data
      const generatedAlerts = generateAlertsFromData(state, risk, stats);
      setAlerts(generatedAlerts);
    } catch (err) {
      setError(err.message);
      console.error('Alert fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAlertsFromData = (state, risk, stats) => {
    const alerts = [];
    const timestamp = new Date();

    if (!state || !state.edges || !state.nodes) return alerts;

    // Alert 1: Critical Risk Edges
    const criticalRiskEdges = state.edges.filter(e => e.risk > 0.7);
    if (criticalRiskEdges.length > 0) {
      criticalRiskEdges.slice(0, 3).forEach((edge, idx) => {
        alerts.push({
          id: `critical-risk-${idx}`,
          type: 'danger',
          severity: 'critical',
          title: '🚨 CRITICAL: Extremely High Risk Line',
          message: `${edge.source_name} → ${edge.target_name}`,
          details: `Risk: ${edge.risk.toFixed(3)} | Temp: ${edge.temperature.toFixed(1)}°C | Current: ${edge.current.toFixed(0)}A`,
          timestamp,
          actionable: true,
          action: 'Reduce load on this line immediately',
        });
      });
    }

    // Alert 2: High Temperature
    const hotEdges = state.edges.filter(e => e.temperature > 70);
    if (hotEdges.length > 0) {
      hotEdges.slice(0, 3).forEach((edge, idx) => {
        alerts.push({
          id: `hot-line-${idx}`,
          type: 'danger',
          severity: 'critical',
          title: '🔥 CRITICAL: Line Overheating',
          message: `${edge.source_name} → ${edge.target_name}`,
          details: `Temperature: ${edge.temperature.toFixed(1)}°C (threshold: 70°C) | Risk: ${edge.risk.toFixed(3)}`,
          timestamp,
          actionable: true,
          action: 'Activate cooling system or reduce current',
        });
      });
    }

    // Alert 3: Voltage Issues
    const badVoltageNodes = state.nodes.filter(
      n => n.voltage < 195 || n.voltage > 245
    );
    if (badVoltageNodes.length > 0) {
      badVoltageNodes.slice(0, 2).forEach((node, idx) => {
        alerts.push({
          id: `voltage-${idx}`,
          type: 'warning',
          severity: 'high',
          title: '⚡ High: Voltage Out of Bounds',
          message: `${node.name}`,
          details: `Voltage: ${node.voltage.toFixed(1)} kV (Safe: 200-240 kV)`,
          timestamp,
          actionable: true,
          action: 'Adjust voltage regulator settings',
        });
      });
    }

    // Alert 4: High Current
    const overCurrentEdges = state.edges.filter(e => e.current > 450);
    if (overCurrentEdges.length > 0) {
      overCurrentEdges.slice(0, 2).forEach((edge, idx) => {
        alerts.push({
          id: `overcurrent-${idx}`,
          type: 'warning',
          severity: 'high',
          title: '⚠️ High: Line Overcurrent',
          message: `${edge.source_name} → ${edge.target_name}`,
          details: `Current: ${edge.current.toFixed(0)}A (limit: 450A)`,
          timestamp,
          actionable: true,
          action: 'Redistribute load or enable alternative paths',
        });
      });
    }

    // Alert 5: High Transmission Loss
    if (state.optimization && state.optimization.loss_percent > 0.5) {
      alerts.push({
        id: 'high-loss',
        type: 'warning',
        severity: 'medium',
        title: '📊 Medium: High Transmission Loss',
        message: `Network Efficiency Degraded`,
        details: `Current loss: ${state.optimization.loss_percent.toFixed(2)}% (optimal: <0.4%)`,
        timestamp,
        actionable: true,
        action: 'Optimize power flow paths or check line resistance',
      });
    }

    // Alert 6: High Load
    if (state.metrics.total_demand > 350) {
      alerts.push({
        id: 'high-load',
        type: 'warning',
        severity: 'medium',
        title: '📈 Medium: Network Load High',
        message: `Grid operating near capacity`,
        details: `Current demand: ${state.metrics.total_demand.toFixed(2)} MW (warning: >350 MW)`,
        timestamp,
        actionable: false,
      });
    }

    // Alert 7: Many High Risk Lines
    const manyRiskEdges = state.edges.filter(e => e.risk > 0.5);
    if (manyRiskEdges.length > 5) {
      alerts.push({
        id: 'many-risks',
        type: 'warning',
        severity: 'medium',
        title: `⚠️ Medium: ${manyRiskEdges.length} Lines At Risk`,
        message: `Multiple transmission lines showing elevated risk`,
        details: `${manyRiskEdges.length} lines with risk >0.5 - system stability at risk`,
        timestamp,
        actionable: true,
        action: 'Review ML predictions and schedule maintenance',
      });
    }

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return alerts;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-50 border-red-300',
      high: 'bg-orange-50 border-orange-300',
      medium: 'bg-yellow-50 border-yellow-300',
      low: 'bg-blue-50 border-blue-300',
    };
    return colors[severity] || colors.low;
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      critical: '🚨',
      high: '⚠️',
      medium: '📊',
      low: 'ℹ️',
    };
    return icons[severity] || '📌';
  };

  const filteredAlerts = filterSeverity === 'all'
    ? alerts
    : alerts.filter(a => a.severity === filterSeverity);

  if (loading && alerts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-gray-900 text-center">Loading alerts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Active Alerts</h1>
          <p className="text-gray-600 mt-2">
            {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''} • 
            {alerts.filter(a => a.severity === 'critical').length} critical
          </p>
        </div>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`px-4 py-2 rounded text-white ${
            autoRefresh ? 'bg-green-600' : 'bg-gray-400'
          } hover:bg-opacity-80`}
        >
          {autoRefresh ? '🔄 Live' : '⏸️ Paused'}
        </button>
      </div>

      {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-700">Error: {error}</p>
          </div>
      )}

      {/* Filter */}
      <div className="mb-6 flex gap-2">
        {['all', 'critical', 'high', 'medium', 'low'].map(sev => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-4 py-2 rounded capitalize text-white ${
              filterSeverity === sev
                ? 'bg-blue-600'
                : 'bg-gray-300 text-gray-900 hover:bg-gray-400'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center bg-white rounded border border-gray-200">
            <p className="text-gray-600 text-lg">✅ No alerts - System healthy</p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div
              key={alert.id}
              className={`p-6 rounded border ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getSeverityIcon(alert.severity)}</span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{alert.title}</h3>
                    <p className="text-gray-700">{alert.message}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-600 whitespace-nowrap ml-4">
                  {alert.timestamp.toLocaleTimeString()}
                </span>
              </div>

              {alert.details && (
                <div className="ml-11 mb-3 p-3 bg-gray-100 rounded text-sm text-gray-800">
                  {alert.details}
                </div>
              )}

              {alert.actionable && alert.action && (
                <div className="ml-11 flex items-center gap-2 p-3 bg-yellow-50 rounded border border-yellow-200">
                  <span className="text-yellow-600">💡</span>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">Recommended Action:</p>
                    <p className="text-xs text-gray-700">{alert.action}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Alert Statistics */}
      {alerts.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-50 border border-red-200 p-4 rounded">
            <p className="text-gray-700 text-sm">Critical Alerts</p>
            <p className="text-3xl font-bold text-red-600">
              {alerts.filter(a => a.severity === 'critical').length}
            </p>
          </div>
          <div className="bg-orange-50 border border-orange-200 p-4 rounded">
            <p className="text-gray-700 text-sm">High Priority</p>
            <p className="text-3xl font-bold text-orange-600">
              {alerts.filter(a => a.severity === 'high').length}
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
            <p className="text-gray-700 text-sm">Medium Priority</p>
            <p className="text-3xl font-bold text-yellow-600">
              {alerts.filter(a => a.severity === 'medium').length}
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded">
            <p className="text-gray-700 text-sm">Total Alerts</p>
            <p className="text-3xl font-bold text-blue-600">{alerts.length}</p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Alerts;
