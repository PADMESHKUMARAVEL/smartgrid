# Smart Grid System - Updates Changelog

## Version 2.1 - Named Nodes & Optimized Paths (February 28, 2026)

### 🔄 Major Changes

#### Backend Updates

**datagenerate.py**
- Replaced generic node IDs with named substations and generators:
  - **Generators:** North Power Plant (150 MW), South Thermal Station (140 MW)
  - **Substations:** 6 named stations with fixed constant power demands:
    - Downtown Substation: 45 MW
    - Uptown Substation: 52 MW
    - Industrial Zone Station: 75 MW
    - Residential Hub: 38 MW
    - Shopping Complex Node: 41 MW
    - University Campus Hub: 48 MW
- Changed power demands from random to CONSTANT per station
- Power demand updates every second (simulation cycle)
- Node metadata now includes names and types

**gridoptimization.py**
- Added `setup_named_nodes()` method to configure named infrastructure
- Updated `update_grid_state()` to use constant demands from substation definitions
- Enhanced `train_episode()` to return detailed path information with:
  - Load/generator node IDs and names
  - Actual power demand at each substation
  - Calculated loss per path
  - Full path node sequence
- New `optimized_paths` list to store current optimization results
- Path data structure now includes:
  ```
  {
    "load_node": 2,
    "load_name": "Downtown Substation",
    "generator_node": 0,
    "generator_name": "North Power Plant",
    "path": [2, 4, 0],
    "demand": 45,
    "loss": 0.235
  }
  ```

**app.py**
- Updated `/api/grid/state` endpoint to include node names
- Modified `/api/grid/optimize` to return detailed path information
- Updated `/api/grid/paths` to include demand and loss per path
- Enhanced `/api/grid/node/<id>` to display node names and neighbor information
- All responses now serialize node names along with IDs

#### Frontend Updates

**Dashboard.jsx**
- Added import for new `OptimizedPaths` component
- Integrated optimized paths display in dashboard flow

**GridMap.jsx**
- Updated node labels to use actual station names
- Dynamic positioning of 8 named substations and 2 generators
- Node colors: Green for generators, Blue for substations
- Enhanced visualization with station names displayed below nodes

**OptimizedPaths.jsx** (NEW)
- Brand new component showing optimized power routes in tabular format
- Displays for each route:
  - Source substation name and ID
  - Destination generator name and ID
  - Power demand (MW)
  - Routing path (node sequence)
  - Calculated transmission loss
  - Optimization status (Optimal/High Loss)
- Summary statistics:
  - Total demand across all routes
  - Network-wide transmission loss %
  - Average asset risk score
- Color-coded paths for easy identification
- Real-time updates every 5 seconds

**gridOptimizationService.js**
- Updated `formatPathsForVisualization()` to handle new path structure with names
- Enhanced caching strategy for named data

### 📊 Data Structure Changes

#### Node Representation (Before → After)
```javascript
// Before
{ id: 2, type: "load", demand: 45 }

// After
{ 
  id: 2, 
  name: "Downtown Substation",
  type: "substation", 
  demand: 45,
  voltage: 230.15
}
```

#### Path Representation (Before → After)
```javascript
// Before
{ load: 2, generator: 0, path: [2, 4, 0] }

// After
{
  load_node: 2,
  load_name: "Downtown Substation",
  generator_node: 0,
  generator_name: "North Power Plant",
  path: [2, 4, 0],
  demand: 45,
  loss: 0.235
}
```

#### Power Demand (Before → After)
```javascript
// Before - Random every update
demand: Math.random(20, 80) // MW

// After - Constant per station (updates every second)
Downtown: 45 MW (constant)
Uptown: 52 MW (constant)
Industrial: 75 MW (constant)
// ... etc
```

### 🎯 Key Features

1. **Named Infrastructure**
   - All stations have meaningful names
   - Easier identification in monitoring
   - Human-readable in dashboards and reports

2. **Constant Power Demands**
   - Each substation has fixed power requirement
   - More realistic modeling of actual grid loads
   - Enables better optimization for predictable patterns

3. **Detailed Path Optimization**
   - Shows which generator serves each substation
   - Displays exact routing path (node sequence)
   - Calculates loss per route for transparency
   - Updates optimized paths every 5 seconds

