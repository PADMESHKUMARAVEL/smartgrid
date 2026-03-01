import React, { useState, useEffect } from 'react';
import { Zap, TrendingDown, AlertTriangle, AlertCircle } from 'lucide-react';

const StatsCards = ({ gridStatus, optimizationResult }) => {
  const [animatingStats, setAnimatingStats] = useState(new Set());

  // Highlight stat changes
  useEffect(() => {
    if (gridStatus || optimizationResult) {
      setAnimatingStats(new Set(['all']));
      const timeout = setTimeout(() => {
        setAnimatingStats(new Set());
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [gridStatus, optimizationResult]);

  const stats = [
    {
      title: 'Current Load',
      value: gridStatus ? `${gridStatus.totalLoad.toFixed(1)} MW` : '—',
      change: '🔄 Live',
      status: 'normal',
      icon: Zap,
      color: 'blue'
    },
    {
      title: 'Transmission Loss',
      value: optimizationResult ? `${optimizationResult.loss_percent.toFixed(3)}%` : (gridStatus ? `${gridStatus.transmissionLossPercentage.toFixed(3)}%` : '—'),
      change: optimizationResult ? '✓ Optimized' : '—',
      status: optimizationResult ? 'optimized' : 'normal',
      icon: TrendingDown,
      color: 'green'
    },
    {
      title: 'Active Alerts',
      value: gridStatus ? gridStatus.activeAlertCount : '0',
      change: gridStatus && gridStatus.activeAlertCount > 0 ? `⚠️ ${gridStatus.activeAlertCount} active` : '✓ Clear',
      status: gridStatus && gridStatus.activeAlertCount > 0 ? 'warning' : 'good',
      icon: AlertTriangle,
      color: gridStatus && gridStatus.activeAlertCount > 0 ? 'red' : 'green'
    },
    {
      title: 'Network Risk',
      value: optimizationResult ? optimizationResult.avg_risk.toFixed(3) : (gridStatus ? gridStatus.riskScore.toFixed(3) : '—'),
      change: optimizationResult ? '🎯 Managed' : '—',
      status: optimizationResult ? 'controlled' : 'normal',
      icon: AlertCircle,
      color: parseFloat(optimizationResult?.avg_risk ?? gridStatus?.riskScore ?? 0.5) > 0.6 ? 'red' : 'purple'
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className={`bg-white rounded-xl p-6 shadow-sm border-l-4 transition-all duration-300 ${
            animatingStats.has('all') ? 'scale-105 shadow-lg' : 'scale-100'
          }`}
          style={{
            borderLeftColor: stat.color === 'blue' ? '#3B82F6' :
              stat.color === 'green' ? '#10B981' :
              stat.color === 'yellow' ? '#F59E0B' :
              stat.color === 'red' ? '#EF4444' :
              '#8B5CF6'
          }}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
              <p className="text-3xl font-bold mt-2 tabular-nums">{stat.value}</p>
              <p className={`text-sm mt-2 font-medium ${
                stat.status === 'optimized' || stat.status === 'controlled' || stat.status === 'good' ? 'text-green-600' :
                stat.status === 'warning' ? 'text-yellow-600' :
                stat.status === 'critical' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {stat.change}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${
              stat.color === 'blue' ? 'bg-blue-100' :
              stat.color === 'green' ? 'bg-green-100' :
              stat.color === 'yellow' ? 'bg-yellow-100' :
              stat.color === 'red' ? 'bg-red-100' :
              'bg-purple-100'
            }`}>
              <stat.icon className={`w-6 h-6 ${
                stat.color === 'blue' ? 'text-blue-600' :
                stat.color === 'green' ? 'text-green-600' :
                stat.color === 'yellow' ? 'text-yellow-600' :
                stat.color === 'red' ? 'text-red-600' :
                'text-purple-600'
              }`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
