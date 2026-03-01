/**
 * Grid Data Simulation Service
 * Simulates real-time grid operations and generates synthetic data
 */

import anomalyDetectionService from './anomalyDetectionService';
import loadForecastingService from './loadForecastingService';
import faultPredictionService from './faultPredictionService';

class GridDataSimulationService {
  constructor() {
    this.nodes = this._initializeNodes();
    this.historicalData = this._generateHistoricalData();
  }

  /**
   * Initialize grid nodes with realistic data
   */
  _initializeNodes() {
    return [
      {
        id: 1,
        name: 'Substation A',
        type: 'substation',
        voltage: 230 + Math.random() * 10,
        current: 850 + Math.random() * 100,
        load: 850,
        temperature: 45 + Math.random() * 15,
        frequency: 50 + Math.random() * 0.1,
        riskLevel: 'Low'
      },
      {
        id: 2,
        name: 'Substation B',
        type: 'substation',
        voltage: 230 + Math.random() * 10,
        current: 620 + Math.random() * 80,
        load: 620,
        temperature: 50 + Math.random() * 15,
        frequency: 50 + Math.random() * 0.1,
        riskLevel: 'Moderate'
      },
      {
        id: 3,
        name: 'Solar Farm',
        type: 'generation',
        voltage: 235 + Math.random() * 10,
        current: 450 + Math.random() * 60,
        load: 450,
        temperature: 40 + Math.random() * 10,
        frequency: 50 + Math.random() * 0.1,
        riskLevel: 'Low'
      },
      {
        id: 4,
        name: 'Wind Park',
        type: 'generation',
        voltage: 235 + Math.random() * 10,
        current: 380 + Math.random() * 50,
        load: 380,
        temperature: 38 + Math.random() * 10,
        frequency: 50 + Math.random() * 0.1,
        riskLevel: 'Low'
      },
      {
        id: 5,
        name: 'Industrial Zone',
        type: 'consumer',
        voltage: 225 + Math.random() * 15,
        current: 920 + Math.random() * 150,
        load: 920,
        temperature: 55 + Math.random() * 20,
        frequency: 50 + Math.random() * 0.15,
        riskLevel: 'High'
      },
      {
        id: 6,
        name: 'Residential Area',
        type: 'consumer',
        voltage: 230 + Math.random() * 10,
        current: 540 + Math.random() * 70,
        load: 540,
        temperature: 45 + Math.random() * 12,
        frequency: 50 + Math.random() * 0.1,
        riskLevel: 'Low'
      }
    ];
  }

  /**
   * Generate historical data for load forecasting
   */
  _generateHistoricalData() {
    const data = {};
    this.nodes.forEach(node => {
      data[node.id] = [];
      const baseLoad = node.load;
      for (let i = 0; i < 168; i++) { // 7 days of hourly data
        const hour = (i % 24);
        let hourlyLoad = baseLoad;
        
        // Seasonal pattern
        if (hour >= 6 && hour < 12) hourlyLoad *= 1.2;
        else if (hour >= 12 && hour < 17) hourlyLoad *= 0.95;
        else if (hour >= 17 && hour < 22) hourlyLoad *= 1.35;
        else hourlyLoad *= 0.65;
        
        // Add random variation
        hourlyLoad += (Math.random() - 0.5) * baseLoad * 0.2;
        data[node.id].push(Math.max(0, hourlyLoad));
      }
    });
    return data;
  }

  /**
   * Get real-time grid status
   */
  getGridStatus() {
    const totalLoad = this.nodes.reduce((sum, node) => sum + node.load, 0);
    const transmissionLoss = totalLoad * 0.018;
    const renewableShare = (this.nodes.filter(n => n.type === 'generation').reduce((sum, n) => sum + n.load, 0) / totalLoad) * 100;
    const activeAlerts = this._generateAlerts();

    return {
      timestamp: new Date().toISOString(),
      totalLoad: parseFloat(totalLoad.toFixed(2)),
      transmissionLoss: parseFloat(transmissionLoss.toFixed(2)),
      transmissionLossPercentage: parseFloat((transmissionLoss / totalLoad * 100).toFixed(2)),
      renewableShare: parseFloat(renewableShare.toFixed(1)),
      activeAlertCount: activeAlerts.length,
      gridFrequency: 50 + Math.random() * 0.05,
      gridVoltage: 230 + Math.random() * 5,
      efficiency: parseFloat((95 + Math.random() * 4).toFixed(1)),
      alerts: activeAlerts
    };
  }

  /**
   * Get node details with AI analysis
   */
  getNodeDetails(nodeId) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return null;

    const historicalData = this.historicalData[nodeId];
    
    // Run AI analyses
    const anomaly = anomalyDetectionService.detectConsumptionAnomaly(
      historicalData.slice(-24),
      node.current
    );

