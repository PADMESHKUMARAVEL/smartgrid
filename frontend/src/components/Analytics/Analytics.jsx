import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import backendApiService from '../../services/backendApiService';

const Analytics = () => {
  const [gridState, setGridState] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [lossMetrics, setLossMetrics] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAnalyticsData, 4000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [state, stats, loss, risk] = await Promise.all([
        backendApiService.getGridState(),
        backendApiService.getGridStatistics(),
        backendApiService.getLossMetrics(),
        backendApiService.getRiskAnalysis(),
      ]);

      setGridState(state);
      setStatistics(stats);
      setLossMetrics(loss);
      setRiskData(risk);
    } catch (err) {
      setError(err.message);
      console.error('Analytics fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !statistics) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen text-gray-900">
        <div className="text-center">Loading analytics data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-gray-900">Network Analytics</h1>
            <p className="text-gray-600">Real-time grid performance metrics from backend</p>
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded ${
              autoRefresh ? 'bg-green-600' : 'bg-gray-600'
            } hover:bg-opacity-80`}
          >
            {autoRefresh ? '🔄 Auto Refresh' : '⏸️ Paused'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-700">Error: {error}</p>
          </div>
        )}

        {/* Key Metrics */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded border border-gray-200 shadow-sm">
              <p className="text-gray-600 text-sm mb-2">Avg Voltage</p>
              <p className="text-2xl font-bold text-blue-600">
                {statistics.voltage?.mean?.toFixed(1)} kV
              </p>
              <p className="text-gray-500 text-xs mt-2">
                σ: {statistics.voltage?.std?.toFixed(1)} kV
              </p>
            </div>

            <div className="bg-white p-6 rounded border border-gray-200 shadow-sm">
              <p className="text-gray-600 text-sm mb-2">Total Demand</p>
              <p className="text-2xl font-bold text-amber-600">
                {statistics.demand?.total?.toFixed(1)} MW
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Peak: {statistics.demand?.max?.toFixed(1)} MW
              </p>
            </div>

            <div className="bg-white p-6 rounded border border-gray-200 shadow-sm">
              <p className="text-gray-600 text-sm mb-2">Avg Risk</p>
              <p className="text-2xl font-bold text-red-600">
                {statistics.risk?.mean?.toFixed(3)}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                High Risk: {statistics.risk?.high_risk_edges} edges
              </p>
            </div>

            <div className="bg-white p-6 rounded border border-gray-200 shadow-sm">
              <p className="text-gray-600 text-sm mb-2">Avg Temperature</p>
              <p className="text-2xl font-bold text-orange-600">
                {statistics.temperature?.mean?.toFixed(1)} °C
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Max: {statistics.temperature?.max?.toFixed(1)} °C
              </p>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Loss History */}
          {lossMetrics && (
            <div className="bg-white p-6 rounded border border-gray-200 shadow-sm">
              <h2 className="text-lg font-bold mb-4 text-gray-900">Transmission Loss Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={
                  (lossMetrics.history || []).slice(-20).map((val, i) => ({
                    episode: i + 1,
                    loss: parseFloat(val.toFixed(3))
                  }))
                }>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db', color: '#1f2937' }} />
                  <Line type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Risk Trend */}
          {lossMetrics && (
            <div className="bg-white p-6 rounded border border-gray-200">
              <h2 className="text-lg font-bold mb-4 text-gray-900">Risk Assessment Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={
                  (lossMetrics.risk_history || []).slice(-20).map((val, i) => ({
                    episode: i + 1,
                    risk: parseFloat(val.toFixed(3))
                  }))
                }>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db', color: '#1f2937' }} />
                  <Line type="monotone" dataKey="risk" stroke="#f97316" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Voltage Distribution */}
          {statistics && (
            <div className="bg-white p-6 rounded border border-gray-200">
              <h2 className="text-lg font-bold mb-4 text-gray-900">Voltage Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'Min', value: statistics.voltage?.min?.toFixed(1) || 0 },
                  { name: 'Avg', value: statistics.voltage?.mean?.toFixed(1) || 0 },
                  { name: 'Max', value: statistics.voltage?.max?.toFixed(1) || 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db', color: '#1f2937' }} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Demand Distribution */}
          {statistics && (
            <div className="bg-white p-6 rounded border border-gray-200">
              <h2 className="text-lg font-bold mb-4 text-gray-900">Demand Statistics</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Min', value: statistics.demand?.min?.toFixed(1) || 0 },
                      { name: 'Avg', value: statistics.demand?.mean?.toFixed(1) || 0 },
                      { name: 'Max', value: statistics.demand?.max?.toFixed(1) || 0 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#facc15" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db', color: '#1f2937' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Risk Analysis */}
        {riskData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Edge Risk Distribution */}
            <div className="bg-white p-6 rounded border border-gray-200">
              <h2 className="text-lg font-bold mb-4 text-gray-900">Edge Risk Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Low (<0.3)', value: riskData.edges?.filter(e => e.risk < 0.3).length || 0 },
                      { name: 'Medium (0.3-0.6)', value: riskData.edges?.filter(e => e.risk >= 0.3 && e.risk <= 0.6).length || 0 },
                      { name: 'High (>0.6)', value: riskData.edges?.filter(e => e.risk > 0.6).length || 0 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#facc15" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db', color: '#1f2937' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Current Distribution */}
            {statistics && (
              <div className="bg-white p-6 rounded border border-gray-200">
                <h2 className="text-lg font-bold mb-4 text-gray-900">Current Statistics</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Min', current: statistics.current?.min?.toFixed(0) || 0 },
                    { name: 'Avg', current: statistics.current?.mean?.toFixed(0) || 0 },
                    { name: 'Max', current: statistics.current?.max?.toFixed(0) || 0 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db', color: '#1f2937' }} />
                    <Bar dataKey="current" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Summary Statistics Table */}
        {statistics && (
          <div className="bg-white p-6 rounded border border-gray-200">
            <h2 className="text-lg font-bold mb-4 text-gray-900">Summary Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Voltage (kV)</h3>
                <div className="space-y-2 text-gray-700">
                  <div className="flex justify-between"><span>Mean:</span><span className="text-gray-900 font-medium">{statistics.voltage?.mean?.toFixed(1)}</span></div>
                  <div className="flex justify-between"><span>Std Dev:</span><span className="text-gray-900 font-medium">{statistics.voltage?.std?.toFixed(1)}</span></div>
                  <div className="flex justify-between"><span>Min:</span><span className="text-gray-900 font-medium">{statistics.voltage?.min?.toFixed(1)}</span></div>
                  <div className="flex justify-between"><span>Max:</span><span className="text-gray-900 font-medium">{statistics.voltage?.max?.toFixed(1)}</span></div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Demand (MW)</h3>
                <div className="space-y-2 text-gray-700">
                  <div className="flex justify-between"><span>Total:</span><span className="text-gray-900 font-medium">{statistics.demand?.total?.toFixed(1)}</span></div>
                  <div className="flex justify-between"><span>Mean:</span><span className="text-gray-900 font-medium">{statistics.demand?.mean?.toFixed(1)}</span></div>
                  <div className="flex justify-between"><span>Min:</span><span className="text-gray-900 font-medium">{statistics.demand?.min?.toFixed(1)}</span></div>
                  <div className="flex justify-between"><span>Max:</span><span className="text-gray-900 font-medium">{statistics.demand?.max?.toFixed(1)}</span></div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Risk & Temperature</h3>
                <div className="space-y-2 text-gray-700">
                  <div className="flex justify-between"><span>Avg Risk:</span><span className="text-gray-900 font-medium">{statistics.risk?.mean?.toFixed(3)}</span></div>
                  <div className="flex justify-between"><span>High Risk Edges:</span><span className="text-gray-900 font-medium">{statistics.risk?.high_risk_edges}</span></div>
                  <div className="flex justify-between"><span>Avg Temp:</span><span className="text-gray-900 font-medium">{statistics.temperature?.mean?.toFixed(1)} °C</span></div>
                  <div className="flex justify-between"><span>Max Temp:</span><span className="text-gray-900 font-medium">{statistics.temperature?.max?.toFixed(1)} °C</span></div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Power Flow</h3>
                <div className="space-y-2 text-gray-700">
                  <div className="flex justify-between"><span>Total Flow:</span><span className="text-gray-900 font-medium">{statistics.power_flow?.total?.toFixed(1)} MW</span></div>
                  <div className="flex justify-between"><span>Mean Flow:</span><span className="text-gray-900 font-medium">{statistics.power_flow?.mean?.toFixed(1)} MW</span></div>
                  <div className="flex justify-between"><span>Max Flow:</span><span className="text-gray-900 font-medium">{statistics.power_flow?.max?.toFixed(1)} MW</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
