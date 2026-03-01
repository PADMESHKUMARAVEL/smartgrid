/**
 * Grid Optimization Service - Backend Integration
 * Fetches real-time grid data from Python backend
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class GridOptimizationService {
  constructor() {
    this.lastGridState = null;
    this.lastOptimizationResult = null;
    this.cacheTimeout = 5000; // 5 seconds cache
    this.lastFetchTime = 0;
  }

  /**
   * Fetch current grid state from backend
   */
  async getGridState() {
    try {
      const response = await fetch(`${API_BASE_URL}/grid/state`);
      if (!response.ok) throw new Error('Failed to fetch grid state');
      
      this.lastGridState = await response.json();
      this.lastFetchTime = Date.now();
      return this.lastGridState;
    } catch (error) {
      console.error('Error fetching grid state:', error);
      return this.lastGridState || this.getMockGridState();
    }
  }

  /**
   * Trigger grid optimization episode
   */
  async optimizeGrid() {
    try {
      const response = await fetch(`${API_BASE_URL}/grid/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to optimize grid');
      
      const result = await response.json();
      this.lastOptimizationResult = result.episode_result;
      return result.episode_result;
    } catch (error) {
      console.error('Error optimizing grid:', error);
      return null;
    }
  }

  /**
   * Get optimized paths from latest optimization
   */
  async getOptimizedPaths() {
    try {
      const response = await fetch(`${API_BASE_URL}/grid/paths`);
      if (!response.ok) throw new Error('Failed to fetch paths');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching optimized paths:', error);
      return { paths: [], loss_percent: 0, avg_risk: 0 };
    }
  }

  /**
   * Get risk analysis for grid assets
   */
  async getRiskAnalysis() {
    try {
      const response = await fetch(`${API_BASE_URL}/grid/risk`);
      if (!response.ok) throw new Error('Failed to fetch risk analysis');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching risk analysis:', error);
      return { nodes: [], edges: [] };
    }
  }

  /**
   * Get transmission loss metrics
   */
  async getLossMetrics() {
    try {
      const response = await fetch(`${API_BASE_URL}/grid/loss`);
      if (!response.ok) throw new Error('Failed to fetch loss metrics');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching loss metrics:', error);
      return {
        history: [],
        risk_history: [],
        current_loss_percent: 0,
        current_avg_risk: 0
      };
    }
  }

  /**
   * Get node details
   */
  async getNodeDetails(nodeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/grid/node/${nodeId}`);
      if (!response.ok) throw new Error('Failed to fetch node details');
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching node ${nodeId} details:`, error);
      return null;
    }
  }

  /**
   * Get comprehensive grid statistics
   */
  async getGridStatistics() {
    try {
      const response = await fetch(`${API_BASE_URL}/grid/statistics`);
      if (!response.ok) throw new Error('Failed to fetch statistics');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching grid statistics:', error);
      return null;
    }
  }

  /**
   * Convert grid state to dashboard format
   */
  formatGridStateForDashboard(gridState) {
    if (!gridState || !gridState.metrics) {
      return {
        totalLoad: 0,
        transmissionLoss: 0,
        transmissionLossPercentage: 0,
        efficiency: 0,
        gridFrequency: 50,
        gridVoltage: 230,
        renewableShare: 0,
        activeAlertCount: 0,
        alerts: []
      };
    }

    const metrics = gridState.metrics;
    const totalDemand = metrics.total_demand || 0;
    const lossPercentage = this.lastOptimizationResult?.loss_percent || 2;
    const transmissionLoss = (totalDemand * lossPercentage) / 100;

    return {
      totalLoad: totalDemand,
      transmissionLoss: transmissionLoss,
      transmissionLossPercentage: lossPercentage,
      efficiency: Math.max(90, 100 - lossPercentage),
      gridFrequency: 50 + (Math.random() * 0.1 - 0.05),
      gridVoltage: 230 + (Math.random() * 10 - 5),
      renewableShare: (metrics.generators / metrics.total_nodes) * 100 || 0,
      activeAlertCount: this.generateAlerts(gridState).length,
      alerts: this.generateAlerts(gridState),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate alerts based on grid state
   */
  generateAlerts(gridState) {
    const alerts = [];

    if (!gridState || !gridState.edges) return alerts;

    // Check for high-risk edges
    gridState.edges.forEach(edge => {
      if (edge.risk > 0.6) {
        alerts.push({
          id: `alert_${edge.source}_${edge.target}_risk`,
          type: 'warning',
          title: 'High Risk on Transmission Line',
          location: `Line ${edge.source} <-> ${edge.target}`,
          time: new Date().toLocaleTimeString(),
          confidence: 85,
          action: 'Monitor or reroute power',
          nodeId: edge.source
        });
      }

      if (edge.temperature > 80) {
        alerts.push({
          id: `alert_${edge.source}_${edge.target}_temp`,
          type: 'warning',
          title: 'High Temperature',
          location: `Line ${edge.source} <-> ${edge.target}`,
          time: new Date().toLocaleTimeString(),
          confidence: 88,
          action: 'Monitor cooling system',
          nodeId: edge.source
        });
      }

      if (edge.current > 350) {
        alerts.push({
          id: `alert_${edge.source}_${edge.target}_overload`,
          type: 'critical',
          title: 'Line Overload Detected',
          location: `Line ${edge.source} <-> ${edge.target} - Current: ${edge.current.toFixed(0)} A`,
          time: new Date().toLocaleTimeString(),
          confidence: 92,
          action: 'Immediate attention required',
          nodeId: edge.source
        });
      }
    });

    return alerts.slice(0, 3); // Return top 3 alerts
  }

  /**
   * Convert optimized paths to visualization format
   */
  formatPathsForVisualization(pathData) {
    if (!pathData || !pathData.paths) return [];

    return pathData.paths.map((pathInfo, index) => ({
      id: `path_${index}`,
      load_node: pathInfo.load_node,
      load_name: pathInfo.load_name,
      generator_node: pathInfo.generator_node,
      generator_name: pathInfo.generator_name,
      path: pathInfo.path,
      length: pathInfo.path.length,
      demand: pathInfo.demand,
      loss: pathInfo.loss,
      color: this.getPathColor(index)
    }));
  }

  /**
   * Get color for path visualization
   */
  getPathColor(index) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
    return colors[index % colors.length];
  }

  /**
   * Mock grid state for fallback
   */
  getMockGridState() {
    return {
      nodes: [
        { id: 0, type: 'generator', demand: 0, voltage: 235, degree: 3 },
        { id: 1, type: 'generator', demand: 0, voltage: 235, degree: 3 },
        { id: 2, type: 'load', demand: 45, voltage: 230, degree: 2 },
        { id: 3, type: 'load', demand: 52, voltage: 228, degree: 3 },
        { id: 4, type: 'load', demand: 38, voltage: 231, degree: 2 },
        { id: 5, type: 'load', demand: 41, voltage: 229, degree: 3 },
        { id: 6, type: 'load', demand: 50, voltage: 232, degree: 2 },
        { id: 7, type: 'load', demand: 48, voltage: 230, degree: 3 }
      ],
      edges: [
        { source: 0, target: 1, resistance: 0.002, current: 150, temperature: 45, power_flow: 35, risk: 0.3 },
        { source: 0, target: 2, resistance: 0.003, current: 120, temperature: 50, power_flow: 28, risk: 0.4 },
        { source: 1, target: 3, resistance: 0.0025, current: 140, temperature: 48, power_flow: 32, risk: 0.35 }
      ],
      metrics: {
        total_demand: 274,
        total_nodes: 8,
        total_edges: 12,
        average_risk: 0.35,
        generators: 2
      }
    };
  }
}

const gridOptimizationService = new GridOptimizationService();
export default gridOptimizationService;
