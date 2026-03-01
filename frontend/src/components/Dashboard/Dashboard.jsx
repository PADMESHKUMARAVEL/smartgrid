import React, { useState, useEffect } from 'react';
import StatsCards from './StatsCards';
import GridMap from './GridMap';
import AlertsPanel from './AlertsPanel';
import LossTrendChart from './LossTrendChart';
import LoadForecastChart from './LoadForecastChart';
import PredictiveMaintenance from './PredictiveMaintenance';
import OptimizedPaths from './OptimizedPaths';
import gridDataSimulationService from '../../services/gridDataSimulationService';
import gridOptimizationService from '../../services/gridOptimizationService';

const Dashboard = () => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [gridStatus, setGridStatus] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [gridState, setGridState] = useState(null);
  const [useBackendData, setUseBackendData] = useState(true);
  const [lossMetrics, setLossMetrics] = useState(null);
  const [isLoadingBackend, setIsLoadingBackend] = useState(false);

  const updateSimulationData = () => {
    // Fallback: Simulate real-time grid updates
    gridDataSimulationService.updateGridState();
    
    const status = gridDataSimulationService.getGridStatus();
    setGridStatus(status);
    setActiveAlerts(status.alerts);
  };

  const updateDashboardData = async () => {
    if (useBackendData) {
      try {
        // Fetch grid state from backend
        const state = await gridOptimizationService.getGridState();
        if (state) {
          setGridState(state);

          // Format for dashboard display
          const status = gridOptimizationService.formatGridStateForDashboard(state);
          setGridStatus(status);
          
          // Generate alerts based on current state
          const alerts = generateLiveAlerts(state, status);
          setActiveAlerts(alerts);

          // Extract optimization result if available
          if (state.optimization) {
            setOptimizationResult(state.optimization);
          }

          // Get loss metrics
          const metrics = await gridOptimizationService.getLossMetrics();
          if (metrics) {
            setLossMetrics(metrics);
          }
        }
      } catch (error) {
        console.error('Error fetching backend data:', error);
        // Fallback to simulation
        setUseBackendData(false);
        updateSimulationData();
      }
    } else {
      updateSimulationData();
    }
    setLastUpdated(new Date());
  };

  const generateLiveAlerts = (gridState, gridStatus) => {
    const alerts = [];

    if (!gridState || !gridState.metrics || !gridState.edges) {
      return alerts;
    }

    const { metrics, edges, nodes } = gridState;

    // Alert 1: High Load
    if (metrics.total_demand > 300) {
      alerts.push({
        id: 'high-load',
        type: 'warning',
        title: 'High Network Load',
        message: `Current demand: ${metrics.total_demand.toFixed(2)} MW (>300 MW threshold)`,
        severity: 'high',
        timestamp: new Date()
      });
    }

    // Alert 2: High Risk Areas
    const highRiskEdges = edges.filter(e => e.risk > 0.6);
    if (highRiskEdges.length > 0) {
      alerts.push({
        id: 'high-risk',
        type: 'danger',
        title: `⚠️ CRITICAL - High Risk Lines (${highRiskEdges.length})`,
        message: `${highRiskEdges.length} transmission line(s) operating above safe risk threshold (>0.6)`,
        severity: 'critical',
        timestamp: new Date(),
        affectedLines: highRiskEdges.map(e => `${e.source_name} → ${e.target_name} (Risk: ${e.risk.toFixed(3)})`).slice(0, 5)
      });
    }

    // Alert 3: Temperature Warning - Top 5 hottest lines
    const highTempEdges = edges.filter(e => e.temperature > 60)
      .sort((a, b) => b.temperature - a.temperature)
      .slice(0, 5);
    if (highTempEdges.length > 0) {
      const lineDetails = highTempEdges.map((e, idx) => 
        `Line ${idx + 1}: ${e.source_name} → ${e.target_name} | Temp: ${e.temperature.toFixed(1)}°C | Current: ${e.current.toFixed(0)}A | Risk: ${e.risk.toFixed(3)}`
      );
      alerts.push({
        id: 'high-temp',
        type: 'danger',
        title: `🔥 Critical Line Temperatures - ${highTempEdges.length} Lines > 60°C`,
        message: `Critical thermal alert on transmission lines - immediate cooling action recommended`,
        severity: 'critical',
        timestamp: new Date(),
        affectedLines: lineDetails
      });
    }

    // Alert 4: Transmission Loss Alert
    if (gridState.optimization && gridState.optimization.loss_percent > 0.40) {
      alerts.push({
        id: 'high-loss',
        type: 'warning',
        title: 'Network Losses Elevated',
        message: `Transmission loss: ${gridState.optimization.loss_percent.toFixed(2)}% (optimal < 0.4%)`,
        severity: 'medium',
        timestamp: new Date()
      });
    }

    // Alert 5: Voltage Stability
    const abnormalVoltages = nodes.filter(n => n.voltage < 200 || n.voltage > 240);
    if (abnormalVoltages.length > 0) {
      alerts.push({
        id: 'voltage-warning',
        type: 'warning',
        title: `⚡ Voltage Deviation (${abnormalVoltages.length} nodes)`,
        message: `${abnormalVoltages.length} substation(s) with abnormal voltage (Outside 200-240 kV)`,
        severity: 'medium',
        timestamp: new Date(),
        affectedNodes: abnormalVoltages.map(n => `${n.name} - ${n.voltage.toFixed(1)} kV`).slice(0, 5)
      });
    }

    // Alert 6: Generator Status
    const idleGenerators = nodes.filter(n => n.type === 'generator' && n.demand === 0);
    if (idleGenerators.length > 0) {
      alerts.push({
        id: 'generator-idle',
        type: 'info',
        title: `🔌 Generator Offline (${idleGenerators.length})`,
        message: `${idleGenerators.length} generator(s) currently idle - Consider activating if needed`,
        severity: 'low',
        timestamp: new Date(),
        affectedNodes: idleGenerators.map(n => n.name)
      });
    }

    return alerts;
  };

  useEffect(() => {
    // Initial data load
    updateDashboardData();

    // Update grid data every 3 seconds to match backend generation
    const interval = setInterval(() => {
      updateDashboardData();
    }, 3000);

    // Update UI timestamp every minute
    const uiInterval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000);

    return () => {
      clearInterval(interval);
      clearInterval(uiInterval);
    };
  }, [useBackendData]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Grid Operations Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
            {gridStatus && ` | Grid Status: ${gridStatus.efficiency.toFixed(1)}% Efficient`}
            {isLoadingBackend && ' | Loading...'}
          </p>
          {useBackendData && optimizationResult && (
            <p className="text-sm text-blue-600 mt-1">
              ✓ Backend integrated | Loss: {optimizationResult.loss_percent.toFixed(2)}% | Risk: {optimizationResult.avg_risk.toFixed(3)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={updateDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            disabled={isLoadingBackend}
          >
            {isLoadingBackend ? 'Optimizing...' : 'Refresh Data'}
          </button>
          <button 
            onClick={() => setUseBackendData(!useBackendData)}
            className={`px-4 py-2 rounded-lg transition ${useBackendData ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}`}
          >
            {useBackendData ? 'Backend Active' : 'Switch to Backend'}
          </button>
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Export Report
          </button>
        </div>
      </div>
      
      <StatsCards gridStatus={gridStatus} optimizationResult={optimizationResult} />
      
      <div className="grid grid-cols-3 gap-6 mt-6">
        <div className="col-span-2">
          <GridMap gridState={gridState} optimizationResult={optimizationResult} />
        </div>
        <div className="col-span-1">
          <AlertsPanel alerts={activeAlerts} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6 mt-6">
        <LossTrendChart lossMetrics={lossMetrics} />
        <LoadForecastChart />
      </div>

      {optimizationResult && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-bold text-blue-900 mb-3">Grid Optimization Results</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded">
              <p className="text-sm text-gray-600">Transmission Loss</p>
              <p className="text-2xl font-bold text-red-600">{optimizationResult.loss_percent.toFixed(2)}%</p>
            </div>
            <div className="bg-white p-3 rounded">
              <p className="text-sm text-gray-600">Average Asset Risk</p>
              <p className="text-2xl font-bold text-orange-600">{optimizationResult.avg_risk.toFixed(3)}</p>
            </div>
            <div className="bg-white p-3 rounded">
              <p className="text-sm text-gray-600">Optimized Paths</p>
              <p className="text-2xl font-bold text-green-600">{optimizationResult.paths.length}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <OptimizedPaths optimizationResult={optimizationResult} />
      </div>
      
      <div className="mt-6">
        <PredictiveMaintenance />
      </div>
    </div>
  );
};

export default Dashboard;