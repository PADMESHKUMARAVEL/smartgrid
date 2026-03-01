/**
 * Backend API Service
 * Handles all communication with the Smart Grid backend
 * Base URL: http://localhost:5000/api
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class BackendApiService {
  /**
   * Initialize service with API URL
   */
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.timeout = 10000; // 10 second timeout
  }

  /**
   * Generic fetch with error handling
   */
  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * GET /api/health - Health check
   */
  async getHealth() {
    try {
      return await this.fetchWithTimeout(`${this.baseUrl}/health`);
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * GET /api/grid/state - Get current grid state
   */
  async getGridState() {
    try {
      return await this.fetchWithTimeout(`${this.baseUrl}/grid/state`);
    } catch (error) {
      console.error('Grid state fetch failed:', error);
      throw error;
    }
  }

  /**
   * GET /api/grid/paths - Get optimized paths
   */
  async getOptimizedPaths() {
    try {
      return await this.fetchWithTimeout(`${this.baseUrl}/grid/paths`);
    } catch (error) {
      console.error('Paths fetch failed:', error);
      throw error;
    }
  }

  /**
   * GET /api/grid/risk - Get risk analysis
   */
  async getRiskAnalysis() {
    try {
      return await this.fetchWithTimeout(`${this.baseUrl}/grid/risk`);
    } catch (error) {
      console.error('Risk analysis fetch failed:', error);
      throw error;
    }
  }

  /**
   * GET /api/grid/loss - Get loss metrics history
   */
  async getLossMetrics() {
    try {
      return await this.fetchWithTimeout(`${this.baseUrl}/grid/loss`);
    } catch (error) {
      console.error('Loss metrics fetch failed:', error);
      throw error;
    }
  }

  /**
   * GET /api/grid/statistics - Get comprehensive grid statistics
   */
  async getGridStatistics() {
    try {
      return await this.fetchWithTimeout(`${this.baseUrl}/grid/statistics`);
    } catch (error) {
      console.error('Statistics fetch failed:', error);
      throw error;
    }
  }

  /**
   * GET /api/grid/node/:id - Get specific node details
   */
  async getNodeDetails(nodeId) {
    try {
      return await this.fetchWithTimeout(`${this.baseUrl}/grid/node/${nodeId}`);
    } catch (error) {
      console.error(`Node ${nodeId} details fetch failed:`, error);
      throw error;
    }
  }

  /**
   * POST /api/grid/optimize - Trigger optimization
   */
  async triggerOptimization() {
    try {
      return await this.fetchWithTimeout(`${this.baseUrl}/grid/optimize`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Optimization trigger failed:', error);
      throw error;
    }
  }

  /**
   * GET /api/grid/data-source - Get data source status
   */
  async getDataSourceStatus() {
    try {
      return await this.fetchWithTimeout(`${this.baseUrl}/grid/data-source`);
    } catch (error) {
      console.error('Data source status fetch failed:', error);
      throw error;
    }
  }

  /**
   * Format grid state for dashboard display
   */
  formatGridStateForDashboard(gridState) {
    if (!gridState) return null;

    const { nodes = [], edges = [], metrics = {} } = gridState;

    // Calculate aggregated metrics
    const totalDemand = metrics.total_demand || 0;
    const avgVoltage = nodes.length > 0 
      ? nodes.reduce((sum, n) => sum + (n.voltage || 0), 0) / nodes.length 
      : 0;

    const avgRisk = edges.length > 0 
      ? edges.reduce((sum, e) => sum + (e.risk || 0), 0) / edges.length 
      : 0;

    const avgTemp = edges.length > 0 
      ? edges.reduce((sum, e) => sum + (e.temperature || 0), 0) / edges.length 
      : 0;

    return {
      totalDemand: totalDemand.toFixed(2),
      averageVoltage: avgVoltage.toFixed(1),
      averageRisk: avgRisk.toFixed(3),
      averageTemperature: avgTemp.toFixed(1),
      totalNodes: nodes.length,
      totalEdges: edges.length,
      generators: nodes.filter(n => n.type === 'generator').length,
      substations: nodes.filter(n => n.type === 'substation').length,
      alerts: this.generateAlerts(gridState),
    };
  }

  /**
   * Generate alerts based on grid state
   */
  generateAlerts(gridState) {
    const alerts = [];
    if (!gridState || !gridState.metrics || !gridState.edges) return alerts;

    const { metrics, edges, nodes } = gridState;

    // High Load Alert
    if (metrics.total_demand > 300) {
      alerts.push({
        id: 'high-load',
        type: 'warning',
        severity: 'high',
        title: 'High Network Load',
        message: `Current demand: ${metrics.total_demand.toFixed(2)} MW`,
      });
    }

    // High Risk Lines
    const highRiskEdges = edges.filter(e => e.risk > 0.6);
    if (highRiskEdges.length > 0) {
      alerts.push({
        id: 'high-risk',
        type: 'danger',
        severity: 'critical',
        title: `Critical Risk Lines (${highRiskEdges.length})`,
        message: `${highRiskEdges.length} transmission line(s) at high risk (>0.6)`,
      });
    }

    // High Temperature
    const highTempEdges = edges.filter(e => e.temperature > 60);
    if (highTempEdges.length > 0) {
      alerts.push({
        id: 'high-temp',
        type: 'danger',
        severity: 'critical',
        title: `Thermal Alert (${highTempEdges.length} lines)`,
        message: `${highTempEdges.length} line(s) above safe temperature (>60°C)`,
      });
    }

    // High Transmission Loss
    if (gridState.optimization && gridState.optimization.loss_percent > 0.4) {
      alerts.push({
        id: 'high-loss',
        type: 'warning',
        severity: 'medium',
        title: 'Transmission Loss High',
        message: `Current loss: ${gridState.optimization.loss_percent.toFixed(2)}%`,
      });
    }

    // Voltage Deviation
    const badVoltageNodes = nodes.filter(n => n.voltage < 200 || n.voltage > 240);
    if (badVoltageNodes.length > 0) {
      alerts.push({
        id: 'voltage-deviation',
        type: 'warning',
        severity: 'medium',
        title: `Voltage Deviation (${badVoltageNodes.length} nodes)`,
        message: `${badVoltageNodes.length} node(s) with abnormal voltage levels`,
      });
    }

    return alerts;
  }

  /**
   * Get real-time data with auto-refresh
   */
  async getRealtimeData() {
    try {
      const [state, stats, risk, loss] = await Promise.all([
        this.getGridState(),
        this.getGridStatistics(),
        this.getRiskAnalysis(),
        this.getLossMetrics(),
      ]);

      return { state, stats, risk, loss };
    } catch (error) {
      console.error('Real-time data fetch failed:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData() {
    try {
      const realtime = await this.getRealtimeData();
      const paths = await this.getOptimizedPaths();
      const dataSource = await this.getDataSourceStatus();

      return { ...realtime, paths, dataSource };
    } catch (error) {
      console.error('Dashboard data fetch failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
const backendApiService = new BackendApiService();
export default backendApiService;
