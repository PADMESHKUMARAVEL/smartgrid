"""
Predictive Maintenance Module
Algorithms used:
- XGBoost (Supervised) - Primary failure prediction
- Random Forest (Supervised) - Ensemble backup
- Isolation Forest (Unsupervised) - Anomaly detection
- LSTM (Optional) - Time series forecasting
"""

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import joblib
import os
import json
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Optional: LSTM for time series (commented out to avoid tensorflow dependency)
# from tensorflow.keras.models import Sequential
# from tensorflow.keras.layers import LSTM, Dense, Dropout
# from tensorflow.keras.callbacks import EarlyStopping

class PredictiveMaintenanceModel:
    """
    Hybrid Predictive Maintenance System
    Combines multiple ML algorithms for robust failure prediction
    """
    
    def __init__(self, model_dir='models/'):
        """
        Initialize all models
        """
        self.model_dir = model_dir
        os.makedirs(model_dir, exist_ok=True)
        
        # ==============================
        # 1. XGBoost - Primary Classifier
        # ==============================
        self.xgb_model = xgb.XGBClassifier(
            n_estimators=200,           # Number of trees
            max_depth=8,                 # Tree depth
            learning_rate=0.1,           # Step size
            subsample=0.8,               # Sample ratio
            colsample_bytree=0.8,        # Feature ratio
            scale_pos_weight=5,          # Handle imbalance (failures rare)
            random_state=42,
            use_label_encoder=False,
            eval_metric='logloss'
        )
        
        # ==============================
        # 2. Random Forest - Ensemble Backup
        # ==============================
        self.rf_model = RandomForestClassifier(
            n_estimators=200,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            class_weight='balanced'       # Handle imbalance
        )
        
        # ==============================
        # 3. Isolation Forest - Anomaly Detection
        # ==============================
        self.if_model = IsolationForest(
            n_estimators=200,
            contamination=0.1,            # Expected 10% anomalies
            random_state=42,
            bootstrap=True
        )
        
        # ==============================
        # 4. LSTM - Optional Time Series
        # ==============================
        self.lstm_model = None
        self.use_lstm = False
        
        # Training status
        self.is_trained = False
        self.feature_names = None
        self.training_history = {}
        
        print("✅ Predictive Maintenance System Initialized")
        print(f"   Models: XGBoost, Random Forest, Isolation Forest")
        print(f"   Model directory: {model_dir}")
    
    # ==============================
    # DATA GENERATION FOR TRAINING
    # ==============================
    
    def generate_synthetic_training_data(self, n_samples=10000, failure_rate=0.08):
        """
        Generate realistic sensor data for training
        Simulates:
        - Normal operation
        - Degradation patterns
        - Failure events
        """
        print(f"\n📊 Generating {n_samples} synthetic training samples...")
        
        np.random.seed(42)
        
        # Create timestamp sequence
        start_time = datetime.now() - timedelta(days=365)
        timestamps = [start_time + timedelta(hours=i) for i in range(n_samples)]
        
        # =====================================
        # 1. BASE FEATURES (Normal operation)
        # =====================================
        
        # Temperature (°C) - Normal range 40-70
        temp_base = np.random.normal(55, 8, n_samples)
        
        # Load (%) - Normal range 40-85
        load_base = np.random.normal(62, 12, n_samples)
        
        # Vibration (mm/s) - Normal < 0.5
        vibration_base = np.random.exponential(0.2, n_samples)
        
        # Age (years)
        age = np.random.uniform(0, 25, n_samples)
        
        # Corrosion index (0-1)
        corrosion = np.random.beta(2, 5, n_samples)
        
        # Harmonic distortion (%)
        harmonics = np.random.exponential(2, n_samples)
        
        # Oil quality (0-1, higher is better)
        oil_quality = np.random.beta(8, 2, n_samples)
        
        # Number of trips/operations
        trip_count = np.random.poisson(age * 2, n_samples)
        
        # Weather factors
        ambient_temp = np.random.normal(25, 10, n_samples)
        humidity = np.random.uniform(30, 90, n_samples)
        
        # =====================================
        # 2. ADD DEGRADATION PATTERNS
        # =====================================
        
        # Older equipment runs hotter
        temp = temp_base + age * 0.5
        
        # Higher load increases temperature
        temp = temp + (load_base - 50) * 0.3
        
        # Vibration increases with age and load
        vibration = vibration_base + age * 0.02 + (load_base - 50) * 0.01
        
        # Corrosion increases with age and humidity
        corrosion = corrosion + age * 0.01 + humidity * 0.002
        
        # =====================================
        # 3. CREATE FAILURE LABELS
        # =====================================
        
        # Initialize failure labels
        failure = np.zeros(n_samples)
        failure_type = np.zeros(n_samples)  # 0: normal, 1: thermal, 2: mechanical, 3: electrical
        
        # Define failure conditions
        thermal_failure = (temp > 95) & (load_base > 85) & (oil_quality < 0.3)
        mechanical_failure = (vibration > 1.2) & (age > 15) & (trip_count > 30)
        electrical_failure = (harmonics > 8) & (load_base > 80) & (corrosion > 0.6)
        
        # Assign failures
        failure[thermal_failure] = 1
        failure_type[thermal_failure] = 1
        
        failure[mechanical_failure] = 1
        failure_type[mechanical_failure] = 2
        
        failure[electrical_failure] = 1
        failure_type[electrical_failure] = 3
        
        # Add some random failures (5% of samples)
        random_failures = np.random.choice(n_samples, int(n_samples * 0.02), replace=False)
        failure[random_failures] = 1
        failure_type[random_failures] = np.random.choice([1, 2, 3], len(random_failures))
        
        # =====================================
        # 4. CREATE DATAFRAME
        # =====================================
        
        data = pd.DataFrame({
            'timestamp': timestamps,
            'temperature': np.clip(temp, 20, 120),
            'load': np.clip(load_base, 10, 110),
            'vibration': np.clip(vibration, 0, 2.5),
            'age': age,
            'corrosion': np.clip(corrosion, 0, 1),
            'harmonics': np.clip(harmonics, 0, 15),
            'oil_quality': oil_quality,
            'trip_count': trip_count,
            'ambient_temp': ambient_temp,
            'humidity': humidity,
            'failure': failure,
            'failure_type': failure_type
        })
        
        # Shuffle
        data = data.sample(frac=1).reset_index(drop=True)
        
        print(f"✅ Synthetic data generated:")
        print(f"   Total samples: {len(data)}")
        print(f"   Failures: {int(failure.sum())} ({failure.sum()/len(data)*100:.1f}%)")
        print(f"   Features: {len([c for c in data.columns if c not in ['timestamp', 'failure', 'failure_type']])}")
        
        return data
    
    # ==============================
    # MODEL TRAINING
    # ==============================
    
    def train(self, data=None, target_col='failure', test_size=0.2):
        """
        Train all models on historical data
        """
        print("\n" + "="*60)
        print("🔧 TRAINING PREDICTIVE MAINTENANCE MODELS")
        print("="*60)
        
        # Generate data if not provided
        if data is None:
            data = self.generate_synthetic_training_data(n_samples=10000)
        
        # Prepare features and target
        feature_cols = [col for col in data.columns if col not in 
                       ['timestamp', 'failure', 'failure_type']]
        self.feature_names = feature_cols
        
        X = data[feature_cols]
        y = data[target_col]
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        print(f"\n📊 Training Data:")
        print(f"   Training samples: {len(X_train)}")
        print(f"   Test samples: {len(X_test)}")
        print(f"   Features: {len(feature_cols)}")
        
        # ==============================
        # 1. Train XGBoost
        # ==============================
        print("\n🚀 Training XGBoost...")
        start_time = datetime.now()
        
        self.xgb_model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            verbose=False
        )
        
        xgb_time = (datetime.now() - start_time).total_seconds()
        xgb_pred = self.xgb_model.predict(X_test)
        xgb_prob = self.xgb_model.predict_proba(X_test)[:, 1]
        
        # ==============================
        # 2. Train Random Forest
        # ==============================
        print("🚀 Training Random Forest...")
        start_time = datetime.now()
        
        self.rf_model.fit(X_train, y_train)
        
        rf_time = (datetime.now() - start_time).total_seconds()
        rf_pred = self.rf_model.predict(X_test)
        rf_prob = self.rf_model.predict_proba(X_test)[:, 1]
        
        # ==============================
        # 3. Train Isolation Forest (on NORMAL data only)
        # ==============================
        print("🚀 Training Isolation Forest...")
        start_time = datetime.now()
        
        normal_data = X_train[y_train == 0]
        self.if_model.fit(normal_data)
        
        if_time = (datetime.now() - start_time).total_seconds()
        
        # Get anomaly scores for test set
        if_scores = self.if_model.score_samples(X_test)
        # Convert to probability-like score (0-1, higher = more anomalous)
        if_prob = 1 / (1 + np.exp(-if_scores))  # Sigmoid transform
        
        # ==============================
        # 4. Calculate Metrics
        # ==============================
        
        # XGBoost metrics
        xgb_acc = accuracy_score(y_test, xgb_pred)
        xgb_prec = precision_score(y_test, xgb_pred, zero_division=0)
        xgb_rec = recall_score(y_test, xgb_pred, zero_division=0)
        xgb_f1 = f1_score(y_test, xgb_pred, zero_division=0)
        
        # Random Forest metrics
        rf_acc = accuracy_score(y_test, rf_pred)
        rf_prec = precision_score(y_test, rf_pred, zero_division=0)
        rf_rec = recall_score(y_test, rf_pred, zero_division=0)
        rf_f1 = f1_score(y_test, rf_pred, zero_division=0)
        
        # Ensemble (average of XGBoost and RF)
        ensemble_prob = (xgb_prob + rf_prob) / 2
        ensemble_pred = (ensemble_prob > 0.5).astype(int)
        ensemble_acc = accuracy_score(y_test, ensemble_pred)
        
        # Store training history
        self.training_history = {
            'xgb': {
                'accuracy': xgb_acc,
                'precision': xgb_prec,
                'recall': xgb_rec,
                'f1': xgb_f1,
                'time': xgb_time
            },
            'rf': {
                'accuracy': rf_acc,
                'precision': rf_prec,
                'recall': rf_rec,
                'f1': rf_f1,
                'time': rf_time
            },
            'ensemble': {
                'accuracy': ensemble_acc
            },
            'iforest': {
                'time': if_time
            }
        }
        
        # Feature importance
        self.feature_importance = pd.DataFrame({
            'feature': feature_cols,
            'xgb_importance': self.xgb_model.feature_importances_,
            'rf_importance': self.rf_model.feature_importances_
        }).sort_values('xgb_importance', ascending=False)
        
        print("\n" + "="*60)
        print("📈 TRAINING RESULTS")
        print("="*60)
        print(f"\n{'Model':<15} {'Accuracy':<10} {'Precision':<10} {'Recall':<10} {'F1':<10} {'Time':<10}")
        print("-"*65)
        print(f"{'XGBoost':<15} {xgb_acc:.3f}      {xgb_prec:.3f}      {xgb_rec:.3f}      {xgb_f1:.3f}      {xgb_time:.2f}s")
        print(f"{'Random Forest':<15} {rf_acc:.3f}      {rf_prec:.3f}      {rf_rec:.3f}      {rf_f1:.3f}      {rf_time:.2f}s")
        print(f"{'Ensemble':<15} {ensemble_acc:.3f}")
        
        print("\n📊 Top 5 Most Important Features (XGBoost):")
        for i, row in self.feature_importance.head().iterrows():
            print(f"   {row['feature']}: {row['xgb_importance']:.3f}")
        
        self.is_trained = True
        return self.training_history
    
    # ==============================
    # PREDICTION
    # ==============================
    
    def predict_risk(self, sensor_readings):
        """
        Predict failure risk from current sensor readings
        Uses ensemble of all models
        """
        if not self.is_trained:
            raise ValueError("Models not trained yet! Call train() first.")
        
        # Convert to DataFrame
        df = pd.DataFrame([sensor_readings])
        
        # Ensure all features present
        for feat in self.feature_names:
            if feat not in df.columns:
                df[feat] = 0
        
        df = df[self.feature_names]
        
        # ==============================
        # 1. XGBoost prediction
        # ==============================
        xgb_prob = float(self.xgb_model.predict_proba(df)[0, 1])
        
        # Get feature contribution (simplified SHAP)
        xgb_contrib = {}
        for feat in self.feature_names:
            # Simple approximation: feature value * importance
            xgb_contrib[feat] = float(df[feat].iloc[0] * self.xgb_model.feature_importances_[self.feature_names.index(feat)])
        
        # ==============================
        # 2. Random Forest prediction
        # ==============================
        rf_prob = float(self.rf_model.predict_proba(df)[0, 1])
        
        # ==============================
        # 3. Isolation Forest anomaly score
        # ==============================
        if_score = float(self.if_model.score_samples(df)[0])
        # Convert to 0-1 probability (more negative = more anomalous)
        anomaly_prob = 1 / (1 + np.exp(-if_score))
        
        # ==============================
        # 4. Ensemble prediction
        # ==============================
        # Weighted average: XGBoost (0.5), RF (0.3), Anomaly (0.2)
        ensemble_prob = 0.5 * xgb_prob + 0.3 * rf_prob + 0.2 * anomaly_prob
        
        # ==============================
        # 5. Determine risk level
        # ==============================
        if ensemble_prob > 0.7:
            risk_level = 'CRITICAL'
            recommendation = 'IMMEDIATE ACTION REQUIRED'
        elif ensemble_prob > 0.4:
            risk_level = 'HIGH'
            recommendation = 'Schedule maintenance within 7 days'
        elif ensemble_prob > 0.2:
            risk_level = 'MEDIUM'
            recommendation = 'Monitor closely'
        else:
            risk_level = 'LOW'
            recommendation = 'Normal operation'
        
        # ==============================
        # 6. Predict failure type if probability high
        # ==============================
        failure_type = None
        if ensemble_prob > 0.3:
            # Simplified failure type prediction
            if sensor_readings.get('temperature', 0) > 90:
                failure_type = 'Thermal Overload'
            elif sensor_readings.get('vibration', 0) > 1.0:
                failure_type = 'Mechanical Fatigue'
            elif sensor_readings.get('harmonics', 0) > 8:
                failure_type = 'Electrical Disturbance'
            else:
                failure_type = 'General Degradation'
        
        return {
            'failure_probability': ensemble_prob,
            'risk_level': risk_level,
            'recommendation': recommendation,
            'failure_type': failure_type,
            'model_breakdown': {
                'xgboost': xgb_prob,
                'random_forest': rf_prob,
                'anomaly_score': anomaly_prob,
                'raw_anomaly_score': if_score
            },
            'contributing_factors': dict(sorted(
                xgb_contrib.items(), 
                key=lambda x: abs(x[1]), 
                reverse=True
            )[:3]),  # Top 3 factors
            'timestamp': datetime.now().isoformat()
        }
    
    # ==============================
    # BATCH PREDICTION
    # ==============================
    
    def predict_batch(self, sensor_data_df):
        """
        Predict risks for multiple assets
        """
        results = []
        for idx, row in sensor_data_df.iterrows():
            risk = self.predict_risk(row.to_dict())
            risk['asset_id'] = idx
            results.append(risk)
        
        return results
    
    # ==============================
    # MODEL PERSISTENCE
    # ==============================
    
    def save_models(self):
        """Save all trained models to disk"""
        if not self.is_trained:
            print("⚠️ No trained models to save")
            return
        
        # Save XGBoost
        joblib.dump(self.xgb_model, f'{self.model_dir}xgb_model.pkl')
        
        # Save Random Forest
        joblib.dump(self.rf_model, f'{self.model_dir}rf_model.pkl')
        
        # Save Isolation Forest
        joblib.dump(self.if_model, f'{self.model_dir}if_model.pkl')
        
        # Save metadata
        metadata = {
            'feature_names': self.feature_names,
            'is_trained': self.is_trained,
            'training_history': self.training_history,
            'feature_importance': self.feature_importance.to_dict()
        }
        
        with open(f'{self.model_dir}metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2, default=str)
        
        print(f"✅ Models saved to {self.model_dir}")
    
    def load_models(self):
        """Load trained models from disk"""
        try:
            # Load XGBoost
            self.xgb_model = joblib.load(f'{self.model_dir}xgb_model.pkl')
            
            # Load Random Forest
            self.rf_model = joblib.load(f'{self.model_dir}rf_model.pkl')
            
            # Load Isolation Forest
            self.if_model = joblib.load(f'{self.model_dir}if_model.pkl')
            
            # Load metadata
            with open(f'{self.model_dir}metadata.json', 'r') as f:
                metadata = json.load(f)
            
            self.feature_names = metadata['feature_names']
            self.is_trained = metadata['is_trained']
            self.training_history = metadata['training_history']
            
            print(f"✅ Models loaded from {self.model_dir}")
            return True
            
        except Exception as e:
            print(f"⚠️ Could not load models: {e}")
            return False
    
    # ==============================
    # LSTM IMPLEMENTATION (Optional)
    # ==============================
    
    def build_lstm(self, sequence_length=24, n_features=None):
        """
        Build LSTM model for time series prediction
        Note: Requires tensorflow to be installed
        """
        try:
            import tensorflow as tf
            from tensorflow.keras.models import Sequential
            from tensorflow.keras.layers import LSTM, Dense, Dropout
            
            if n_features is None:
                n_features = len(self.feature_names)
            
            model = Sequential([
                LSTM(100, return_sequences=True, input_shape=(sequence_length, n_features)),
                Dropout(0.2),
                LSTM(100, return_sequences=False),
                Dropout(0.2),
                Dense(50, activation='relu'),
                Dense(1, activation='sigmoid')
            ])
            
            model.compile(
                optimizer='adam',
                loss='binary_crossentropy',
                metrics=['accuracy']
            )
            
            self.lstm_model = model
            self.use_lstm = True
            print("✅ LSTM model built successfully")
            
            return model
            
        except ImportError:
            print("⚠️ TensorFlow not installed. LSTM not available.")
            return None
    
    def prepare_lstm_data(self, data, sequence_length=24):
        """
        Prepare data for LSTM training
        """
        feature_cols = [col for col in data.columns if col not in ['timestamp', 'failure']]
        X = data[feature_cols].values
        y = data['failure'].values
        
        X_seq, y_seq = [], []
        for i in range(len(X) - sequence_length):
            X_seq.append(X[i:i+sequence_length])
            y_seq.append(y[i+sequence_length])
        
        return np.array(X_seq), np.array(y_seq)


# ==============================
# TEST FUNCTION
# ==============================

def test_predictive_maintenance():
    """
    Test the predictive maintenance system
    """
    print("\n" + "="*60)
    print("🔬 TESTING PREDICTIVE MAINTENANCE SYSTEM")
    print("="*60)
    
    # Initialize model
    pm = PredictiveMaintenanceModel()
    
    # Train on synthetic data
    pm.train()
    
    # Test prediction on normal operation
    print("\n🔍 Testing prediction on NORMAL operation:")
    normal_readings = {
        'temperature': 55.2,
        'load': 62.5,
        'vibration': 0.23,
        'age': 8.5,
        'corrosion': 0.15,
        'harmonics': 2.1,
        'oil_quality': 0.82,
        'trip_count': 15,
        'ambient_temp': 24.0,
        'humidity': 45.0
    }
    
    risk = pm.predict_risk(normal_readings)
    print(f"   Risk Level: {risk['risk_level']}")
    print(f"   Probability: {risk['failure_probability']:.3f}")
    print(f"   Recommendation: {risk['recommendation']}")
    
    # Test prediction on HIGH risk
    print("\n🔴 Testing prediction on HIGH RISK operation:")
    high_risk_readings = {
        'temperature': 98.5,
        'load': 95.0,
        'vibration': 1.45,
        'age': 18.5,
        'corrosion': 0.65,
        'harmonics': 9.2,
        'oil_quality': 0.25,
        'trip_count': 45,
        'ambient_temp': 35.0,
        'humidity': 80.0
    }
    
    risk = pm.predict_risk(high_risk_readings)
    print(f"   Risk Level: {risk['risk_level']}")
    print(f"   Probability: {risk['failure_probability']:.3f}")
    print(f"   Failure Type: {risk['failure_type']}")
    print(f"   Recommendation: {risk['recommendation']}")
    print(f"   Top Factors: {risk['contributing_factors']}")
    
    # Save models
    pm.save_models()
    
    return pm


if __name__ == "__main__":
    # Run test
    model = test_predictive_maintenance()
    
    print("\n✅ Predictive Maintenance Module Ready!")
    print("   Features:")
    print("   - XGBoost (Primary classifier)")
    print("   - Random Forest (Ensemble backup)")
    print("   - Isolation Forest (Anomaly detection)")
    print("   - LSTM (Optional time series)")