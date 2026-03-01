# Quick Start Guide - Backend Integration

## 🚀 Start the Backend in 30 Seconds

### Windows Users:
```bash
run-backend.bat
```

### Linux/Mac Users:
```bash
chmod +x run-backend.sh
./run-backend.sh
```

### Manual Start:
```bash
cd backend
python app.py
```

## ✅ Backend is Ready When You See:

```
============================================================
  ✅ Backend Ready!
============================================================

📡 API Server: http://localhost:5000
```

## 📡 Test the API

Open a new terminal and test:

```bash
# Test health
curl http://localhost:5000/api/health

# Get current grid state
curl http://localhost:5000/api/grid/state

# Get risk analysis
curl http://localhost:5000/api/grid/risk

# Get all statistics
curl http://localhost:5000/api/grid/statistics
```

## 🔗 Frontend Integration

Use these endpoints in your React app:

```javascript
// Connect to backend
const API_URL = 'http://localhost:5000/api';

// Get grid state
fetch(`${API_URL}/grid/state`)
  .then(r => r.json())
  .then(data => console.log(data));

// Get risk analysis
fetch(`${API_URL}/grid/risk`)
  .then(r => r.json())
  .then(data => console.log(data));

// Get optimization results
fetch(`${API_URL}/grid/paths`)
  .then(r => r.json())
  .then(data => console.log(data));
```

## 📊 Available Endpoints

| URL | Purpose |
|-----|---------|
| `/api/health` | System health |
| `/api/grid/state` | Current grid topology |
| `/api/grid/paths` | Optimized power paths |
| `/api/grid/risk` | Risk assessment |
| `/api/grid/loss` | Loss history |
| `/api/grid/statistics` | Comprehensive stats |
| `/api/grid/node/0` | Specific node details |
| `/api/grid/optimize` | Trigger optimization |
| `/api/grid/data-source` | Generation status |

## 🧪 Verify Integration

```bash
cd backend
python test_integration.py
```

Expected output:
```
✅ All modules imported successfully
✅ Optimizer initialized
✅ Data generated
✅ Episode run successfully
✅ ML model working
✅ BACKEND INTEGRATION SUCCESSFUL
```

## 🛑 Stop the Backend

Press `Ctrl+C` in the terminal running the backend.

## 📚 Documentation

- **Detailed Guide**: [BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md)
- **Architecture**: [INTEGRATION_SUMMARY.md](INTEGRATION_SUMMARY.md)
- **Status Report**: [INTEGRATION_CHECKLIST.md](INTEGRATION_CHECKLIST.md)

## ⚙️ Configuration

### Change Port:
Edit `backend/app.py`:
```python
app.run(debug=False, host='0.0.0.0', port=8080)
```

### Change Grid Size:
Edit `backend/app.py`:
```python
optimizer = SmartGridOptimizer(num_nodes=16, num_generators=4)
```

### Change Update Interval:
Edit `backend/app.py`:
```python
time.sleep(1)  # Update every 1 second
```

## 🐛 Troubleshooting

**Error: Port 5000 already in use?**
- Change port in app.py as shown above
- Or stop other services using port 5000

**Error: Module not found?**
- Install dependencies: `pip install -r requirements.txt`
- Re-run: `python app.py`

**Data not updating?**
- Check console for errors
- Verify background thread started
- Restart the backend

## ✨ What's Running

When you start the backend:

1. ✅ Flask server on port 5000
2. ✅ SCADA data generator thread (updates every 3s)
3. ✅ Optimization engine (runs continuously)
4. ✅ ML risk predictor (calculates failure probability)
5. ✅ 9 REST API endpoints (ready for queries)

## 🎯 Next Steps

1. **Backend**: Start it! `run-backend.bat`
2. **Frontend**: Connect to `http://localhost:5000/api`
3. **Monitor**: Visit endpoints to see live data
4. **Optimize**: Watch real-time path optimization

---

**Backend Status**: ✅ FULLY INTEGRATED AND READY

Happy optimizing! 🚀
