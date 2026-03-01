/**
 * Fault Prediction Service
 * Classification-based prediction for transformer & line failures
 */

class FaultPredictionService {
  constructor() {
    // Risk factor weights
    this.weights = {
      temperature: 0.25,
      age: 0.15,
      maintenance: 0.20,
      vibration: 0.15,
      efficiency: 0.15,
      load: 0.10
    };
  }

  /**
   * Predicts transformer failure risk using multiple indicators
   * @param {Object} transformerData - Transformer operational metrics
   * @returns {Object} Fault prediction result
   */
  predictTransformerFault(transformerData) {
    const {
      temperature = 65,
      age = 10,
      lastMaintenance = 24,
      vibrationLevel = 2.5,
      efficiency = 0.92,
      loadPercentage = 65
    } = transformerData;

    let riskScore = 0;

    // Temperature assessment (higher temp = higher risk)
    // Optimal: <55°C, Warning: 55-75°C, Critical: >75°C
    const tempRisk = temperature > 75 ? 0.9 : temperature > 55 ? 0.5 : 0.1;
    riskScore += tempRisk * this.weights.temperature * 100;

    // Age assessment
    // New: 0-5 yrs (low risk), Mid-life: 5-20 yrs (medium), Old: >20 yrs (high)
    const ageRisk = age > 25 ? 0.9 : age > 15 ? 0.6 : age > 5 ? 0.3 : 0.1;
    riskScore += ageRisk * this.weights.age * 100;

    // Maintenance assessment (days since last maintenance)
    const maintenanceRisk = lastMaintenance > 365 ? 0.9 : lastMaintenance > 180 ? 0.6 : 0.2;
    riskScore += maintenanceRisk * this.weights.maintenance * 100;

    // Vibration level assessment
    const vibrationRisk = vibrationLevel > 5 ? 0.9 : vibrationLevel > 3 ? 0.6 : 0.2;
    riskScore += vibrationRisk * this.weights.vibration * 100;

    // Efficiency degradation
    const efficiencyRisk = efficiency < 0.88 ? 0.8 : efficiency < 0.90 ? 0.5 : 0.1;
    riskScore += efficiencyRisk * this.weights.efficiency * 100;

    // Load stress
    const loadRisk = loadPercentage > 90 ? 0.8 : loadPercentage > 75 ? 0.5 : 0.2;
    riskScore += loadRisk * this.weights.load * 100;

    riskScore = Math.min(100, riskScore);

    // Determine severity and maintenance urgency
    let severity = 'low';
    let maintenanceUrgency = 'routine';
    let confidence = 75;

    if (riskScore > 75) {
      severity = 'critical';
      maintenanceUrgency = 'immediate';
      confidence = 95;
    } else if (riskScore > 55) {
      severity = 'high';
      maintenanceUrgency = 'urgent';
      confidence = 88;
    } else if (riskScore > 35) {
      severity = 'medium';
      maintenanceUrgency = 'soon';
      confidence = 80;
    }

    // Estimate time to failure (in days)
    const timeToFailure = this._estimateTimeToFailure(riskScore);

    return {
      predicted: riskScore > 50,
      riskScore: parseFloat(riskScore.toFixed(2)),
      severity,
      confidence,
      timeToFailureEstimate: timeToFailure,
      maintenanceUrgency,
      factors: {
        temperature: parseFloat((tempRisk * 100).toFixed(2)),
        age: parseFloat((ageRisk * 100).toFixed(2)),
        maintenance: parseFloat((maintenanceRisk * 100).toFixed(2)),
        vibration: parseFloat((vibrationRisk * 100).toFixed(2)),
        efficiency: parseFloat((efficiencyRisk * 100).toFixed(2)),
        load: parseFloat((loadRisk * 100).toFixed(2))
      },
      recommendations: this._getTransformerRecommendations(severity, transformerData)
    };
  }

