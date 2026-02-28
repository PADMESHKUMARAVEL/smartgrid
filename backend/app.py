import json
import sys
import threading
import time
from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as np
import networkx as nx
from datagenerate import grid_generator
from gridoptimization import SmartGridOptimizer

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize grid optimizer
optimizer = SmartGridOptimizer(num_nodes=8, num_generators=2)
optimizer.setup_named_nodes()

# Global state
current_grid_state = None
current_optimization_result = None
is_generating = True
lock = threading.Lock()


# ==============================
# BACKGROUND DATA GENERATION THREAD
# ==============================

def background_data_generation():
    """Continuously generate SCADA data in background"""
    global current_grid_state, current_optimization_result, is_generating
    
    print("🔴 Starting continuous grid data generation...")
    
    while is_generating:
        try:
            with lock:
                # Generate new SCADA data
                grid_generator.generate_scada_data()
                
                # Get current grid state
                current_grid_state = grid_generator.get_grid_state()
                
                # Run optimization on current state
                result = optimizer.train_episode()
                
                # Convert paths to serializable format
                serializable_result = {
                    'loss_percent': float(result['loss_percent']),
                    'reward': float(result['reward']),
                    'avg_risk': float(result['avg_risk']),
                    'total_demand': float(result['total_demand']),
                    'paths': [
                        {
                            'load_node': path['load_node'],
                            'load_name': path['load_name'],
                            'generator_node': path['generator_node'],
                            'generator_name': path['generator_name'],
                            'path': path['path'],
                            'demand': float(path['demand']),
                            'loss': float(path['loss'])
                        }
                        for path in result['paths']
                    ],
                    'timestamp': time.time()
                }
                
                current_optimization_result = serializable_result
                
                # Print status every 10 iterations
                if current_grid_state['iteration'] % 10 == 0:
                    print(f"\n✅ Iteration {current_grid_state['iteration']}: "
                          f"Demand={current_grid_state['metrics']['total_demand']} MW, "
                          f"Loss={serializable_result['loss_percent']:.2f}%, "
                          f"Risk={serializable_result['avg_risk']:.3f}")
            
            # Update every 3 seconds (matches UI refresh)
            time.sleep(3)
            
        except Exception as e:
            print(f"❌ Error in data generation: {e}")
            import traceback
            traceback.print_exc()
            time.sleep(3)




# ==============================
# API ENDPOINTS
# ==============================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': time.time(),
        'data_generation': 'active' if is_generating else 'inactive',
        'grid_state': 'initialized' if current_grid_state else 'initializing'
    }), 200


@app.route('/api/grid/state', methods=['GET'])
def get_grid_state():
    """Get current grid state with node and edge data from live generation"""
    with lock:
        if current_grid_state is None:
            return jsonify({
                'error': 'Grid initializing...',
                'status': 'pending'
            }), 202
        
        return jsonify({
            'iteration': current_grid_state['iteration'],
            'timestamp': time.time(),
            'nodes': current_grid_state['nodes'],
            'edges': current_grid_state['edges'],
            'metrics': current_grid_state['metrics'],
            'optimization': current_optimization_result
        }), 200


@app.route('/api/grid/optimize', methods=['POST'])
def optimize_grid():
    """Trigger immediate optimization (normally happens automatically)"""
    with lock:
        if current_grid_state is None:
            return jsonify({'error': 'Grid not initialized yet'}), 202
        
        result = optimizer.train_episode()
        
        serializable_result = {
            'loss_percent': float(result['loss_percent']),
            'reward': float(result['reward']),
            'avg_risk': float(result['avg_risk']),
            'total_demand': float(result['total_demand']),
            'paths': [
                {
                    'load_node': path['load_node'],
                    'load_name': path['load_name'],
                    'generator_node': path['generator_node'],
                    'generator_name': path['generator_name'],
                    'path': path['path'],
                    'demand': float(path['demand']),
                    'loss': float(path['loss'])
                }
                for path in result['paths']
            ]
        }
        
        return jsonify({
            'success': True,
            'episode_result': serializable_result,
            'timestamp': time.time()
        }), 200


