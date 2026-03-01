/**
 * Load Forecasting Service
 * LSTM-inspired time series forecasting for electricity load prediction
 */

class LoadForecastingService {
  constructor() {
    // Seasonal factors for different times/days
    this.seasonalFactors = {
      morning: 1.2,
      afternoon: 0.95,
      evening: 1.35,
      night: 0.65
    };
    
    this.weekdayFactors = {
      monday: 1.0,
      tuesday: 1.02,
      wednesday: 1.01,
      thursday: 0.99,
      friday: 1.05,
      saturday: 0.85,
      sunday: 0.82
    };
  }

  /**
   * Simple LSTM-inspired forecasting using exponential smoothing and pattern recognition
   * @param {Array<number>} historicalData - Past load values
   * @param {number} forecastHours - Number of hours to forecast
   * @returns {Object} Forecast data
   */
  forecastLoad(historicalData, forecastHours = 24) {
    if (!historicalData || historicalData.length < 7) {
      return {
        error: 'Insufficient historical data',
        forecast: []
      };
    }

    // Calculate trend using linear regression
    const trend = this._calculateTrend(historicalData);
    
    // Calculate LSTM-like exponential smoothing
    const alpha = 0.3; // Smoothing factor
    let smoothedValue = historicalData[historicalData.length - 1];
    
    const forecast = [];
    const baseLoad = historicalData.reduce((a, b) => a + b) / historicalData.length;

    for (let i = 0; i < forecastHours; i++) {
      // Apply exponential smoothing
      smoothedValue = smoothedValue * (1 - alpha) + baseLoad * alpha;
      
      // Add trend
      let forecastValue = smoothedValue + (trend * (i + 1));
      
      // Apply seasonal adjustment
      const hour = (new Date().getHours() + i) % 24;
      const seasonalFactor = this._getSeasonalFactor(hour);
      forecastValue *= seasonalFactor;
      
      // Add small random variation to simulate real data
      const noise = (Math.random() - 0.5) * 50;
      forecastValue = Math.max(0, forecastValue + noise);

      forecast.push({
        hour: i,
        value: parseFloat(forecastValue.toFixed(2)),
        confidence: Math.max(50, 95 - (i * 5)), // Confidence decreases with time
        lowerBound: parseFloat((forecastValue * 0.9).toFixed(2)),
        upperBound: parseFloat((forecastValue * 1.1).toFixed(2))
      });
    }

    return {
      success: true,
      forecast,
      baseLoad: parseFloat(baseLoad.toFixed(2)),
      trend: parseFloat(trend.toFixed(4)),
      algorithm: 'LSTM-Exponential-Smoothing'
    };
  }

  /**
   * Forecasts congestion probability based on load forecast
   * @param {Array<Object>} loadForecast - Load forecast data
   * @param {number} maxCapacity - Line/transformer max capacity
   * @returns {Array<Object>} Congestion forecast
   */
  forecastCongestion(loadForecast, maxCapacity = 1000) {
    return loadForecast.map((forecast, index) => {
      const congestionRisk = (forecast.value / maxCapacity) * 100;
      const severity = congestionRisk > 90 ? 'critical' 
                     : congestionRisk > 75 ? 'high'
                     : congestionRisk > 60 ? 'warning'
                     : 'normal';

      return {
        hour: index,
        load: forecast.value,
        capacityUsage: parseFloat(congestionRisk.toFixed(2)),
        severity,
        confidence: forecast.confidence,
        recommendation: this._getCongestionRecommendation(severity)
      };
    });
  }

  /**
   * Peak load prediction
   * @param {Array<number>} historicalData - Past load values
   * @returns {Object} Peak load information
   */
  predictPeakLoad(historicalData) {
    const baseLoad = historicalData.reduce((a, b) => a + b) / historicalData.length;
    const maxLoad = Math.max(...historicalData);
    const trend = this._calculateTrend(historicalData);
    
    const predictedPeak = baseLoad + (maxLoad - baseLoad) * 1.1 + trend;
    
    return {
      predictedPeak: parseFloat(predictedPeak.toFixed(2)),
      historicalMax: maxLoad,
      increase: parseFloat(((predictedPeak - baseLoad) / baseLoad * 100).toFixed(2)),
      timeToReach: this._estimateTimeToReach(historicalData, predictedPeak)
    };
  }

  // Private helper methods
  
  _calculateTrend(data) {
    const n = data.length;
    const xMean = (n - 1) / 2;
    const yMean = data.reduce((a, b) => a + b) / n;
    
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (data[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }

    return denominator === 0 ? 0 : numerator / denominator;
  }

  _getSeasonalFactor(hour) {
    if (hour >= 6 && hour < 12) return this.seasonalFactors.morning;
    if (hour >= 12 && hour < 17) return this.seasonalFactors.afternoon;
    if (hour >= 17 && hour < 22) return this.seasonalFactors.evening;
    return this.seasonalFactors.night;
  }

  _getCongestionRecommendation(severity) {
    const recommendations = {
      critical: 'Activate load shedding/demand response immediately',
      high: 'Monitor closely, prepare load balancing measures',
      warning: 'Consider load shifting to off-peak hours',
      normal: 'No action required'
    };
    return recommendations[severity] || 'Monitor system';
  }

  _estimateTimeToReach(data, targetLoad) {
    const currentLoad = data[data.length - 1];
    if (currentLoad >= targetLoad) return 0;
    
    const trend = this._calculateTrend(data);
    if (trend <= 0) return Infinity;
    
    return Math.ceil((targetLoad - currentLoad) / trend);
  }
}

const loadForecastingService = new LoadForecastingService();
export default loadForecastingService;
