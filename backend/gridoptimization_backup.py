import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.distributions import Categorical
import networkx as nx
import matplotlib.pyplot as plt
import numpy as np
import random
from predictive_maintenance import PredictiveMaintenanceModel

# Add this import at the top
from predictive_maintenance import PredictiveMaintenanceModel

# Modify your SmartGridOptimizer class:

class SmartGridOptimizer:
    def __init__(self, num_nodes=8, num_generators=2):
        self.num_nodes = num_nodes
        self.generators = list(range(num_generators))
        self.loads = list(range(num_generators, num_nodes))
        
        # Create grid
        self.create_grid()
        self.setup_named_nodes()
        
        # Policy network (Deep RL)
        self.policy = PolicyNetwork(input_dim=7, output_dim=len(self.generators))
        self.optimizer = optim.Adam(self.policy.parameters(), lr=0.01)
        
        # ===== NEW: Real Predictive Maintenance Model =====
        self.maintenance_model = PredictiveMaintenanceModel()
        
        # Try to load pre-trained model, or train new one
        if not self.maintenance_model.load_models():
            print("\n📊 Training new predictive maintenance model...")
            data = self.maintenance_model.generate_synthetic_training_data(n_samples=10000)
            self.maintenance_model.train(data)
            self.maintenance_model.save_models()
        
        # Store sensor history for each edge
        self.edge_sensor_history = {}
        
        # Training logs
        self.loss_history = []
        self.risk_history = []
        self.optimized_paths = []  # Store current optimized paths
    
    def update_edge_sensors(self, u, v):
        """
        Update sensor readings for an edge with realistic values
        """
        # Get current demand on connected nodes
        node_u_demand = self.G.nodes[u].get('demand', 50)
        node_v_demand = self.G.nodes[v].get('demand', 50)
        avg_load = (node_u_demand + node_v_demand) / 2
        
        # Age of the line (years)
        age = self.G[u][v].get('age', np.random.uniform(0, 20))
        
        # Generate realistic sensor readings
        sensors = {
            'temperature': 40 + avg_load * 0.5 + np.random.normal(0, 5),
            'load': avg_load,
            'vibration': 0.1 + avg_load * 0.01 + age * 0.02 + np.random.exponential(0.1),
            'age': age,
            'corrosion': age * 0.02 + np.random.beta(2, 5),
            'harmonics': 2 + avg_load * 0.05 + np.random.exponential(1),
            'oil_quality': max(0, 0.9 - age * 0.02 - avg_load * 0.002 + np.random.normal(0, 0.1)),
            'trip_count': int(age * 2 + avg_load * 0.1 + np.random.poisson(5)),
            'ambient_temp': 20 + np.random.normal(0, 10),
            'humidity': 50 + np.random.normal(0, 20)
        }
        
        # Store in edge attributes
        for key, value in sensors.items():
            self.G[u][v][key] = value
        
        # Store in history
        edge_key = f"{u}-{v}"
        if edge_key not in self.edge_sensor_history:
            self.edge_sensor_history[edge_key] = []
        
        self.edge_sensor_history[edge_key].append({
            'timestamp': time.time(),
            **sensors
        })
        
        # Keep last 100 readings
        if len(self.edge_sensor_history[edge_key]) > 100:
            self.edge_sensor_history[edge_key].pop(0)
    
    def calculate_risk_from_features(self, u, v):
        """
        Use REAL ML models for risk prediction
        """
        # Update sensor readings
        self.update_edge_sensors(u, v)
        
        # Get current sensor readings
        sensors = {
            'temperature': self.G[u][v].get('temperature', 50),
            'load': self.G[u][v].get('load', 50),
            'vibration': self.G[u][v].get('vibration', 0.2),
            'age': self.G[u][v].get('age', 10),
            'corrosion': self.G[u][v].get('corrosion', 0.1),
            'harmonics': self.G[u][v].get('harmonics', 2),
            'oil_quality': self.G[u][v].get('oil_quality', 0.8),
            'trip_count': self.G[u][v].get('trip_count', 10),
            'ambient_temp': self.G[u][v].get('ambient_temp', 25),
            'humidity': self.G[u][v].get('humidity', 50)
        }
        
        # Get prediction from maintenance model
        try:
            risk_assessment = self.maintenance_model.predict_risk(sensors)
            
            # Store full assessment in edge attributes
            self.G[u][v]['risk_details'] = risk_assessment
            self.G[u][v]['risk_level'] = risk_assessment['risk_level']
            self.G[u][v]['failure_probability'] = risk_assessment['failure_probability']
            self.G[u][v]['failure_type'] = risk_assessment['failure_type']
            
            # Return probability for optimization
            return risk_assessment['failure_probability']
            
        except Exception as e:
            print(f"⚠️ Risk prediction error: {e}")
            # Fallback to simple calculation
            return 0.1  # Default low risk
