import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import backendApiService from '../../services/backendApiService';

const Monitoring = () => {
  const [gridState, setGridState] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [lossHistory, setLossHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, 3000); // Refresh every 3 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [state, stats, risk, loss] = await Promise.all([
        backendApiService.getGridState(),
        backendApiService.getGridStatistics(),
        backendApiService.getRiskAnalysis(),
        backendApiService.getLossMetrics(),
      ]);

      setGridState(state);
      setStatistics(stats);
      setRiskData(risk);
      
      if (loss && loss.history) {
        setLossHistory(loss.history.slice(-20).map((val, idx) => ({
          episode: idx + 1,
          loss: parseFloat(val.toFixed(3)),
        })));
      }
    } catch (err) {
      setError(err.message);
      console.error('Monitoring data fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !gridState) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-gray-900 text-center">Loading monitoring data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Network Monitoring</h1>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`px-4 py-2 rounded ${
            autoRefresh ? 'bg-green-600' : 'bg-gray-600'
          } hover:bg-opacity-80`}
        >
          {autoRefresh ? '🔄 Auto Refresh ON' : '⏸️ Auto Refresh OFF'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}

      {/* Key Metrics Grid */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Voltage */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-gray-600 text-sm mb-2">Average Voltage</p>
            <p className="text-2xl font-bold text-gray-900">
              {statistics.voltage?.mean?.toFixed(1) || 0} kV
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Min: {statistics.voltage?.min?.toFixed(1)} | Max: {statistics.voltage?.max?.toFixed(1)}
            </p>
          </div>

          {/* Demand */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-gray-600 text-sm mb-2">Total Demand</p>
            <p className="text-2xl font-bold text-gray-900">
              {statistics.demand?.total?.toFixed(2) || 0} MW
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Peak: {statistics.demand?.max?.toFixed(2)} MW
            </p>
          </div>

          {/* Risk */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-gray-600 text-sm mb-2">Average Risk</p>
            <p className="text-2xl font-bold text-gray-900">
              {statistics.risk?.mean?.toFixed(3) || 0}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              High Risk Lines: {statistics.risk?.high_risk_edges || 0}
            </p>
          </div>

          {/* Temperature */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-gray-600 text-sm mb-2">Avg Temperature</p>
            <p className="text-2xl font-bold text-gray-900">
              {statistics.temperature?.mean?.toFixed(1) || 0} °C
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Max: {statistics.temperature?.max?.toFixed(1)} °C
            </p>
          </div>
        </div>
      )}

      {/* Transmission Loss Trend */}
      {lossHistory.length > 0 && (
        <div className="mb-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Transmission Loss Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={lossHistory}>
              <defs>
                <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="episode" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toFixed(3)}%`} />
              <Area
                type="monotone"
                dataKey="loss"
                stroke="#8b5cf6"
                fillOpacity={1}
                fill="url(#colorLoss)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Risk Analysis */}
      {riskData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Risk Nodes */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">⚠️ Top Risk Nodes</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {(riskData.nodes || []).slice(0, 10).map((node) => (
                <div key={node.id} className="bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="font-semibold text-gray-900">{node.name}</p>
                  <p className="text-gray-600 text-sm">
                    Avg Risk: {node.average_neighbor_risk?.toFixed(3)}
                  </p>
                  <p className="text-red-600 text-sm">
                    Max Risk: {node.max_neighbor_risk?.toFixed(3)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Risk Edges */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🔥 Highest Risk Lines</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {(riskData.edges || []).slice(0, 10).map((edge) => (
                <div key={`${edge.source}-${edge.target}`} className="bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="font-semibold text-sm text-gray-900">
                    {edge.source_name} → {edge.target_name}
                  </p>
                  <div className="flex justify-between text-xs text-gray-600 mt-2">
                    <span>Risk: {edge.risk?.toFixed(3)}</span>
                    <span>Temp: {edge.temperature?.toFixed(1)}°C</span>
                    <span>Current: {edge.current?.toFixed(0)}A</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid State Details */}
      {gridState && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Current Grid State</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-600 mb-2">Iteration</p>
              <p className="text-2xl font-bold text-gray-900">{gridState.iteration || 0}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-2">Total Nodes/Edges</p>
              <p className="text-2xl font-bold text-gray-900">
                {gridState.metrics?.total_nodes || 0} / {gridState.metrics?.total_edges || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-600 mb-2">Last Updated</p>
              <p className="text-sm text-gray-600">
                {new Date(gridState.timestamp * 1000).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Monitoring;
