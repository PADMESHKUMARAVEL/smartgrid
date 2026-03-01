import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import backendApiService from '../../services/backendApiService';

const Optimization = () => {
  const [paths, setPaths] = useState([]);
  const [lossMetrics, setLossMetrics] = useState(null);
  const [gridState, setGridState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoOptimize, setAutoOptimize] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);
  const [optimizationData, setOptimizationData] = useState([]);

  useEffect(() => {
    fetchOptimizationData();
    
    if (autoOptimize) {
      const interval = setInterval(fetchOptimizationData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoOptimize]);

  const fetchOptimizationData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [pathData, loss, state] = await Promise.all([
        backendApiService.getOptimizedPaths(),
        backendApiService.getLossMetrics(),
        backendApiService.getGridState(),
      ]);

      if (pathData && pathData.paths) {
        setPaths(pathData.paths);
      }
      setLossMetrics(loss);
      setGridState(state);

      // Build optimization data for chart
      if (loss && loss.history) {
        setOptimizationData(
          loss.history.slice(-30).map((lossVal, idx) => ({
            episode: idx + 1,
            loss: parseFloat(lossVal.toFixed(3)),
            risk: loss.risk_history ? parseFloat(loss.risk_history[idx].toFixed(3)) : 0,
          }))
        );
      }
    } catch (err) {
      setError(err.message);
      console.error('Optimization data fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerOptimization = async () => {
    try {
      setLoading(true);
      const result = await backendApiService.triggerOptimization();
      console.log('Optimization triggered:', result);
      await fetchOptimizationData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && paths.length === 0) {
    return (
      <div className="p-6 bg-gray-900 min-h-screen">
        <div className="text-gray-900 text-center">Loading optimization data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-900">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Power Flow Optimization</h1>
          <p className="text-gray-600 mt-2">Real-time ML-based path optimization</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={triggerOptimization}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
          >
            🚀 Optimize Now
          </button>
          <button
            onClick={() => setAutoOptimize(!autoOptimize)}
            className={`px-4 py-2 rounded ${
              autoOptimize ? 'bg-green-600' : 'bg-gray-600'
            }`}
          >
            {autoOptimize ? '🔄 Auto ON' : '⏸️ Auto OFF'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}

      {/* Key Metrics */}
      {lossMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded border border-gray-700">
            <p className="text-gray-600 text-sm mb-2">Current Loss</p>
            <p className="text-2xl font-bold text-red-400">
              {lossMetrics.current_loss_percent?.toFixed(3)}%
            </p>
          </div>
          <div className="bg-gray-800 p-4 rounded border border-gray-700">
            <p className="text-gray-600 text-sm mb-2">Best Loss Achieved</p>
            <p className="text-2xl font-bold text-green-400">
              {lossMetrics.best_loss?.toFixed(3)}%
            </p>
          </div>
          <div className="bg-gray-800 p-4 rounded border border-gray-700">
            <p className="text-gray-600 text-sm mb-2">Current Risk</p>
            <p className="text-2xl font-bold text-orange-400">
              {lossMetrics.current_avg_risk?.toFixed(3)}
            </p>
          </div>
          <div className="bg-gray-800 p-4 rounded border border-gray-700">
            <p className="text-gray-600 text-sm mb-2">Total Episodes</p>
            <p className="text-2xl font-bold text-blue-400">
              {lossMetrics.total_episodes_trained || 0}
            </p>
          </div>
        </div>
      )}

      {/* Optimization Trends */}
      {optimizationData.length > 0 && (
        <div className="mb-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Optimization Progress</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={optimizationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="episode" stroke="#888" />
              <YAxis yAxisId="left" stroke="#888" />
              <YAxis yAxisId="right" orientation="right" stroke="#888" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #444' }}
                formatter={(value) => typeof value === 'number' ? value.toFixed(3) : value}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="loss"
                stroke="#ef4444"
                name="Loss %"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="risk"
                stroke="#f97316"
                name="Risk Level"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Optimized Paths */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Optimized Power Paths ({paths.length})</h2>
        
        {paths.length === 0 ? (
          <div className="p-8 text-center bg-gray-800 rounded border border-gray-700">
            <p className="text-gray-600">No optimized paths available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {paths.map((path, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedPath(selectedPath === idx ? null : idx)}
                className={`p-4 rounded border cursor-pointer transition ${
                  selectedPath === idx
                    ? 'bg-blue-900 border-blue-500'
                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-lg">
                      Path {idx + 1}: {path.load_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      to {path.generator_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Demand</p>
                    <p className="text-lg font-bold text-yellow-400">{path.demand?.toFixed(1)} MW</p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-gray-700 p-2 rounded">
                    <p className="text-xs text-gray-600">Loss</p>
                    <p className="font-bold text-red-400">{path.loss?.toFixed(4)} MW</p>
                  </div>
                  <div className="bg-gray-700 p-2 rounded">
                    <p className="text-xs text-gray-600">Hops</p>
                    <p className="font-bold text-blue-400">{path.path?.length || 0}</p>
                  </div>
                </div>

                {/* Expanded Path Details */}
                {selectedPath === idx && path.path && (
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <p className="text-sm font-semibold mb-2">Route Path:</p>
                    <div className="text-xs text-gray-300 bg-black bg-opacity-20 p-3 rounded">
                      {path.path.map((node, i) => (
                        <span key={i}>
                          Node {node}
                          {i < path.path.length - 1 && ' → '}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Optimization Statistics */}
      {gridState && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-gray-600 mb-2">Total Network Demand</p>
            <p className="text-3xl font-bold text-yellow-400">
              {gridState.optimization?.total_demand?.toFixed(2) || 0} MW
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-gray-600 mb-2">Network Efficiency</p>
            <p className="text-3xl font-bold text-green-400">
              {gridState.optimization?.loss_percent 
                ? (100 - gridState.optimization.loss_percent).toFixed(2)
                : 99.99
              }%
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-gray-600 mb-2">Average Path Risk</p>
            <p className="text-3xl font-bold text-orange-400">
              {gridState.optimization?.avg_risk?.toFixed(3) || 0}
            </p>
          </div>
        </div>
      )}

      {/* Optimization Algorithm Info */}
      <div className="mt-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Optimization Algorithm Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <p className="font-semibold text-gray-900 mb-2">🔧 Algorithm: Deep RL + Dijkstra</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Policy Network (PyTorch): 4-layer network</li>
              <li>Path Finding: Dijkstra with combined cost</li>
              <li>Cost Function: Resistance + ML Risk Score</li>
              <li>Optimization: Adam optimizer (lr=0.001)</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-2">📊 Optimization Features</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Real-time ML failure prediction</li>
              <li>Risk-weighted path selection</li>
              <li>Multi-path load distribution</li>
              <li>Continuous learning from data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Optimization;