# ===============================
# POLICY NETWORK FOR RL
# ===============================

class PolicyNetwork(nn.Module):
    """Deep Neural Network for policy"""
    def __init__(self, input_dim, output_dim):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 128),
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, output_dim)
        )
    
    def forward(self, x):
        return self.net(x)


# ===============================
# SMART GRID OPTIMIZER WITH ML PREDICTIVE MAINTENANCE
# ===============================

class SmartGridOptimizer:
    def __init__(self, num_nodes=8, num_generators=2):
        """Initialize Smart Grid Optimizer with ML-based predictive maintenance"""
        self.num_nodes = num_nodes
        self.num_generators = num_generators
        
        # Initialize network graph
        self.G = nx.Graph()
        self.G.add_nodes_from(range(num_nodes))
        
        # Create connected graph with realistic topology
        for i in range(num_nodes):
            for j in range(i+1, num_nodes):
                if np.random.random() > 0.4:
                    self.G.add_edge(i, j, resistance=np.random.uniform(0.001, 0.005))
        
        # Ensure connectivity
        if not nx.is_connected(self.G):
            components = list(nx.connected_components(self.G))
            for i in range(len(components)-1):
                u = list(components[i])[0]
                v = list(components[i+1])[0]
                self.G.add_edge(u, v, resistance=np.random.uniform(0.001, 0.005))
        
        # Initialize node features with maintenance-relevant data
        for node in self.G.nodes():
            self.G.nodes[node]['demand'] = np.random.uniform(30, 80)
            self.G.nodes[node]['voltage'] = np.random.uniform(210, 230)
        
        # Initialize edge features for predictive maintenance
        for u, v in self.G.edges():
            self.G[u][v]['resistance'] = np.random.uniform(0.001, 0.005)
            self.G[u][v]['temperature'] = np.random.uniform(25, 65)
            self.G[u][v]['current'] = np.random.uniform(100, 400)
            self.G[u][v]['vibration'] = np.random.uniform(0.1, 0.5)
            self.G[u][v]['age'] = np.random.uniform(1, 20)  # Years
            self.G[u][v]['corrosion'] = np.random.uniform(0.0, 0.4)  # Percentage
            self.G[u][v]['harmonic'] = np.random.uniform(1, 5)  # THD
            self.G[u][v]['risk'] = 0.5
        
        # Initialize tracking
        self.loss_history = []
        self.reward_history = []
        self.risk_history = []
        
        # Policy network for RL
        self.policy = PolicyNetwork(num_nodes, num_nodes)
        self.optimizer_rl = optim.Adam(self.policy.parameters(), lr=0.001)
        
        # Initialize Predictive Maintenance Model
        try:
            self.maintenance_model = PredictiveMaintenanceModel()
            # Try to load pre-trained model
            try:
                self.maintenance_model.load_model()
                print("✅ Pre-trained maintenance model loaded")
            except:
                print("⚠️ No pre-trained model found. Training synthetic model...")
                self._train_maintenance_model_synthetic()
        except Exception as e:
            print(f"❌ Error initializing maintenance model: {e}")
            self.maintenance_model = None
    
    def setup_named_nodes(self):
        """Setup named generators and substations"""
        generators = {
            0: "North Power Plant",
            1: "South Thermal Station"
        }
        
        substations = {
            2: "Downtown Substation",
            3: "Uptown Substation",
            4: "Industrial Zone",
            5: "Residential Hub",
            6: "Shopping Complex",
            7: "University Campus"
        }
        
        for node, name in {**generators, **substations}.items():
            if node < self.num_nodes:
                self.G.nodes[node]['name'] = name
    
    def _train_maintenance_model_synthetic(self):
        """Create synthetic training data for demo purposes"""
        import pandas as pd
        
        if self.maintenance_model is None:
            return
        
        # Generate synthetic normal data
        np.random.seed(42)
        n_samples = 1000
        
        normal_data = pd.DataFrame({
            'temperature': np.random.normal(50, 10, n_samples),
            'load': np.random.normal(60, 15, n_samples),
            'vibration': np.random.normal(0.2, 0.1, n_samples),
            'age': np.random.uniform(0, 20, n_samples),
            'corrosion': np.random.uniform(0, 0.3, n_samples),
            'harmonic_distortion': np.random.normal(2, 1, n_samples)
        })
        
        # Train Isolation Forest on normal data
        self.maintenance_model.train_isolation_forest(normal_data)
        
        # Generate synthetic failure data for XGBoost
        failure_data = normal_data.copy()
        failure_labels = np.zeros(n_samples)
        
        # Inject failure patterns
        for i in range(50):  # 50 failure examples
            idx = np.random.randint(0, n_samples)
            failure_data.loc[idx, 'temperature'] = np.random.uniform(85, 105)
            failure_data.loc[idx, 'load'] = np.random.uniform(90, 110)
            failure_data.loc[idx, 'vibration'] = np.random.uniform(0.6, 1.0)
            failure_labels[idx] = 1
        
        # Train XGBoost
        self.maintenance_model.train_xgboost(failure_data, failure_labels)
        
        print(f"✅ Synthetic maintenance training complete")
    
    def calculate_risk_from_features(self, u, v):
        """Calculate risk using real ML predictive maintenance model"""
        try:
            if self.maintenance_model is None:
                # Fallback: basic risk calculation
                return self.G[u][v].get('risk', 0.5)
            
            # Get real features from monitoring
            features = {
                'temperature': self.G[u][v].get('temperature', 50),
                'load': np.mean([
                    self.G.nodes[u].get('demand', 50),
                    self.G.nodes[v].get('demand', 50)
                ]),
                'vibration': self.G[u][v].get('vibration', 0.2),
                'age': self.G[u][v].get('age', 10),
                'corrosion': self.G[u][v].get('corrosion', 0.1),
                'harmonic_distortion': self.G[u][v].get('harmonic', 2.0)
            }
            
            # Use ML model for prediction
            risk_assessment = self.maintenance_model.predict_risk(features)
            
            # Store detailed risk info
            self.G[u][v]['risk_details'] = risk_assessment
            
            # Return failure probability
            if risk_assessment['failure_probability'] is not None:
                return risk_assessment['failure_probability']
            else:
                # Fallback: convert anomaly score to probability
                anomaly = risk_assessment['anomaly_score']
                return 1 / (1 + np.exp(anomaly))
        
        except Exception as e:
            print(f"⚠️ Error in risk calculation: {e}")
            return self.G[u][v].get('risk', 0.5)
    
    def compute_path_loss(self, path):
        """Compute transmission loss for a path"""
        total_loss = 0
        for i in range(len(path) - 1):
            u, v = path[i], path[i+1]
            if self.G.has_edge(u, v):
                resistance = self.G[u][v].get('resistance', 0.003)
                # Estimate power flow
                power_flow = 50  # MW (approximate)
                # Loss = power^2 * resistance (simplified I^2 * R)
                loss = (power_flow ** 2) * resistance / 1000
                total_loss += loss
        return total_loss
    
    def find_optimal_path(self, source, target, risk_weight=10.0):
        """Find path minimizing combined cost (resistance + risk)"""
        try:
            # Calculate weights with combined cost function
            for u, v in self.G.edges():
                resistance = self.G[u][v].get('resistance', 0.003)
                risk = self.calculate_risk_from_features(u, v)
                # Combined cost: resistance + weighted risk
                cost = resistance + (risk_weight * risk)
                self.G[u][v]['weight'] = cost
            
            # Find shortest path using combined cost
            path = nx.shortest_path(
                self.G, 
                source=source, 
                target=target, 
                weight='weight'
            )
            
            loss = self.compute_path_loss(path)
            return {'path': path, 'loss': loss}
        
        except nx.NetworkXNoPath:
            return {'path': [], 'loss': 0}
        except Exception as e:
            print(f"⚠️ Error finding path: {e}")
            return {'path': [], 'loss': 0}
    
    def train_episode(self):
        """Run single optimization episode"""
        try:
            # Update features (simulate time passing)
            for u, v in self.G.edges():
                self.G[u][v]['temperature'] += np.random.uniform(-2, 2)
                self.G[u][v]['temperature'] = np.clip(self.G[u][v]['temperature'], 10, 100)
                self.G[u][v]['age'] += 0.0001  # Slight aging
            
            # Find optimal paths for substations to generators
            optimized_paths = []
            total_loss = 0
            total_demand = 0
            total_risk = 0
            
            for substation in range(self.num_generators, self.num_nodes):
                for generator in range(self.num_generators):
                    # Find optimal path
                    path_info = self.find_optimal_path(substation, generator)
                    
                    if path_info['path']:
                        demand = self.G.nodes[substation].get('demand', 50)
                        loss = path_info['loss']
                        
                        optimized_paths.append({
                            'load_node': substation,
                            'load_name': self.G.nodes[substation].get('name', f'Node {substation}'),
                            'generator_node': generator,
                            'generator_name': self.G.nodes[generator].get('name', f'Generator {generator}'),
                            'path': path_info['path'],
                            'demand': demand,
                            'loss': loss
                        })
                        
                        total_loss += loss
                        total_demand += demand
                        
                        # Calculate average risk for path
                        path_risks = []
                        for i in range(len(path_info['path']) - 1):
                            u, v = path_info['path'][i], path_info['path'][i+1]
                            risk = self.calculate_risk_from_features(u, v)
                            path_risks.append(risk)
                        
                        if path_risks:
                            total_risk += np.mean(path_risks)
            
            # Calculate loss percentage
            loss_percent = (total_loss / max(total_demand, 1)) * 100 if total_demand > 0 else 0
            
            # Calculate reward
            reward = -loss_percent - (total_risk / max(len(optimized_paths), 1))
            
            # Track history
            self.loss_history.append(loss_percent)
            self.reward_history.append(reward)
            self.risk_history.append(total_risk / max(len(optimized_paths), 1) if optimized_paths else 0)
            
            return {
                'paths': optimized_paths,
                'loss_percent': loss_percent,
                'total_demand': total_demand,
                'avg_risk': total_risk / max(len(optimized_paths), 1) if optimized_paths else 0,
                'reward': reward
            }
        
        except Exception as e:
            print(f"❌ Error in training episode: {e}")
            import traceback
            traceback.print_exc()
            return {
                'paths': [],
                'loss_percent': 0,
                'total_demand': 0,
                'avg_risk': 0,
                'reward': 0
            }
    
    def plot_training_progress(self):
        """Plot training metrics"""
        if not self.loss_history:
            return
        
        fig, axes = plt.subplots(1, 3, figsize=(15, 4))
        
        axes[0].plot(self.loss_history)
        axes[0].set_xlabel('Episode')
        axes[0].set_ylabel('Loss %')
        axes[0].set_title('Transmission Loss Over Time')
        axes[0].grid(True)
        
        axes[1].plot(self.reward_history)
        axes[1].set_xlabel('Episode')
        axes[1].set_ylabel('Reward')
        axes[1].set_title('Reward Over Time')
        axes[1].grid(True)
        
        axes[2].plot(self.risk_history)
        axes[2].set_xlabel('Episode')
        axes[2].set_ylabel('Avg Risk')
        axes[2].set_title('Risk Assessment Over Time')
        axes[2].grid(True)
        
        plt.tight_layout()
        plt.savefig('training_progress.png')
        print("✅ Training progress saved to training_progress.png")
    
    def visualize_episode(self, result):
        """Visualize current grid state"""
        try:
            pos = nx.spring_layout(self.G)
            
            plt.figure(figsize=(10, 8))
            nx.draw_networkx_nodes(self.G, pos, node_color='lightblue', node_size=500)
            nx.draw_networkx_edges(self.G, pos, alpha=0.5)
            nx.draw_networkx_labels(self.G, pos)
            
            plt.title(f"Smart Grid - Loss: {result['loss_percent']:.2f}%")
            plt.axis('off')
            plt.tight_layout()
            plt.savefig('grid_visualization.png')
            plt.close()
        except Exception as e:
            print(f"⚠️ Error in visualization: {e}")


# ===============================
# TRAINING EXAMPLES
# ===============================

if __name__ == "__main__":
    
    # Create optimizer
    optimizer = SmartGridOptimizer(num_nodes=8, num_generators=2)
    optimizer.setup_named_nodes()
    
    # Training
    num_episodes = 50
    
    print("🚀 Starting Smart Grid Training...")
    print("=" * 60)
    
    for episode in range(num_episodes):
        result = optimizer.train_episode()
        
        if (episode + 1) % 10 == 0:
            print(f"\n📊 Episode {episode + 1}")
            print(f"   Loss: {result['loss_percent']:.2f}%")
            print(f"   Avg Risk: {result['avg_risk']:.3f}")
            print(f"   Reward: {result['reward']:.2f}")
    
    print("\n✅ Training Complete!")
    print(f"Final Loss: {optimizer.loss_history[-1]:.2f}%")
    print(f"Best Loss: {min(optimizer.loss_history):.2f}%")
    
    # Plot progress
    optimizer.plot_training_progress()
