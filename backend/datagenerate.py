import networkx as nx
import random
import time
import math

# ==============================
# 1️⃣ CREATE NAMED GRID WITH SUBSTATIONS & GENERATORS
# ==============================

# Define generators with fixed base power
GENERATORS = {
    0: {"name": "North Power Plant", "base_power": 150, "type": "generator"},
    1: {"name": "South Thermal Station", "base_power": 140, "type": "generator"}
}

# Define substations with fixed constant demands
SUBSTATIONS = {
    2: {"name": "Downtown Substation", "constant_demand": 45, "type": "substation"},
    3: {"name": "Uptown Substation", "constant_demand": 52, "type": "substation"},
    4: {"name": "Industrial Zone Station", "constant_demand": 75, "type": "substation"},
    5: {"name": "Residential Hub", "constant_demand": 38, "type": "substation"},
    6: {"name": "Shopping Complex Node", "constant_demand": 41, "type": "substation"},
    7: {"name": "University Campus Hub", "constant_demand": 48, "type": "substation"}
}

NUM_NODES = 8


class GridDataGenerator:
    """Generates real-time SCADA data for smart grid"""
    
    def __init__(self):
        self.grid = self._create_grid()
        self.iteration = 0
        
    def _create_grid(self):
        """Create connected grid topology"""
        G = nx.erdos_renyi_graph(NUM_NODES, 0.5)
        
        while not nx.is_connected(G):
            G = nx.erdos_renyi_graph(NUM_NODES, 0.5)
        
        # Assign node metadata
        for n in G.nodes:
            if n in GENERATORS:
                G.nodes[n]["name"] = GENERATORS[n]["name"]
                G.nodes[n]["type"] = "generator"
                G.nodes[n]["power"] = GENERATORS[n]["base_power"]
            else:
                G.nodes[n]["name"] = SUBSTATIONS[n]["name"]
                G.nodes[n]["type"] = "substation"
                G.nodes[n]["demand"] = SUBSTATIONS[n]["constant_demand"]
        
        return G
    
    def generate_scada_data(self):
        """Generate real-time SCADA data for current iteration"""
        self.iteration += 1
        
        # Update node data
        for node in self.grid.nodes:
            # Voltage fluctuation (220kV ±5%)
            voltage = random.uniform(210, 230)
            self.grid.nodes[node]["voltage"] = voltage
            
            if self.grid.nodes[node]["type"] == "substation":
                # Constant demand for each substation with small random variation
                base_demand = self.grid.nodes[node]["demand"]
                variation = random.uniform(-2, 2)  # ±2 MW variation
                actual_demand = max(base_demand + variation, base_demand * 0.8)
                self.grid.nodes[node]["current_demand"] = round(actual_demand, 2)
            else:
                # Generators
                self.grid.nodes[node]["current_demand"] = 0
        
        # Update edge data
        for u, v in self.grid.edges:
            # Base resistance
            resistance = random.uniform(0.001, 0.005)
            self.grid[u][v]["resistance"] = resistance
            
            # Approximate current (based on connected node demand)
            connected_demand = self.grid.nodes[u].get("current_demand", 0) + self.grid.nodes[v].get("current_demand", 0)
            current = random.uniform(100, 400) + connected_demand * 2
            self.grid[u][v]["current"] = round(current, 2)
            
            # Temperature rises with current
            temperature = 25 + (current / 400) * 40 + random.uniform(-2, 2)
            self.grid[u][v]["temperature"] = round(temperature, 2)
            
            # Risk derived from overload + temperature
            overload_factor = current / 500
            temp_factor = temperature / 100
            risk = min(1.0, 0.5 * overload_factor + 0.5 * temp_factor)
            self.grid[u][v]["risk"] = round(risk, 3)
            
            # Power Flow Approximation
            avg_voltage = (self.grid.nodes[u]["voltage"] + self.grid.nodes[v]["voltage"]) / 2
            power_flow = avg_voltage * current / 1000  # MW approx
            self.grid[u][v]["power_flow"] = round(power_flow, 2)
    
    def get_grid_state(self):
        """Get current grid state as dictionary"""
        nodes_data = []
        edges_data = []
        
        # Collect node data
        for node_id in self.grid.nodes:
            node_data = self.grid.nodes[node_id]
            nodes_data.append({
                'id': node_id,
                'name': node_data.get('name', f'Node {node_id}'),
                'type': node_data.get('type', 'unknown'),
                'demand': node_data.get('current_demand', 0),
                'voltage': node_data.get('voltage', 0),
                'degree': self.grid.degree[node_id]
            })
        
        # Collect edge data
        for u, v in self.grid.edges:
            edge_data = self.grid[u][v]
            edges_data.append({
                'source': u,
                'source_name': self.grid.nodes[u].get('name', f'Node {u}'),
                'target': v,
                'target_name': self.grid.nodes[v].get('name', f'Node {v}'),
                'resistance': edge_data.get('resistance', 0),
                'current': edge_data.get('current', 0),
                'temperature': edge_data.get('temperature', 0),
                'power_flow': edge_data.get('power_flow', 0),
                'risk': edge_data.get('risk', 0)
            })
        
        # Calculate metrics
        total_demand = sum(n['demand'] for n in nodes_data if self.grid.nodes[n['id']]['type'] == 'substation')
        avg_risk = sum(e['risk'] for e in edges_data) / len(edges_data) if edges_data else 0
        
        return {
            'iteration': self.iteration,
            'nodes': nodes_data,
            'edges': edges_data,
            'metrics': {
                'total_demand': round(total_demand, 2),
                'total_nodes': len(nodes_data),
                'total_edges': len(edges_data),
                'average_risk': round(avg_risk, 3),
                'generators': len([n for n in nodes_data if self.grid.nodes[n['id']]['type'] == 'generator'])
            }
        }
    
    def print_state(self):
        """Print current grid state for debugging"""
        print("\n======================================")
        print(f"   SCADA TIME STEP {self.iteration}")
        print("======================================\n")
        
        # Print nodes
        for node in self.grid.nodes:
            node_data = self.grid.nodes[node]
            print(f"{node_data['name']} (Node {node})")
            print(f"  Type: {node_data['type']}")
            print(f"  Voltage: {round(node_data['voltage'], 2)} kV")
            if node_data['type'] == 'substation':
                print(f"  Demand: {node_data['current_demand']} MW\n")
            else:
                print(f"  Power: {node_data['power']} MW\n")
        
        # Print edges
        print("------ Transmission Line Data ------\n")
        for u, v in self.grid.edges:
            edge_data = self.grid[u][v]
            print(f"Line {u} <-> {v}")
            print(f"  Resistance: {round(edge_data['resistance'], 5)} Ω")
            print(f"  Current: {round(edge_data['current'], 2)} A")
            print(f"  Temperature: {round(edge_data['temperature'], 2)} °C")
            print(f"  Power Flow: {round(edge_data['power_flow'], 2)} MW")
            print(f"  Risk Score: {round(edge_data['risk'], 3)}\n")
        
        # Print metrics
        total_demand = sum(self.grid.nodes[n].get('current_demand', 0) 
                          for n in self.grid.nodes 
                          if self.grid.nodes[n]['type'] == 'substation')
        print(f"Total Grid Demand: {round(total_demand, 2)} MW")


# Create global generator instance
grid_generator = GridDataGenerator()


# ==============================
# 2️⃣ DEMO SIMULATION (Optional - for testing)
# ==============================

if __name__ == "__main__":
    print("\n🔴 LIVE SMART GRID DATA GENERATION STARTED\n")
    
    try:
        while True:
            # Generate new data
            grid_generator.generate_scada_data()
            
            # Print current state
            grid_generator.print_state()
            
            # Wait before next update
            time.sleep(3)
    except KeyboardInterrupt:
        print("\n\n✅ Grid data generation stopped")
