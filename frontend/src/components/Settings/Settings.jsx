import React, { useState, useEffect } from 'react';
import backendApiService from '../../services/backendApiService';

const Settings = () => {
  const [settings, setSettings] = useState({
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    refreshInterval: 3,
    alertThresholds: {
      highRisk: 0.6,
      highTemp: 60,
      highCurrent: 450,
      highLoss: 0.5,
      highLoad: 350,
    },
    optimization: {
      riskWeight: 10.0,
      enableAutoOptimization: true,
      optimizationInterval: 3,
    },
  });

  const [backendStatus, setBackendStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('smartgridSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      setStatusLoading(true);
      const health = await backendApiService.getHealth();
      setBackendStatus(health);
    } catch (err) {
      setBackendStatus({ error: err.message });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSettingChange = (section, key, value) => {
    if (section === 'root') {
      setSettings(prev => ({ ...prev, [key]: value }));
    } else {
      setSettings(prev => ({
        ...prev,
        [section]: { ...prev[section], [key]: parseFloat(value) || value }
      }));
    }
    setSaved(false);
  };

  const saveSettings = () => {
    localStorage.setItem('smartgridSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      const defaults = {
        apiUrl: 'http://localhost:5000/api',
        refreshInterval: 3,
        alertThresholds: {
          highRisk: 0.6,
          highTemp: 60,
          highCurrent: 450,
          highLoss: 0.5,
          highLoad: 350,
        },
        optimization: {
          riskWeight: 10.0,
          enableAutoOptimization: true,
          optimizationInterval: 3,
        },
      };
      setSettings(defaults);
      localStorage.removeItem('smartgridSettings');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-900">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold">Settings & Configuration</h1>
        <p className="text-gray-600 mt-2">Manage application preferences and backend configuration</p>
      </div>

      {saved && (
        <div className="mb-6 p-4 bg-green-900 border border-green-500 rounded">
          <p className="text-green-200">✅ Settings saved successfully</p>
        </div>
      )}

      {/* Backend Status Card */}
      <div className="mb-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">Backend Status</h2>
          <button
            onClick={checkBackendStatus}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          >
            {statusLoading ? '🔄 Checking...' : '🔍 Check Status'}
          </button>
        </div>

        {backendStatus ? (
          <div className="space-y-2 text-sm">
            {backendStatus.error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700">
                  ❌ Backend unreachable: {backendStatus.error}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="text-green-400 font-semibold">
                    ✅ {backendStatus.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data Generation</span>
                  <span className="text-yellow-400">
                    🔄 {backendStatus.data_generation}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Grid State</span>
                  <span className="text-blue-400">
                    ⚡ {backendStatus.grid_state}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600">Click "Check Status" to verify backend connection</p>
        )}
      </div>

      {/* API Configuration */}
      <div className="mb-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold mb-4">API Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-600 text-sm mb-2">Backend API URL</label>
            <input
              type="text"
              value={settings.apiUrl}
              onChange={(e) => handleSettingChange('root', 'apiUrl', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded p-3 text-gray-900 focus:border-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Default: http://localhost:5000/api</p>
          </div>

          <div>
            <label className="block text-gray-600 text-sm mb-2">Data Refresh Interval (seconds)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={settings.refreshInterval}
              onChange={(e) => handleSettingChange('root', 'refreshInterval', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded p-3 text-gray-900 focus:border-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">How often to fetch data from backend</p>
          </div>
        </div>
      </div>

      {/* Alert Thresholds */}
      <div className="mb-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Alert Thresholds</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-600 text-sm mb-2">High Risk Level</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={settings.alertThresholds.highRisk}
                onChange={(e) => handleSettingChange('alertThresholds', 'highRisk', e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded p-2 text-gray-900 focus:border-blue-500 outline-none"
              />
              <span className="text-gray-600">({settings.alertThresholds.highRisk.toFixed(1)})</span>
            </div>
          </div>

          <div>
            <label className="block text-gray-600 text-sm mb-2">High Temperature (°C)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="40"
                max="100"
                value={settings.alertThresholds.highTemp}
                onChange={(e) => handleSettingChange('alertThresholds', 'highTemp', e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded p-2 text-gray-900 focus:border-blue-500 outline-none"
              />
              <span className="text-gray-600">°C</span>
            </div>
          </div>

          <div>
            <label className="block text-gray-600 text-sm mb-2">Over-Current (A)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="300"
                max="600"
                value={settings.alertThresholds.highCurrent}
                onChange={(e) => handleSettingChange('alertThresholds', 'highCurrent', e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded p-2 text-gray-900 focus:border-blue-500 outline-none"
              />
              <span className="text-gray-600">A</span>
            </div>
          </div>

          <div>
            <label className="block text-gray-600 text-sm mb-2">High Transmission Loss (%)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={settings.alertThresholds.highLoss}
                onChange={(e) => handleSettingChange('alertThresholds', 'highLoss', e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded p-2 text-gray-900 focus:border-blue-500 outline-none"
              />
              <span className="text-gray-600">%</span>
            </div>
          </div>

          <div>
            <label className="block text-gray-600 text-sm mb-2">High Network Load (MW)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="200"
                max="400"
                value={settings.alertThresholds.highLoad}
                onChange={(e) => handleSettingChange('alertThresholds', 'highLoad', e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded p-2 text-gray-900 focus:border-blue-500 outline-none"
              />
              <span className="text-gray-600">MW</span>
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Settings */}
      <div className="mb-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Optimization Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-600 text-sm mb-2">ML Risk Weight</label>
            <input
              type="number"
              min="1"
              max="50"
              step="0.1"
              value={settings.optimization.riskWeight}
              onChange={(e) => handleSettingChange('optimization', 'riskWeight', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded p-3 text-gray-900 focus:border-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Higher values = More sensitive to ML-predicted failures
            </p>
          </div>

          <div>
            <label className="block text-gray-600 text-sm mb-2">Optimization Interval (seconds)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={settings.optimization.optimizationInterval}
              onChange={(e) => handleSettingChange('optimization', 'optimizationInterval', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded p-3 text-gray-900 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.optimization.enableAutoOptimization}
                onChange={(e) => handleSettingChange('optimization', 'enableAutoOptimization', e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-gray-600">Enable Automatic Optimization</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Automatically run optimization cycles based on interval
            </p>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="mb-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold mb-4">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Frontend Version</span>
            <span className="text-gray-600">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">React Version</span>
            <span className="text-gray-600">{React.version}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Backend API</span>
            <span className="text-gray-600">
              {backendStatus?.status ? 'Connected ✅' : 'Disconnected ❌'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Last Updated</span>
            <span className="text-gray-600">
              {new Date().toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={saveSettings}
          className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 rounded font-semibold"
        >
          💾 Save Settings
        </button>
        <button
          onClick={resetToDefaults}
          className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 rounded font-semibold"
        >
          🔄 Reset to Defaults
        </button>
      </div>

      {/* Documentation */}
      <div className="mt-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold mb-4">ℹ️ Configuration Guide</h2>
        <div className="text-sm text-gray-600 space-y-3">
          <p>
            <strong>API URL:</strong> The base URL of your Smart Grid backend. Must include /api at the end.
          </p>
          <p>
            <strong>Refresh Interval:</strong> How often the dashboard fetches new data. Lower values = more real-time but higher network usage.
          </p>
          <p>
            <strong>Risk Weight:</strong> Controls how much the ML-based risk predictions influence path selection. Higher values reduce risk.
          </p>
          <p>
            <strong>Alert Thresholds:</strong> Customize when alerts are triggered based on grid conditions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;