4. **Enhanced Visualization**
   - Grid map shows real station names
   - Optimized paths table shows complete routing details
   - Individual route analysis available
   - Status indicators for each route (Optimal/High Loss)

### 📈 Metrics & Analytics

**New Metrics Added:**
- Per-route transmission loss (MW)
- Per-substation demand tracking
- Generator-to-substation mapping
- Path efficiency score

**Optimized Paths Display Shows:**
- Total network demand (sum of all substations)
- Aggregate transmission loss %
- Average asset risk across all paths
- Number of active optimized routes

### 🔧 Configuration

**Substations (Fixed Demands):**
```python
SUBSTATIONS = {
    2: {"name": "Downtown Substation", "constant_demand": 45, "type": "substation"},
    3: {"name": "Uptown Substation", "constant_demand": 52, "type": "substation"},
    4: {"name": "Industrial Zone Station", "constant_demand": 75, "type": "substation"},
    5: {"name": "Residential Hub", "constant_demand": 38, "type": "substation"},
    6: {"name": "Shopping Complex Node", "constant_demand": 41, "type": "substation"},
    7: {"name": "University Campus Hub", "constant_demand": 48, "type": "substation"}
}
```

**Generators:**
```python
GENERATORS = {
    0: {"name": "North Power Plant", "base_power": 150, "type": "generator"},
    1: {"name": "South Thermal Station", "base_power": 140, "type": "generator"}
}
```

### 🚀 How It Works Now

1. **Initialization:**
   - System creates 8-node grid with 2 generators + 6 substations
   - Each station is pre-configured with power characteristics

2. **Per Update Cycle (5 seconds):**
   - Frontend requests grid state from `/api/grid/state`
   - Backend updates grid with current conditions
   - System runs one optimization episode
   - Algorithm decides optimal generator for each substation demand
   - Paths are calculated using A* algorithm with loss + risk weighting
   - Results returned with full names and path details

3. **Display:**
   - Dashboard shows grid map with named stations
   - Optimized paths table displays each route's details
   - Color-coded paths in visualization

### 📋 API Response Example

```json
{
  "paths": [
    {
      "load_node": 2,
      "load_name": "Downtown Substation",
      "generator_node": 0,
      "generator_name": "North Power Plant",
      "path": [2, 4, 0],
      "demand": 45,
      "loss": 0.235
    },
    {
      "load_node": 3,
      "load_name": "Uptown Substation",
      "generator_node": 1,
      "generator_name": "South Thermal Station",
      "path": [3, 1],
      "demand": 52,
      "loss": 0.28
    }
  ],
  "loss_percent": 2.15,
  "avg_risk": 0.342,
  "total_demand": 297
}
```

### 🔄 Update Pattern

**Before:** Demands varied randomly each cycle
**After:** 
- Downtown always needs 45 MW
- Uptown always needs 52 MW
- System updates every second
- Optimization adapts to constant but realistic loads

### ✅ Testing the Changes

1. **Verify Named Nodes:**
   - Open dashboard
   - Hover over grid nodes → See station names

2. **Check Constant Demands:**
   - Watch Optimized Paths table
   - Downtown Substation should always show 45 MW
   - Demands remain consistent across updates

3. **View Optimized Routes:**
   - Check "Optimized Power Routes" table
   - Each row shows: from station → to generator → path
   - Loss calculated for each route

4. **Monitor Path Selection:**
   - Industrial Zone may route to different generators based on current conditions
   - Paths update every 5 seconds
   - Algorithm balances loss minimization with risk management

### 🐛 Bug Fixes
- Fixed demand calculation in loss metrics
- Corrected node type comparisons ("substation" vs "load")
- Improved path serialization for API responses

### ⚡ Performance
- Constant demands reduce calculation overhead
- More efficient path caching
- Faster optimization due to predictable patterns

### 📚 Documentation
- Updated README.md with new architecture
- API_DOCUMENTATION.md reflects new path structure
- INTEGRATION_GUIDE.md has setup instructions

### 🔮 Future Enhancements
- Time-varying demands (morning peak, evening peak)
- Seasonal load adjustments
- Real SCADA integration with actual meter readings
- Multi-period optimization (plan ahead)
- Demand response programs
- Microgrids and distributed generation
- Battery storage optimization

---

**Status:** ✅ Production Ready  
**Last Updated:** February 28, 2026  
**Version:** 2.1.0