@app.route('/api/grid/paths', methods=['GET'])
def get_optimized_paths():
    """Get current optimized paths from latest optimization"""
    with lock:
        if current_optimization_result is None:
            return jsonify({'error': 'No optimization results available yet'}), 202
        
        return jsonify({
            'paths': current_optimization_result['paths'],
            'loss_percent': current_optimization_result['loss_percent'],
            'avg_risk': current_optimization_result['avg_risk'],
            'total_demand': current_optimization_result['total_demand'],
            'timestamp': current_optimization_result.get('timestamp', time.time())
        }), 200


@app.route('/api/grid/risk', methods=['GET'])
def get_risk_analysis():
    """Get risk analysis for all assets from current state"""
    with lock:
        if current_grid_state is None:
            return jsonify({'error': 'Grid not initialized'}), 202
        
        edges = current_grid_state['edges']
        
        # Aggregate risk by node
        node_risks = {}
        for edge in edges:
            src = edge['source']
            tgt = edge['target']
            risk = edge['risk']
            
            if src not in node_risks:
                node_risks[src] = []
            if tgt not in node_risks:
                node_risks[tgt] = []
            
            node_risks[src].append(risk)
            node_risks[tgt].append(risk)
        
        nodes_risk = []
        for node_data in current_grid_state['nodes']:
            node_id = node_data['id']
            neighbor_risks = node_risks.get(node_id, [])
            
            nodes_risk.append({
                'id': node_id,
                'name': node_data['name'],
                'type': node_data['type'],
                'average_neighbor_risk': float(np.mean(neighbor_risks)) if neighbor_risks else 0,
                'max_neighbor_risk': float(max(neighbor_risks)) if neighbor_risks else 0,
                'neighbors': node_data['degree']
            })
        
        edges_risk = [
            {
                'source': e['source'],
                'target': e['target'],
                'source_name': e['source_name'],
                'target_name': e['target_name'],
                'risk': e['risk'],
                'temperature': e['temperature'],
                'current': e['current']
            }
            for e in edges
        ]
        
        return jsonify({
            'nodes': sorted(nodes_risk, key=lambda x: x['average_neighbor_risk'], reverse=True),
            'edges': sorted(edges_risk, key=lambda x: x['risk'], reverse=True),
            'timestamp': time.time()
        }), 200


@app.route('/api/grid/loss', methods=['GET'])
def get_loss_metrics():
    """Get transmission loss metrics history"""
    with lock:
        return jsonify({
            'history': [float(loss) for loss in optimizer.loss_history],
            'risk_history': [float(risk) for risk in optimizer.risk_history],
            'current_loss_percent': float(optimizer.loss_history[-1]) if optimizer.loss_history else 0,
            'current_avg_risk': float(optimizer.risk_history[-1]) if optimizer.risk_history else 0,
            'best_loss': float(min(optimizer.loss_history)) if optimizer.loss_history else 0,
            'worst_loss': float(max(optimizer.loss_history)) if optimizer.loss_history else 0,
            'timestamp': time.time()
        }), 200


@app.route('/api/grid/node/<int:node_id>', methods=['GET'])
def get_node_details(node_id):
    """Get detailed information about a specific node from current state"""
    with lock:
        if current_grid_state is None:
            return jsonify({'error': 'Grid not initialized'}), 202
        
        # Find node
        node_data = None
        for n in current_grid_state['nodes']:
            if n['id'] == node_id:
                node_data = n
                break
        
        if node_data is None:
            return jsonify({'error': 'Node not found'}), 404
        
        # Find edges connected to this node
        neighbor_details = []
        for edge in current_grid_state['edges']:
            if edge['source'] == node_id:
                neighbor_details.append({
                    'node_id': edge['target'],
                    'name': edge['target_name'],
                    'resistance': edge['resistance'],
                    'current': edge['current'],
                    'temperature': edge['temperature'],
                    'risk': edge['risk'],
                    'power_flow': edge['power_flow']
                })
            elif edge['target'] == node_id:
                neighbor_details.append({
                    'node_id': edge['source'],
                    'name': edge['source_name'],
                    'resistance': edge['resistance'],
                    'current': edge['current'],
                    'temperature': edge['temperature'],
                    'risk': edge['risk'],
                    'power_flow': edge['power_flow']
                })
        
        return jsonify({
            'id': node_id,
            'name': node_data['name'],
            'type': node_data['type'],
            'demand': node_data['demand'],
            'voltage': node_data['voltage'],
            'neighbors': node_data['degree'],
            'neighbor_details': neighbor_details,
            'timestamp': time.time()
        }), 200


