import React, { useState, useEffect } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import loadForecastingService from '../../services/loadForecastingService';

const LoadForecastChart = () => {
  const [data, setData] = useState([]);
  const [peakInfo, setPeakInfo] = useState(null);

  useEffect(() => {
    // Generate historical load data
    const historicalData = [];
    const baseLoad = 2500;
    for (let i = 0; i < 24; i++) {
      const hour = (new Date().getHours() - 24 + i + 24) % 24;
      let hourlyLoad = baseLoad;
      
      if (hour >= 6 && hour < 12) hourlyLoad *= 1.2;
      else if (hour >= 12 && hour < 17) hourlyLoad *= 0.95;
      else if (hour >= 17 && hour < 22) hourlyLoad *= 1.35;
      else hourlyLoad *= 0.65;
      
      hourlyLoad += (Math.random() - 0.5) * 300;
      historicalData.push(Math.max(0, hourlyLoad));
    }

    // Get forecast
    const forecast = loadForecastingService.forecastLoad(historicalData, 12);
    const peak = loadForecastingService.predictPeakLoad(historicalData);
    
    setPeakInfo(peak);

    // Combine historical and forecast data
    const chartData = [];
    
    // Add current load
    chartData.push({
      hour: 'Now',
      actual: historicalData[historicalData.length - 1],
      forecast: historicalData[historicalData.length - 1],
      isHistorical: true
    });

    // Add forecasted loads
    if (forecast.success) {
      forecast.forecast.forEach(f => {
        chartData.push({
          hour: `+${f.hour}h`,
          forecast: f.value,
          lowerBound: f.lowerBound,
          upperBound: f.upperBound,
          confidence: f.confidence,
          isHistorical: false
        });
      });
    }

    setData(chartData);
  }, []);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          24-Hour Load Forecast
        </h3>
        <div className="flex gap-2">
          <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded">AI Model</button>
          <button className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">Options</button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="hour" 
            stroke="#9ca3af"
          />
          <YAxis 
            stroke="#9ca3af"
            label={{ value: 'Load (MW)', angle: -90, position: 'insideLeft', offset: 10 }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            formatter={(value) => value ? value.toFixed(0) + ' MW' : 'N/A'}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="lowerBound" 
            fill="#BFDBFE" 
            stroke="none"
            name="Confidence Interval"
          />
          <Area 
            type="monotone" 
            dataKey="upperBound" 
            fill="#BFDBFE" 
            stroke="none"
          />
          <Line 
            type="monotone" 
            dataKey="actual" 
            stroke="#3B82F6" 
            strokeWidth={3}
            dot={{ r: 4 }}
            name="Current Load"
          />
          <Line 
            type="monotone" 
            dataKey="forecast" 
            stroke="#10B981" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Predicted Load"
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600">Current Load</p>
          <p className="text-2xl font-bold text-blue-600">{data[0]?.actual ? Math.round(data[0].actual) : '—'} MW</p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-gray-600">Peak Predicted</p>
          <p className="text-2xl font-bold text-green-600">{peakInfo ? Math.round(peakInfo.predictedPeak) : '—'} MW</p>
          <p className="text-xs text-gray-600 mt-1">in {peakInfo?.timeToReach ? peakInfo.timeToReach + 'h' : '—'}</p>
        </div>
        <div className="p-3 bg-yellow-50 rounded-lg">
          <p className="text-xs text-gray-600">Increase</p>
          <p className="text-2xl font-bold text-yellow-600">{peakInfo?.increase ? peakInfo.increase.toFixed(1) : '—'}%</p>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg">
          <p className="text-xs text-gray-600">Average Forecast</p>
          <p className="text-2xl font-bold text-purple-600">{(data.slice(1).reduce((sum, d) => sum + (d.forecast || 0), 0) / Math.max(1, data.length - 1)).toFixed(0)} MW</p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800 font-medium">💡 Recommendation: Peak load detected in 3 hours. Consider load balancing measures.</p>
      </div>
    </div>
  );
};

export default LoadForecastChart;