    const voltageAnomaly = anomalyDetectionService.detectVoltageAnomaly(node.voltage);
    
    const overloadDetection = anomalyDetectionService.detectOverload({
      current: node.current,
      temperature: node.temperature,
      ratedCapacity: 1000
    });

    // Load forecast
    const forecast = loadForecastingService.forecastLoad(historicalData.slice(-24), 24);
    
    // Fault prediction
    const faultPrediction = faultPredictionService.predictTransformerFault({
      temperature: node.temperature,
      age: 10 + Math.random() * 20,
      lastMaintenance: 30 + Math.random() * 300,
      vibrationLevel: Math.random() * 8,
      efficiency: 0.88 + Math.random() * 0.1,
      loadPercentage: (node.current / 1000) * 100
    });

    return {
      ...node,
      anomalyDetection: anomaly,
      voltageAnomaly,
      overloadDetection,
      loadForecast: forecast.forecast,
      faultPrediction,
      riskScore: faultPrediction.riskScore
    };
  }

  /**
   * Generate alerts based on current grid state
   */
  _generateAlerts() {
    const alerts = [];

    this.nodes.forEach(node => {
      // Overload alert
      if (node.current > 900) {
        alerts.push({
          id: `alert_${node.id}_overload`,
          type: 'critical',
          title: 'Transformer Overload',
          location: `${node.name} - Load: ${parseFloat(node.current.toFixed(0))} A`,
          time: new Date().toLocaleTimeString(),
          confidence: 94,
          action: 'Immediate attention required',
          nodeId: node.id
        });
      }

      // Congestion alert
      if (node.load > 750) {
        alerts.push({
          id: `alert_${node.id}_congestion`,
          type: 'warning',
          title: 'Line Congestion Detected',
          location: `Line to ${node.name}`,
          time: new Date().toLocaleTimeString(),
          confidence: 87,
          action: 'Consider load balancing',
          nodeId: node.id
        });
      }

      // Temperature alert
      if (node.temperature > 60) {
        alerts.push({
          id: `alert_${node.id}_temp`,
          type: 'warning',
          title: 'High Temperature',
          location: `${node.name} - Temp: ${parseFloat(node.temperature.toFixed(1))}°C`,
          time: new Date().toLocaleTimeString(),
          confidence: 88,
          action: 'Monitor cooling system',
          nodeId: node.id
        });
      }

      // Voltage deviation alert
      if (Math.abs(node.voltage - 230) > 15) {
        alerts.push({
          id: `alert_${node.id}_voltage`,
          type: 'warning',
          title: 'Voltage Deviation',
          location: `${node.name} - Voltage: ${parseFloat(node.voltage.toFixed(1))} V`,
          time: new Date().toLocaleTimeString(),
          confidence: 91,
          action: 'Check voltage regulation equipment',
          nodeId: node.id
        });
      }
    });

    return alerts.slice(0, 3); // Return top 3 alerts
  }

  /**
   * Get loss heatmap data
   */
  getLossHeatmap() {
    return this.nodes.map(node => ({
      id: node.id,
      name: node.name,
      lossPercentage: (Math.random() * 3 + node.currentLoad * 0.02),
      severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
    }));
  }

  /**
   * Get renewable energy distribution
   */
  getRenewableShare() {
    const renewableNodes = this.nodes.filter(n => n.type === 'generation');
    const totalGeneration = renewableNodes.reduce((sum, n) => sum + n.load, 0);
    
    return renewableNodes.map(node => ({
      name: node.name,
      generation: node.load,
      percentage: (node.load / totalGeneration * 100)
    }));
  }

  /**
   * Generate predictive maintenance schedule
   */
  getPredictiveMaintenanceSchedule() {
    const assets = this.nodes.map((node, index) => ({
      id: node.id,
      name: node.name,
      type: 'transformer',
      data: {
        temperature: node.temperature,
        age: 5 + Math.random() * 20,
        lastMaintenance: 10 + Math.random() * 350,
        vibrationLevel: Math.random() * 8,
        efficiency: 0.88 + Math.random() * 0.1,
        loadPercentage: (node.current / 1000) * 100
      }
    }));

    return faultPredictionService.generateMaintenanceSchedule(assets);
  }

  /**
   * Update grid state (simulates real-time data)
   */
  updateGridState() {
    this.nodes = this.nodes.map(node => ({
      ...node,
      voltage: 230 + Math.random() * 20 - 10,
      current: node.load + Math.random() * 200 - 100,
      temperature: node.temperature + Math.random() * 4 - 2,
      frequency: 50 + Math.random() * 0.2 - 0.1
    }));
  }
}

const gridDataSimulationService = new GridDataSimulationService();
export default gridDataSimulationService;