@app.route('/api/grid/statistics', methods=['GET'])
def get_grid_statistics():
    """Get comprehensive grid statistics from current state"""
    with lock:
        if current_grid_state is None:
            return jsonify({'error': 'Grid not initialized'}), 202
        
        nodes = current_grid_state['nodes']
        edges = current_grid_state['edges']
        
        voltages = [n['voltage'] for n in nodes]
        demands = [n['demand'] for n in nodes]
        risks = [e['risk'] for e in edges]
        temperatures = [e['temperature'] for e in edges]
        currents = [e['current'] for e in edges]
        power_flows = [e['power_flow'] for e in edges]
        
        stats = {
            'voltage': {
                'mean': float(np.mean(voltages)) if voltages else 0,
                'std': float(np.std(voltages)) if voltages else 0,
                'min': float(min(voltages)) if voltages else 0,
                'max': float(max(voltages)) if voltages else 0
            },
            'demand': {
                'total': float(current_grid_state['metrics']['total_demand']),
                'mean': float(np.mean(demands)) if demands else 0,
                'max': float(max(demands)) if demands else 0,
                'min': float(min(demands)) if demands else 0
            },
            'risk': {
                'mean': float(np.mean(risks)) if risks else 0,
                'max': float(max(risks)) if risks else 0,
                'min': float(min(risks)) if risks else 0,
                'high_risk_edges': sum(1 for r in risks if r > 0.5)
            },
            'temperature': {
                'mean': float(np.mean(temperatures)) if temperatures else 0,
                'max': float(max(temperatures)) if temperatures else 0,
                'min': float(min(temperatures)) if temperatures else 0
            },
            'power_flow': {
                'total': float(sum(power_flows)) if power_flows else 0,
                'mean': float(np.mean(power_flows)) if power_flows else 0,
                'max': float(max(power_flows)) if power_flows else 0
            },
            'current': {
                'mean': float(np.mean(currents)) if currents else 0,
                'max': float(max(currents)) if currents else 0,
                'min': float(min(currents)) if currents else 0
            },
            'generation': {
                'iteration': current_grid_state['iteration'],
                'nodes': current_grid_state['metrics']['total_nodes'],
                'edges': current_grid_state['metrics']['total_edges']
            },
            'timestamp': time.time()
        }
        
        return jsonify(stats), 200


@app.route('/api/grid/data-source', methods=['GET'])
def get_data_source_status():
    """Get information about current data source"""
    with lock:
        return jsonify({
            'source': 'Dynamic Generation (datagenerate.py)',
            'is_active': is_generating,
            'generation_interval': '3 seconds',
            'current_iteration': current_grid_state['iteration'] if current_grid_state else 0,
            'optimization_interval': '3 seconds',
            'total_episodes_trained': len(optimizer.loss_history),
            'timestamp': time.time()
        }), 200


# ==============================
# APPLICATION STARTUP
# ==============================

if __name__ == '__main__':
    print("\n" + "="*60)
    print("  🔌 SMART GRID OPTIMIZATION BACKEND")
    print("="*60)
    print("\n📊 Initializing components...")
    print("   ✓ Flask API configured")
    print("   ✓ Grid optimizer initialized")
    print("   ✓ CORS enabled")
    
    # Start background data generation thread
    print("\n🚀 Starting background processes...")
    gen_thread = threading.Thread(target=background_data_generation, daemon=True)
    gen_thread.start()
    print("   ✓ Data generation thread started")
    print("   ✓ Continuous SCADA simulation active")
    
    print("\n" + "="*60)
    print("  ✅ Backend Ready!")
    print("="*60)
    print("\n📡 API Server: http://localhost:5000")
    print("🔗 Available Endpoints:")
    print("   • GET  /api/health - Health check")
    print("   • GET  /api/grid/state - Current grid state")
    print("   • POST /api/grid/optimize - Manual optimization trigger")
    print("   • GET  /api/grid/paths - Optimized paths")
    print("   • GET  /api/grid/loss - Loss metrics")
    print("   • GET  /api/grid/risk - Risk analysis")
    print("   • GET  /api/grid/statistics - Grid statistics")
    print("   • GET  /api/grid/node/<id> - Node details")
    print("   • GET  /api/grid/data-source - Data source status")
    print("\n")
    
    # Run Flask server
    app.run(debug=False, host='0.0.0.0', port=5000, use_reloader=False)
