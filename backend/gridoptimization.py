import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.distributions import Categorical
import networkx as nx
import matplotlib.pyplot as plt
import numpy as np
import random

# ===============================
# 1️⃣ COMPLETE SYSTEM
# ===============================

class SmartGridOptimizer:
    """
    Integrates:
    - Predictive Maintenance (asset risks)
    - Reinforcement Learning (policy optimization)
    - Path Optimization (risk-weighted routing)
    """
    
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
        
        # Maintenance model (your XGBoost from earlier)
        self.maintenance_model = self.load_maintenance_model()
        
        # Training logs
        self.loss_history = []
        self.risk_history = []
        self.optimized_paths = []  # Store current optimized paths
        
    def setup_named_nodes(self):
        """Setup named generators and substations"""
        # Named generators
        self.generator_names = {
            0: "North Power Plant",
            1: "South Thermal Station"
        }
        
        # Named substations with constant demands (MW)
        self.substation_names = {
            2: {"name": "Downtown Substation", "demand": 45},
            3: {"name": "Uptown Substation", "demand": 52},
            4: {"name": "Industrial Zone Station", "demand": 75},
            5: {"name": "Residential Hub", "demand": 38},
            6: {"name": "Shopping Complex Node", "demand": 41},
            7: {"name": "University Campus Hub", "demand": 48}
        }
        
        # Set node properties
        for node_id in self.generators:
            self.G.nodes[node_id]["name"] = self.generator_names[node_id]
            self.G.nodes[node_id]["type"] = "generator"
            
        for node_id in self.loads:
            self.G.nodes[node_id]["name"] = self.substation_names[node_id]["name"]
            self.G.nodes[node_id]["type"] = "substation"
            self.G.nodes[node_id]["constant_demand"] = self.substation_names[node_id]["demand"]
        
    def create_grid(self):
        """Create connected grid"""
        self.G = nx.erdos_renyi_graph(self.num_nodes, 0.5)
        while not nx.is_connected(self.G):
            self.G = nx.erdos_renyi_graph(self.num_nodes, 0.5)
        
        # Set node types
        for n in self.G.nodes:
            if n in self.generators:
                self.G.nodes[n]["type"] = "generator"
            else:
                self.G.nodes[n]["type"] = "load"
    
    def load_maintenance_model(self):
        """Placeholder for your XGBoost/Isolation Forest model"""
        # In real code, load your trained model here
        return {"model": "predictive_maintenance_model"}
    
    def update_grid_state(self, scada_data):
        """Update grid with real data + maintenance predictions"""
        
        # 1. Update demands from SCADA (constant for each substation)
        for load in self.loads:
            # Use constant demand from substation definition
            if load in self.substation_names:
                self.G.nodes[load]["demand"] = self.substation_names[load]["demand"]
            else:
                self.G.nodes[load]["demand"] = random.randint(20, 60)
        
        # Update generator capacities
        for gen in self.generators:
            self.G.nodes[gen]["demand"] = 0  # Generators don't have demand
        
        # 2. Update resistances (thermal effects)
        for u, v in self.G.edges:
            base_resistance = 0.002
            temp_factor = 1 + 0.0039 * random.uniform(20, 50)  # Temperature effect
            self.G[u][v]["resistance"] = base_resistance * temp_factor
        
        # 3. CRITICAL: Get risks from maintenance model
        for u, v in self.G.edges:
            # Simulate maintenance model prediction
            # In real code: risk = self.maintenance_model.predict(line_id)
            self.G[u][v]["risk"] = self.calculate_risk_from_features(u, v)
    
    def calculate_risk_from_features(self, u, v):
        """
        Simulate your predictive maintenance model
        In real system: call your trained XGBoost model
        """
        # Features that would come from monitoring
        features = {
            'load': np.mean([self.G.nodes[u].get('demand', 50), 
                            self.G.nodes[v].get('demand', 50)]),
            'temp': random.uniform(40, 90),
            'age': random.uniform(0, 20),
            'vibration': random.uniform(0, 1),
            'corrosion': random.uniform(0, 0.5)
        }
        
        # Simple risk model (replace with actual ML model)
        risk = (
            0.3 * (features['load'] / 100) +
            0.4 * (features['temp'] / 100) +
            0.2 * (features['age'] / 20) +
            0.1 * features['vibration']
        )
        
        return min(risk, 0.95)  # Cap at 0.95
    
    def create_state_tensor(self, node):
        """Rich state representation for RL"""
        
        demand = self.G.nodes[node]["demand"]
        degree = self.G.degree[node]
        
        # Risk features
        neighbor_risks = [self.G[node][nbr]["risk"] for nbr in self.G.neighbors(node)]
        avg_risk = np.mean(neighbor_risks) if neighbor_risks else 0
        max_risk = np.max(neighbor_risks) if neighbor_risks else 0
        
        # Path features to each generator
        path_resistances = []
        path_risks = []
        
        for gen in self.generators:
            try:
                # Find best path considering both resistance AND risk
                path = self.find_optimal_path(node, gen)
                path_resistance = sum(self.G[u][v]["resistance"] for u,v in zip(path,path[1:]))
                path_risk = sum(self.G[u][v]["risk"] for u,v in zip(path,path[1:]))
                path_resistances.append(path_resistance)
                path_risks.append(path_risk)
            except:
                path_resistances.append(999)
                path_risks.append(999)
        
        # Normalized state vector
        state = torch.tensor([
            demand / 100,  # Normalize demand
            avg_risk,      # Average neighbor risk
            max_risk,      # Maximum neighbor risk
            degree / 10,   # Normalize degree
            min(path_resistances) / 10,  # Best path resistance
            min(path_risks),              # Best path risk
            np.mean(path_resistances) / 10  # Average path resistance
        ], dtype=torch.float32)
        
        return state
    
    def find_optimal_path(self, source, target, risk_weight=10.0):
        """
        Find path minimizing: resistance + risk_weight * risk
        This balances loss minimization with asset protection
        """
        H = self.G.copy()
        
        for u, v in H.edges:
            # Combined cost: loss (resistance) + risk penalty
            H[u][v]['weight'] = (
                H[u][v]['resistance'] + 
                risk_weight * H[u][v]['risk']
            )
        
        return nx.shortest_path(H, source, target, weight='weight')
    
    def compute_path_loss(self, path):
        """Calculate actual I²R loss for a path"""
        return sum(self.G[u][v]["resistance"] for u,v in zip(path,path[1:]))
    
    def train_episode(self):
        """Single training episode using REINFORCE"""
        
        # Update grid with new state
        self.update_grid_state(scada_data=None)  # In real: pass SCADA data
        
        log_probs = []
        rewards = []
        paths = []
        
        total_loss = 0
        total_demand = 0
        
        # For each load, decide which generator to use AND calculate optimized path
        for load in self.loads:
            demand = self.G.nodes[load]["demand"]
            total_demand += demand
            
            # Get state
            state = self.create_state_tensor(load)
            
            # Policy forward pass
            logits = self.policy(state)
            probs = F.softmax(logits, dim=0)
            dist = Categorical(probs)
            
            # Sample action
            action = dist.sample()
            log_prob = dist.log_prob(action)
            log_probs.append(log_prob)
            
            chosen_gen = self.generators[action.item()]
            
            # Find optimal path (considering both loss and risk)
            path = self.find_optimal_path(load, chosen_gen)
            paths.append((load, chosen_gen, path))
            
            # Calculate actual loss (for reward)
            loss = demand * self.compute_path_loss(path)
            total_loss += loss
        
        # Store optimized paths for API access
        self.optimized_paths = [
            {
                "load_node": load,
                "load_name": self.G.nodes[load]["name"],
                "generator_node": gen,
                "generator_name": self.G.nodes[gen]["name"],
                "path": path,
                "demand": self.G.nodes[load]["demand"],
                "loss": self.G.nodes[load]["demand"] * self.compute_path_loss(path)
            }
            for load, gen, path in paths
        ]
        
        # Calculate reward (negative loss percentage)
        loss_percent = (total_loss / total_demand) * 100 if total_demand > 0 else 0
        reward = -loss_percent
        
        # REINFORCE update
        policy_loss = []
        for log_prob in log_probs:
            policy_loss.append(-log_prob * reward)
        
        self.optimizer.zero_grad()
        loss_tensor = torch.stack(policy_loss).sum()
        loss_tensor.backward()
        self.optimizer.step()
        
        # Store history
        self.loss_history.append(loss_percent)
        self.risk_history.append(np.mean([self.G[u][v]['risk'] for u,v in self.G.edges]))
        
        return {
            'loss_percent': loss_percent,
            'reward': reward,
            'paths': self.optimized_paths,
            'avg_risk': self.risk_history[-1],
            'total_demand': total_demand
        }
    
    def visualize_episode(self, episode_result):
        """Visualize the current grid state and chosen paths"""
        
        plt.figure(figsize=(12, 8))
        pos = nx.spring_layout(self.G, seed=42, k=2)
        
        # Draw nodes
        node_colors = ['green' if n in self.generators else 'red' for n in self.G.nodes]
        nx.draw_networkx_nodes(self.G, pos, node_color=node_colors, node_size=1000)
        
        # Draw all edges (gray)
        nx.draw_networkx_edges(self.G, pos, edge_color='gray', width=1, alpha=0.5)
        
        # Highlight chosen paths
        for load, gen, path in episode_result['paths']:
            path_edges = list(zip(path, path[1:]))
            nx.draw_networkx_edges(
                self.G, pos, 
                edgelist=path_edges,
                edge_color='orange',
                width=3,
                alpha=0.8
            )
        
        # Node labels
        labels = {}
        for n in self.G.nodes:
            if n in self.generators:
                labels[n] = f"G{n}"
            else:
                labels[n] = f"L{n}\n{self.G.nodes[n]['demand']}MW"
        
        nx.draw_networkx_labels(self.G, pos, labels, font_size=10)
        
        # Edge labels (show risk)
        edge_labels = {}
        for u, v in self.G.edges:
            edge_labels[(u, v)] = f"R:{self.G[u][v]['risk']:.2f}"
        
        nx.draw_networkx_edge_labels(self.G, pos, edge_labels, font_size=8)
        
        plt.title(f"Smart Grid - Loss: {episode_result['loss_percent']:.2f}% | Avg Risk: {episode_result['avg_risk']:.3f}")
        plt.tight_layout()
        plt.show()
    
    def plot_training_progress(self):
        """Plot loss and risk over time"""
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
        
        ax1.plot(self.loss_history)
        ax1.set_title('Transmission Loss % Over Time')
        ax1.set_xlabel('Episode')
        ax1.set_ylabel('Loss %')
        ax1.grid(True)
        
        ax2.plot(self.risk_history)
        ax2.set_title('Average Asset Risk Over Time')
        ax2.set_xlabel('Episode')
        ax2.set_ylabel('Risk')
        ax2.grid(True)
        
        plt.tight_layout()
        plt.show()


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
# 2️⃣ TRAINING LOOP
# ===============================

if __name__ == "__main__":
    
    # Create optimizer
    optimizer = SmartGridOptimizer(num_nodes=8, num_generators=2)
    
    # Training
    num_episodes = 50
    
    print("🚀 Starting Smart Grid Training...")
    print("=" * 50)
    
    for episode in range(num_episodes):
        result = optimizer.train_episode()
        
        if (episode + 1) % 10 == 0:
            print(f"\n📊 Episode {episode + 1}")
            print(f"   Loss: {result['loss_percent']:.2f}%")
            print(f"   Avg Risk: {result['avg_risk']:.3f}")
            print(f"   Reward: {result['reward']:.2f}")
            
            # Visualize every 10 episodes
            optimizer.visualize_episode(result)
    
    print("\n✅ Training Complete!")
    print(f"Final Loss: {optimizer.loss_history[-1]:.2f}%")
    print(f"Best Loss: {min(optimizer.loss_history):.2f}%")
    
    # Plot progress
    optimizer.plot_training_progress()