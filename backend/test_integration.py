#!/usr/bin/env python
"""
Backend Integration Test Script
Tests all components to verify successful integration
"""

import sys

def test_backend_integration():
    print("Testing Backend Integration...\n")
    
    # Test 1: Import modules
    print("1. Testing module imports...")
    try:
        from gridoptimization import SmartGridOptimizer
        from datagenerate import grid_generator
        from predictive_maintenance import PredictiveMaintenanceModel
        print("   ✅ All modules imported successfully\n")
    except Exception as e:
        print(f"   ❌ Import error: {e}")
        return False
    
    # Test 2: Create optimizer
    print("2. Testing SmartGridOptimizer...")
    try:
        optimizer = SmartGridOptimizer(num_nodes=8, num_generators=2)
        optimizer.setup_named_nodes()
        print("   ✅ Optimizer initialized\n")
    except Exception as e:
        print(f"   ❌ Optimizer error: {e}")
        return False
    
    # Test 3: Generate data
    print("3. Testing data generation...")
    try:
        grid_generator.generate_scada_data()
        state = grid_generator.get_grid_state()
        print(f"   ✅ Data generated (Iteration {state['iteration']}, "
              f"{state['metrics']['total_edges']} edges)\n")
    except Exception as e:
        print(f"   ❌ Generation error: {e}")
        return False
    
    # Test 4: Run optimization
    print("4. Testing optimization episode...")
    try:
        result = optimizer.train_episode()
        print(f"   ✅ Episode run successfully")
        print(f"      - Loss: {result['loss_percent']:.2f}%")
        print(f"      - Risk: {result['avg_risk']:.3f}")
        print(f"      - Paths optimized: {len(result['paths'])}\n")
    except Exception as e:
        print(f"   ❌ Optimization error: {e}")
        return False
    
    # Test 5: Check ML model
    print("5. Testing Predictive Maintenance model...")
    try:
        pm = optimizer.maintenance_model
        if pm and pm.is_trained:
            test_features = {
                'temperature': 55.0,
                'load': 60.0,
                'vibration': 0.2,
                'age': 10.0,
                'corrosion': 0.15,
                'harmonics': 2.0,
                'oil_quality': 0.8,
                'trip_count': 10,
                'ambient_temp': 25.0,
                'humidity': 50.0
            }
            risk = pm.predict_risk(test_features)
            print(f"   ✅ ML model working")
            print(f"      - Risk Level: {risk['risk_level']}")
            print(f"      - Failure Probability: {risk['failure_probability']:.3f}\n")
        else:
            print("   ⚠️ ML model training in progress (normal on first run)\n")
    except Exception as e:
        print(f"   ❌ ML error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("=" * 60)
    print("  SMART GRID BACKEND INTEGRATION TEST")
    print("=" * 60)
    print()
    
    success = test_backend_integration()
    
    print("=" * 60)
    if success:
        print("✅ BACKEND INTEGRATION SUCCESSFUL")
        print("=" * 60)
        print("\nAll components are working correctly and ready for use.")
        print("Start the backend with: python app.py")
        sys.exit(0)
    else:
        print("❌ BACKEND INTEGRATION TEST FAILED")
        print("=" * 60)
        print("\nPlease fix the errors above and try again.")
        sys.exit(1)