  /**
   * Predicts transmission line failure risk
   * @param {Object} lineData - Line operational metrics
   * @returns {Object} Fault prediction result
   */
  predictLineFault(lineData) {
    const {
      currentLoad = 500,
      temperature = 35,
      insulationResistance = 1000,
      age = 15,
      weatherStress = 2,
      previousFaults = 0
    } = lineData;

    let riskScore = 0;

    // Overload risk
    const overloadRisk = (currentLoad / 1000) > 0.8 ? 0.8 : (currentLoad / 1000) * 0.5;
    riskScore += overloadRisk * 25;

    // Temperature stress
    const tempRisk = temperature > 50 ? 0.7 : temperature > 40 ? 0.5 : 0.2;
    riskScore += tempRisk * 20;

    // Insulation degradation
    const insulationRisk = insulationResistance < 500 ? 0.9 : insulationResistance < 750 ? 0.6 : 0.2;
    riskScore += insulationRisk * 20;

    // Age and maintenance
    const ageRisk = age > 30 ? 0.8 : age > 20 ? 0.5 : 0.2;
    riskScore += ageRisk * 20;

    // Environmental factors (weather, humidity, etc)
    const weatherRisk = weatherStress > 3 ? 0.7 : weatherStress > 2 ? 0.4 : 0.1;
    riskScore += weatherRisk * 10;

    // Historical fault factor
    const historyRisk = Math.min(1, previousFaults * 0.1);
    riskScore += historyRisk * 5;

    riskScore = Math.min(100, riskScore);

    let severity = 'low';
    let confidence = 75;

    if (riskScore > 70) {
      severity = 'critical';
      confidence = 92;
    } else if (riskScore > 50) {
      severity = 'high';
      confidence = 85;
    } else if (riskScore > 30) {
      severity = 'medium';
      confidence = 78;
    }

    return {
      predicted: riskScore > 45,
      riskScore: parseFloat(riskScore.toFixed(2)),
      severity,
      confidence,
      probabilityOfFailure: parseFloat(((riskScore / 100) * 100).toFixed(1)),
      recommendations: this._getLineRecommendations(severity)
    };
  }

  /**
   * Generates predictive maintenance schedule
   * @param {Array<Object>} assets - Array of transformer/line data
   * @returns {Array<Object>} Maintenance schedule
   */
  generateMaintenanceSchedule(assets) {
    const schedule = [];

    assets.forEach((asset, index) => {
      const prediction = asset.type === 'transformer'
        ? this.predictTransformerFault(asset.data)
        : this.predictLineFault(asset.data);

      if (prediction && prediction.predicted) {
        schedule.push({
          assetId: asset.id,
          assetName: asset.name,
          assetType: asset.type,
          priority: prediction.severity === 'critical' ? 1 : prediction.severity === 'high' ? 2 : 3,
          riskScore: prediction.riskScore,
          estimatedDate: this._estimateMaintenanceDate(prediction.timeToFailureEstimate),
          estimatedDuration: this._estimateMaintenanceDuration(asset.type, prediction.severity),
          actionItems: prediction.recommendations
        });
      }
    });

    return schedule.sort((a, b) => a.priority - b.priority);
  }

  // Private helper methods

  _estimateTimeToFailure(riskScore) {
    // Higher risk score = shorter time to failure
    if (riskScore > 80) return Math.random() * 7 + 2; // 2-9 days
    if (riskScore > 60) return Math.random() * 20 + 10; // 10-30 days
    if (riskScore > 40) return Math.random() * 60 + 30; // 30-90 days
    return 365; // > 1 year
  }

  _estimateMaintenanceDate(daysUntilFailure) {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(daysUntilFailure * 0.7)); // Schedule 70% before failure
    return date.toISOString().split('T')[0];
  }

  _estimateMaintenanceDuration(assetType, severity) {
    if (assetType === 'transformer') {
      return severity === 'critical' ? '8-12 hours' : severity === 'high' ? '4-6 hours' : '2-3 hours';
    } else {
      return severity === 'critical' ? '6-10 hours' : severity === 'high' ? '3-5 hours' : '1-2 hours';
    }
  }

  _getTransformerRecommendations(severity, data) {
    const recommendations = [];

    if (severity === 'critical') {
      recommendations.push('URGENT: Schedule immediate maintenance');
      recommendations.push('Monitor continuously - consider load shedding');
      recommendations.push('Have replacement unit on standby');
    } else if (severity === 'high') {
      recommendations.push('Schedule maintenance within 1-2 weeks');
      recommendations.push('Increase monitoring frequency');
      if (data.temperature > 70) recommendations.push('Improve cooling system');
    } else {
      recommendations.push('Plan routine maintenance');
      if (data.efficiency < 0.90) recommendations.push('Optimize operational parameters');
    }

    if (data.lastMaintenance > 365) {
      recommendations.push('Oil analysis and sampling recommended');
    }

    return recommendations;
  }

  _getLineRecommendations(severity) {
    if (severity === 'critical') {
      return ['Immediate inspection required', 'Increase patrol frequency', 'Prepare emergency procedures'];
    } else if (severity === 'high') {
      return ['Schedule inspection within 2 weeks', 'Monitor environmental conditions', 'Check insulation resistance'];
    }
    return ['Routine monitoring', 'Plan regular maintenance'];
  }
}

const faultPredictionService = new FaultPredictionService();
export default faultPredictionService;
