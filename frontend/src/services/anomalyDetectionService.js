/**
 * Anomaly Detection Service
 * Identifies abnormal electricity consumption, voltage irregularities, and potential theft
 */

class AnomalyDetectionService {
  /**
   * Statistical anomaly detection using Z-score method
   * @param {Array<number>} values - Historical consumption values
   * @param {number} currentValue - Current meter reading
   * @param {number} threshold - Z-score threshold (default: 2.5)
   * @returns {Object} Anomaly score and detection result
   */
  detectConsumptionAnomaly(values, currentValue, threshold = 2.5) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
    );
    
    const zScore = Math.abs((currentValue - mean) / stdDev);
    const isAnomaly = zScore > threshold;
    
    return {
      detected: isAnomaly,
      zScore: parseFloat(zScore.toFixed(2)),
      confidence: Math.min(100, (zScore / threshold) * 100),
      type: 'consumption_anomaly',
      severity: zScore > 4 ? 'critical' : zScore > 3 ? 'high' : 'medium'
    };
  }

  /**
   * Detects voltage irregularities
   * @param {number} voltage - Current voltage reading
   * @param {number} normalVoltage - Expected normal voltage (default: 230V for residential)
   * @returns {Object} Voltage anomaly detection result
   */
  detectVoltageAnomaly(voltage, normalVoltage = 230) {
    const tolerance = normalVoltage * 0.1; // ±10% tolerance
    const maxVoltage = normalVoltage + tolerance;
    const minVoltage = normalVoltage - tolerance;
    
    let detected = false;
    let severity = 'none';
    let type = 'normal';
    
    if (voltage > maxVoltage) {
      detected = true;
      type = 'overvoltage';
      severity = voltage > normalVoltage * 1.2 ? 'critical' : 'warning';
    } else if (voltage < minVoltage) {
      detected = true;
      type = 'undervoltage';
      severity = voltage < normalVoltage * 0.8 ? 'critical' : 'warning';
    }
    
    const confidence = detected ? 95 : 0;
    
    return {
      detected,
      voltage,
      type,
      severity,
      confidence,
      deviation: parseFloat(((voltage - normalVoltage) / normalVoltage * 100).toFixed(2))
    };
  }

  /**
   * Detects potential electricity theft patterns
   * Analyzes harmonic distortion, sudden drops, and consumption gaps
   * @param {Object} meterData - Smart meter data
   * @returns {Object} Theft detection result
   */
  detectTheft(meterData) {
    const { activeEnergy, harmonicDistortion, currentValue, voltage } = meterData;
    let theftScore = 0;
    let indicators = [];

    // Check harmonic distortion (typical theft indicator)
    if (harmonicDistortion > 8) {
      theftScore += 30;
      indicators.push('High harmonic distortion detected');
    }

    // Check for consumption anomalies
    if (currentValue > 50) {
      theftScore -= 10;
    }

    // Check voltage quality
    if (Math.abs(voltage - 230) > 25) {
      theftScore += 15;
      indicators.push('Voltage irregularity detected');
    }

    // Sudden consumption drop
    if (meterData.previousValue && activeEnergy < meterData.previousValue * 0.3) {
      theftScore += 20;
      indicators.push('Sudden consumption drop');
    }

    return {
      detected: theftScore > 50,
      theftScore: Math.min(100, Math.max(0, theftScore)),
      confidence: Math.abs(theftScore) > 30 ? 85 : 40,
      indicators,
      severity: theftScore > 70 ? 'critical' : theftScore > 50 ? 'high' : 'medium'
    };
  }

  /**
   * Detects transformer or line overload conditions
   * @param {Object} lineData - Line/transformer operational data
   * @returns {Object} Overload detection result
   */
  detectOverload(lineData) {
    const { current, temperature, ratedCapacity=1000 } = lineData;
    const loadPercentage = (current / ratedCapacity) * 100;
    let severity = 'normal';

    if (loadPercentage > 100) {
      severity = 'critical';
    } else if (loadPercentage > 90) {
      severity = 'high';
    } else if (loadPercentage > 75) {
      severity = 'warning';
    }

    return {
      detected: loadPercentage > 75,
      loadPercentage: parseFloat(loadPercentage.toFixed(2)),
      temperature,
      severity,
      confidence: Math.min(100, loadPercentage),
      riskScore: Math.max(0, loadPercentage - 75)
    };
  }
}

const anomalyDetectionService = new AnomalyDetectionService();
export default anomalyDetectionService;
