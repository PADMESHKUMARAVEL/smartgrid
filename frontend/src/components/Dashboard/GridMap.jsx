import React, { useState, useMemo } from 'react';
import { RefreshCw, MapPin } from 'lucide-react';

const GridMap = ({ gridState = null, optimizationResult = null }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  
  // Use backend data if available, otherwise use static data
  const gridNodes = useMemo(() => {
    if (gridState && gridState.nodes && gridState.nodes.length > 0) {
      return gridState.nodes.map((node, idx) => ({
        id: node.id,
        label: node.name,
        x: (idx % 3) * 30 + 15,
        y: Math.floor(idx / 3) * 35 + 20,
        load: node.demand,
        risk: node.demand > 50 ? 'High' : node.demand > 30 ? 'Moderate' : 'Low',
        color: node.type === 'generator' ? 'bg-green-500' : 'bg-blue-500',
        voltage: node.voltage,
        type: node.type,
        name: node.name
      }));
    }

    // Fallback static data with names
    return [
      { id: 0, label: 'North Power Plant', name: 'North Power Plant', x: 15, y: 20, load: 150, risk: 'Normal', color: 'bg-green-500', type: 'generator' },
      { id: 1, label: 'South Thermal Station', name: 'South Thermal Station', x: 45, y: 20, load: 140, risk: 'Normal', color: 'bg-green-500', type: 'generator' },
      { id: 2, label: 'Downtown Substation', name: 'Downtown Substation', x: 15, y: 55, load: 45, risk: 'Low', color: 'bg-blue-500', type: 'substation' },
      { id: 3, label: 'Uptown Substation', name: 'Uptown Substation', x: 45, y: 55, load: 52, risk: 'Low', color: 'bg-blue-500', type: 'substation' },
      { id: 4, label: 'Industrial Zone Station', name: 'Industrial Zone Station', x: 75, y: 55, load: 75, risk: 'Moderate', color: 'bg-orange-500', type: 'substation' },
      { id: 5, label: 'Residential Hub', name: 'Residential Hub', x: 15, y: 80, load: 38, risk: 'Low', color: 'bg-blue-500', type: 'substation' },
      { id: 6, label: 'Shopping Complex Node', name: 'Shopping Complex Node', x: 45, y: 80, load: 41, risk: 'Low', color: 'bg-blue-500', type: 'substation' },
      { id: 7, label: 'University Campus Hub', name: 'University Campus Hub', x: 75, y: 80, load: 48, risk: 'Low', color: 'bg-blue-500', type: 'substation' }
    ];
  }, [gridState]);

  // Generate SVG connections and optimized paths
  const generateConnections = () => {
    if (!gridState || !gridState.edges) return [];
    
    return gridState.edges.map((edge, idx) => {
      const sourceNode = gridNodes.find(n => n.id === edge.source);
      const targetNode = gridNodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return null;
      
      const opacity = 0.3 + (edge.current / 500) * 0.5;
      const strokeColor = edge.risk > 0.6 ? '#EF4444' : edge.temperature > 75 ? '#F59E0B' : '#3B82F6';
      
      return (
        <line
          key={`edge_${idx}`}
          x1={`${sourceNode.x}%`}
          y1={`${sourceNode.y}%`}
          x2={`${targetNode.x}%`}
          y2={`${targetNode.y}%`}
          stroke={strokeColor}
          strokeWidth="2"
          opacity={opacity}
        />
      );
    });
  };

  // Generate optimized paths visualization
  const generateOptimizedPaths = () => {
    if (!optimizationResult || !optimizationResult.paths) return [];
    
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
    return optimizationResult.paths.map((pathInfo, idx) => {
      const path = pathInfo.path;
      const pathPoints = [];
      
      for (let i = 0; i < path.length - 1; i++) {
        const sourceNode = gridNodes.find(n => n.id === path[i]);
        const targetNode = gridNodes.find(n => n.id === path[i + 1]);
        
        if (sourceNode && targetNode) {
          pathPoints.push(
            <line
              key={`path_${idx}_${i}`}
              x1={`${sourceNode.x}%`}
              y1={`${sourceNode.y}%`}
              x2={`${targetNode.x}%`}
              y2={`${targetNode.y}%`}
              stroke={colors[idx % colors.length]}
              strokeWidth="3"
              opacity="0.8"
              strokeDasharray="5,5"
            />
          );
        }
      }
      
      return pathPoints;
    }).flat();
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">Grid Network Status</h3>
          {optimizationResult && (
            <p className="text-xs text-blue-600 mt-1">
              ✓ Optimized paths active | {optimizationResult.paths.length} routes
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <MapPin className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="h-96 border rounded-lg bg-gray-50 relative overflow-hidden">
        {/* Grid background */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Connection lines and paths */}
        <svg className="absolute inset-0 w-full h-full">
          {/* Regular connections */}
          {generateConnections()}
          
          {/* Optimized paths (highlighted) */}
          {generateOptimizedPaths()}
        </svg>

        {/* Nodes */}
        <div className="absolute inset-0">
          {gridNodes.map((node) => (
            <div key={node.id} className="absolute" style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}>
              <button
                onClick={() => setSelectedNode(node)}
                className={`w-12 h-12 rounded-full ${node.color} text-white font-bold shadow-lg hover:shadow-xl transition hover:scale-110 cursor-pointer border-4 border-white`}
              >
                {node.id}
              </button>
              <p className="text-xs text-gray-700 mt-2 text-center whitespace-nowrap font-medium">{node.label}</p>
            </div>
          ))}
        </div>
      </div>
      
      {selectedNode && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-lg">{selectedNode.label}</h4>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <p className="text-sm text-gray-600">Current Load</p>
                  <p className="font-bold text-lg">{selectedNode.load} MW</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Voltage</p>
                  <p className="font-bold text-lg">{selectedNode.voltage?.toFixed(1) || '230'} kV</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Risk Level</p>
                  <p className={`font-bold text-lg ${
                    selectedNode.risk === 'High' ? 'text-red-600' :
                    selectedNode.risk === 'Moderate' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>{selectedNode.risk}</p>
                </div>
              </div>
            </div>
            <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GridMap;