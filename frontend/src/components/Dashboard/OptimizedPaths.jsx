import React, { useState, useEffect } from 'react';
import { Route, Zap, AlertTriangle } from 'lucide-react';
import gridOptimizationService from '../../services/gridOptimizationService';

const OptimizedPaths = ({ optimizationResult = null }) => {
  const [paths, setPaths] = useState(optimizationResult);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [updateCount, setUpdateCount] = useState(0);

  // Fetch optimized paths continuously from backend
  useEffect(() => {
    const fetchOptimizedPaths = async () => {
      try {
        setIsLoading(true);
        const result = await gridOptimizationService.getOptimizedPaths();
        if (result) {
          setPaths(result);
          setUpdateCount(prev => prev + 1);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching optimized paths:', error);
        setIsLoading(false);
      }
      setLastUpdate(new Date());
    };

    // Initial fetch
    fetchOptimizedPaths();

    // Fetch every 3 seconds to match backend updates
    const interval = setInterval(fetchOptimizedPaths, 3000);

    return () => clearInterval(interval);
  }, []);

  // Use fetched paths, or fall back to prop
  const displayPaths = paths || optimizationResult;

  if (!displayPaths || !displayPaths.paths || displayPaths.paths.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Route className="w-5 h-5 text-blue-600" />
          Optimized Power Routes
        </h3>
        <p className="text-gray-500">{isLoading ? 'Loading live routes...' : 'Waiting for optimization results...'}</p>
      </div>
    );
  }


  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7B731'];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Route className="w-5 h-5 text-blue-600" />
          Live Optimized Power Routes
        </h3>
        <div className="text-sm text-gray-600 flex gap-4">
          <span>🔄 Updates: <span className="font-semibold text-green-600">{updateCount}</span></span>
          <span>Last: <span className="font-semibold">{lastUpdate.toLocaleTimeString()}</span></span>
          <span className="text-xs text-gray-500 font-semibold">{displayPaths.paths.length} routes</span>
        </div>
      </div>

      {isLoading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          ⏳ Updating routes...
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-2 px-3 font-semibold text-gray-700">From Station</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-700">To Generator</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-700">Demand</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-700">Path</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-700">Loss</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {displayPaths.paths.map((pathInfo, idx) => {
              const color = colors[idx % colors.length];
              const pathStr = pathInfo.path.join(' → ');
              const isHighLoss = pathInfo.loss > 5;

              return (
                <tr key={`${pathInfo.load_node}-${pathInfo.generator_node}-${idx}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-medium">{pathInfo.load_name}</span>
                    </div>
                    <span className="text-xs text-gray-500">ID: {pathInfo.load_node}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-green-700">{pathInfo.generator_name}</span>
                    <span className="text-xs text-gray-500 block">ID: {pathInfo.generator_node}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-blue-600">{pathInfo.demand.toFixed(1)} MW</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700">
                      {pathStr}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`font-semibold ${isHighLoss ? 'text-red-600' : 'text-green-600'}`}>
                      {pathInfo.loss.toFixed(3)}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      {isHighLoss ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <span className="text-xs text-yellow-600">⚠️ High Loss</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-600">✓ Optimal</span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600 mb-1">Total Demand</p>
          <p className="text-2xl font-bold text-blue-600">
            {displayPaths.total_demand?.toFixed(1) || '0'} MW
          </p>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm text-gray-600 mb-1">Network Loss</p>
          <p className="text-2xl font-bold text-orange-600">
            {displayPaths.loss_percent?.toFixed(3) || '0'}%
          </p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-gray-600 mb-1">Average Risk</p>
          <p className="text-2xl font-bold text-red-600">
            {displayPaths.avg_risk?.toFixed(3) || '0'}
          </p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-xs text-green-800">
          <span className="font-semibold">✓ Live Update:</span> Routes are optimized in real-time every 3 seconds. 
          Each route minimizes transmission loss while managing asset risk. Data from backend optimization engine.
        </p>
      </div>
    </div>
  );
};

export default OptimizedPaths;
