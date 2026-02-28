# Smart Grid Backend-Frontend Integration Guide

## Overview

This guide explains how to set up and run the integrated Smart Grid system with backend data generation and frontend optimization visualization.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                       │
│  - Dashboard with grid visualization                     │
│  - Real-time metrics & alerts                           │
│  - Optimization results display                         │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP/REST
┌──────────────────▼──────────────────────────────────────┐
│          Backend API Server (Flask)                      │
│  - Grid data generation (datagenerate.py)                │
│  - Grid optimization (gridoptimization.py)              │
│  - Path optimization with risk management               │
│  - Real-time SCADA data                                 │
└──────────────────────────────────────────────────────────┘
```

## Backend Setup

### Prerequisites
- Python 3.8+
- pip (Python package manager)

### Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   # Activate it:
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

### Running the Backend Server

```bash
python app.py
```

The API server will start on `http://localhost:5000`

### Available API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/grid/state` | GET | Current grid state with nodes and edges |
| `/api/grid/optimize` | POST | Run optimization episode |
| `/api/grid/paths` | GET | Get optimized paths from latest optimization |
| `/api/grid/risk` | GET | Risk analysis for all assets |
| `/api/grid/loss` | GET | Transmission loss metrics |
| `/api/grid/node/<id>` | GET | Get specific node details |
| `/api/grid/statistics` | GET | Comprehensive grid statistics |

## Frontend Setup

### Prerequisites
- Node.js 14+
- npm or yarn

### Installation

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   # Copy the example file
   cp .env.example .env
   ```

   Edit `.env` and set the backend URL (default is already set for localhost):
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

### Running the Frontend

**Development mode:**
```bash
npm start
```

The frontend will open at `http://localhost:3000`

**Production build:**
```bash
npm run build
```

## Integration Features

### 1. Real-Time Data Generation
- Backend generates realistic SCADA data for grid nodes
- Includes voltage fluctuations, demand variations, and thermal effects
- Data updates every 5 seconds

### 2. Grid Optimization
- Runs automatic optimization episodes for power routing
- Minimizes transmission loss while managing asset risk
- Uses Reinforcement Learning (REINFORCE) policy
- Finds optimal paths considering both loss and risk

### 3. Dashboard Integration
- Displays real-time grid state with node positions and connections
- Shows optimized power routing paths (highlighted in different colors)
- Displays key metrics:
  - Current load (MW)
  - Transmission loss percentage
  - Asset risk score
  - Active alerts

### 4. Loss Metrics Tracking
- Historical tracking of transmission loss over time
- Best loss achieved during training
- Average asset risk metrics
- Real-time comparison with target values

### 5. Risk Analysis
- Edge (transmission line) risk scores
- Temperature monitoring
- Current overload detection
- Node-level risk aggregation

## Data Flow

### Startup
1. Backend initializes grid with 8 nodes (2 generators, 6 loads)
2. Runs continuous data generation in background thread
3. API server listens on port 5000

### Refresh Cycle (5 seconds)
1. Frontend requests `/api/grid/state` endpoint
2. Backend provides current grid state
3. Frontend triggers optimization via `/api/grid/optimize`
4. Optimization results sent back with optimized paths
5. Dashboard updates with new visualization

### On-Demand Requests
- Risk analysis requested when user opens risk panel
- Node details fetched when user clicks on grid node
- Loss metrics updated with each optimization episode

## Environment Variables

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api    # Backend API URL
REACT_APP_DEBUG=false                           # Enable debug console logs
REACT_APP_ENV=development                       # Environment (development/production)
```

### Backend (env variables optional)
```
FLASK_ENV=development                           # Flask environment
FLASK_DEBUG=False                               # Debug mode
```

## Troubleshooting

### Backend Issues

**Port Already in Use:**
```bash
# Kill process on port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:5000 | xargs kill -9
```

**Import Errors:**
- Ensure all packages in requirements.txt are installed
- Check Python version: `python --version` (should be 3.8+)

**Grid Not Initializing:**
- Verify networkx is properly installed
- Check that datagenerate.py and gridoptimization.py are in the backend directory

### Frontend Issues

**API Connection Failed:**
- Verify backend server is running on port 5000
- Check REACT_APP_API_URL in .env matches backend address
- Look for CORS errors in browser console

**Components Not Updating:**
- Force refresh: Ctrl+Shift+R (hard refresh)
- Check browser DevTools → Network tab for API responses
- Verify backend is returning valid JSON

**Build Errors:**
```bash
# Clear node cache
rm -rf node_modules package-lock.json
npm install
npm start
```

## Performance Optimization

### Backend
- Optimization runs in background thread (non-blocking)
- Grid state updates cached for 5 seconds
- Consider increasing update interval in Dashboard.jsx for slower systems

### Frontend
- Components use memoization to prevent unnecessary re-renders
- SVG connections dynamically generated based on grid state
- Chart data limited to last 24 hours of metrics

## Production Deployment

### Backend
```bash
# Install production dependencies
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Frontend
```bash
# Build optimized production bundle
npm run build

# Deploy the 'build' folder to your web server
# Or use: npm install -g serve && serve -s build
```

## Security Notes

- CORS is enabled to allow frontend-backend communication
- Disable debug mode in production: set FLASK_DEBUG=False
- Use environment variables for sensitive configurations
- Validate all API inputs in production

## Support & Debugging

To get detailed logs:

**Backend:**
- Check console output from `python app.py`
- Add print statements for debugging
- Use Flask debug mode in development

**Frontend:**
- Open DevTools: F12 or Ctrl+Shift+I
- Check Network tab for API calls
- Use console for JavaScript errors
- Add React DevTools browser extension for component inspection

## Next Steps

1. Customize grid topology by modifying GENERATORS and NUM_NODES in gridoptimization.py
2. Adjust optimization parameters (learning rate, risk weight) in SmartGridOptimizer class
3. Implement real SCADA data source instead of simulation
4. Add database for historical data persistence
5. Implement user authentication and multi-tenancy
