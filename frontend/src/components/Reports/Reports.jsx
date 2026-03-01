import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import backendApiService from '../../services/backendApiService';

const Reports = () => {
  const [statistics, setStatistics] = useState(null);
  const [lossMetrics, setLossMetrics] = useState(null);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [gridState, setGridState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('overview');

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [stats, loss, risk, state] = await Promise.all([
        backendApiService.getGridStatistics(),
        backendApiService.getLossMetrics(),
        backendApiService.getRiskAnalysis(),
        backendApiService.getGridState(),
      ]);

      setStatistics(stats);
      setLossMetrics(loss);
      setRiskAnalysis(risk);
      setGridState(state);
    } catch (err) {
      setError(err.message);
      console.error('Report data fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const generatePdfReport = () => {
    // Simple text-based export (can be enhanced with libraries like jsPDF)
    const reportContent = `
SMART GRID OPERATIONAL REPORT
Generated: ${new Date().toLocaleString()}

=== GRID STATISTICS ===
Average Voltage: ${statistics?.voltage?.mean?.toFixed(1)} kV
Total Demand: ${statistics?.demand?.total?.toFixed(2)} MW
Average Risk: ${statistics?.risk?.mean?.toFixed(3)}
Average Temperature: ${statistics?.temperature?.mean?.toFixed(1)} °C

=== PERFORMANCE METRICS ===
Best Loss: ${lossMetrics?.best_loss?.toFixed(3)}%
Current Loss: ${lossMetrics?.current_loss_percent?.toFixed(3)}%
Worst Loss: ${lossMetrics?.worst_loss?.toFixed(3)}%
Current Risk: ${lossMetrics?.current_avg_risk?.toFixed(3)}

=== GRID STATE ===
Total Nodes: ${gridState?.metrics?.total_nodes}
Total Edges: ${gridState?.metrics?.total_edges}
Current Iteration: ${gridState?.iteration}
    `;

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(reportContent)}`);
    element.setAttribute('download', `grid_report_${new Date().getTime()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-gray-900 text-center">Loading report data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <button
          onClick={generatePdfReport}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded flex items-center gap-2"
        >
          📥 Export Report
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900 border border-red-500 rounded">
          <p className="text-red-200">Error: {error}</p>
        </div>
      )}

      {/* Report Type Selector */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {[
          { type: 'overview', label: 'Overview' },
          { type: 'performance', label: 'Performance' },
          { type: 'risk', label: 'Risk Analysis' },
          { type: 'efficiency', label: 'Efficiency' }
        ].map(item => (
          <button
            key={item.type}
            onClick={() => setReportType(item.type)}
            className={`px-4 py-2 rounded ${
              reportType === item.type
                ? 'bg-blue-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Overview Report */}
      {reportType === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-gray-400 text-sm mb-2">Avg Voltage</p>
                <p className="text-3xl font-bold text-blue-400">
                  {statistics.voltage?.mean?.toFixed(1)} kV
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Range: {statistics.voltage?.min?.toFixed(0)} - {statistics.voltage?.max?.toFixed(0)} kV
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-gray-400 text-sm mb-2">Total Demand</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {statistics.demand?.total?.toFixed(1)} MW
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Peak: {statistics.demand?.max?.toFixed(1)} MW
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-gray-400 text-sm mb-2">Avg Risk Level</p>
                <p className="text-3xl font-bold text-red-400">
                  {statistics.risk?.mean?.toFixed(3)}
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  High Risk: {statistics.risk?.high_risk_edges} edges
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-gray-400 text-sm mb-2">Avg Temperature</p>
                <p className="text-3xl font-bold text-orange-400">
                  {statistics.temperature?.mean?.toFixed(1)} °C
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Max: {statistics.temperature?.max?.toFixed(1)} °C
                </p>
              </div>
            </div>
          )}

          {/* Summary Charts */}
          {lossMetrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Loss History */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Loss Trend</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={
                    (lossMetrics.history || []).slice(-15).map((val, i) => ({
                      episode: i + 1,
                      loss: parseFloat(val.toFixed(3))
                    }))
                  }>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #444' }} />
                    <Line type="monotone" dataKey="loss" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Risk History */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Risk Trend</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={
                    (lossMetrics.risk_history || []).slice(-15).map((val, i) => ({
                      episode: i + 1,
                      risk: parseFloat(val.toFixed(3))
                    }))
                  }>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #444' }} />
                    <Line type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Performance Report */}
      {reportType === 'performance' && statistics && (
        <div className="space-y-6">
          {/* Current Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-gray-400 mb-2">Power Flow</p>
              <p className="text-3xl font-bold text-green-400">
                {statistics.power_flow?.total?.toFixed(1)} MW
              </p>
              <p className="text-gray-500 text-xs mt-2">Avg: {statistics.power_flow?.mean?.toFixed(1)} MW</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-gray-400 mb-2">Current</p>
              <p className="text-3xl font-bold text-blue-400">
                {statistics.current?.mean?.toFixed(0)} A
              </p>
              <p className="text-gray-500 text-xs mt-2">Max: {statistics.current?.max?.toFixed(0)} A</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-gray-400 mb-2">Frequency</p>
              <p className="text-3xl font-bold text-purple-400">50.00 Hz</p>
              <p className="text-gray-500 text-xs mt-2">Stable</p>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Demand Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Min Demand', value: statistics.demand?.min?.toFixed(1) || 0 },
                { name: 'Avg Demand', value: statistics.demand?.mean?.toFixed(1) || 0 },
                { name: 'Max Demand', value: statistics.demand?.max?.toFixed(1) || 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #444' }} />
                <Bar dataKey="value" fill="#facc15" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Risk Analysis Report */}
      {reportType === 'risk' && riskAnalysis && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Distribution */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Edge Risk Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Low (<0.3)', value: riskAnalysis.edges?.filter(e => e.risk < 0.3).length || 0 },
                      { name: 'Medium (0.3-0.6)', value: riskAnalysis.edges?.filter(e => e.risk >= 0.3 && e.risk <= 0.6).length || 0 },
                      { name: 'High (>0.6)', value: riskAnalysis.edges?.filter(e => e.risk > 0.6).length || 0 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#eab308" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top Risk Nodes */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Top Risk Nodes</h2>
              <div className="space-y-2">
                {(riskAnalysis.nodes || []).slice(0, 5).map((node, idx) => (
                  <div key={node.id} className="flex justify-between items-center p-3 bg-gray-700 rounded">
                    <span>{idx + 1}. {node.name}</span>
                    <span className="text-red-400 font-bold">
                      {node.average_neighbor_risk?.toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* High Risk Lines Table */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold mb-4">High Risk Transmission Lines</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-3 px-4">Line</th>
                    <th className="text-left py-3 px-4">Risk</th>
                    <th className="text-left py-3 px-4">Temperature</th>
                    <th className="text-left py-3 px-4">Current</th>
                  </tr>
                </thead>
                <tbody>
                  {(riskAnalysis.edges || []).filter(e => e.risk > 0.4).slice(0, 10).map((edge, idx) => (
                    <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700">
                      <td className="py-3 px-4">{edge.source_name} → {edge.target_name}</td>
                      <td className={`py-3 px-4 font-bold ${edge.risk > 0.6 ? 'text-red-400' : 'text-yellow-400'}`}>
                        {edge.risk?.toFixed(3)}
                      </td>
                      <td className="py-3 px-4">{edge.temperature?.toFixed(1)}°C</td>
                      <td className="py-3 px-4">{edge.current?.toFixed(0)}A</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Efficiency Report */}
      {reportType === 'efficiency' && lossMetrics && (
        <div className="space-y-6">
          {/* Loss Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-gray-400 mb-2">Best Efficiency</p>
              <p className="text-3xl font-bold text-green-400">
                {(100 - (lossMetrics.best_loss || 0)).toFixed(2)}%
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-gray-400 mb-2">Current Efficiency</p>
              <p className="text-3xl font-bold text-blue-400">
                {(100 - (lossMetrics.current_loss_percent || 0)).toFixed(2)}%
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-gray-400 mb-2">Episodes Trained</p>
              <p className="text-3xl font-bold text-purple-400">
                {lossMetrics.total_episodes_trained || 0}
              </p>
            </div>
          </div>

          {/* Loss Comparison */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Loss Comparison</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Best', loss: lossMetrics.best_loss?.toFixed(3) || 0 },
                { name: 'Worst', loss: lossMetrics.worst_loss?.toFixed(3) || 0 },
                { name: 'Current', loss: lossMetrics.current_loss_percent?.toFixed(3) || 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #444' }} />
                <Legend />
                <Bar dataKey="loss" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Reports;
