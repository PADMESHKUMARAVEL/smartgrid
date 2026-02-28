# Named Substations & Optimized Paths - Quick Reference

## Grid Infrastructure

### Power Generators (2 units)
| ID | Name | Base Power |
|----|------|-----------|
| 0 | North Power Plant | 150 MW |
| 1 | South Thermal Station | 140 MW |

### Power Substations (6 units)
| ID | Name | Constant Demand |
|----|------|-----------------|
| 2 | Downtown Substation | 45 MW |
| 3 | Uptown Substation | 52 MW |
| 4 | Industrial Zone Station | 75 MW |
| 5 | Residential Hub | 38 MW |
| 6 | Shopping Complex Node | 41 MW |
| 7 | University Campus Hub | 48 MW |

**Total Network Demand:** 299 MW

## What Changed?

### Power Demands
```
BEFORE: Random (20-80 MW per update)
AFTER:  Fixed at each station (constant every second)
```

### Node Names
```
BEFORE: "Node 2"
AFTER:  "Downtown Substation"
```

### Paths Shown
```
BEFORE: Load 2 → Generator 0 via [2, 4, 0]
AFTER:  Downtown Substation → North Power Plant 
        via [2, 4, 0] with 45 MW demand, 0.235 MW loss
```

## Dashboard Components

### 1. Grid Map
- Shows 8 stations with names
- Generators in green, substations in blue
- Optimized paths highlighted in different colors
- Click any node to see details

### 2. Optimized Power Routes Table
- Shows every active power route
- Columns:
  - **From Station:** Source substation
  - **To Generator:** Destination generator
  - **Demand:** Power needed (MW)
  - **Path:** Route through grid (node sequence)
  - **Loss:** Transmission loss for this route
  - **Status:** Optimal or High Loss

### 3. Summary Statistics
- **Total Demand:** Sum of all substation demands (299 MW)
- **Network Loss:** Total transmission loss %
- **Average Risk:** Risk score for all transmission lines

## How Optimization Works

### Every 5 Seconds:
1. Check each substation's constant demand
2. Decide which generator should serve it
3. Calculate optimal path to generator
4. Route to minimize loss + manage risk
5. Update dashboard with new routes

### Path Selection Factors:
- **Loss Minimization:** Prefers shorter paths
- **Risk Management:** Avoids high-risk transmission lines
- **Availability:** Ensures generator capacity covers demand

### Example Optimization:
```
Downtown Substation (45 MW demand)
  └─ Chooses: North Power Plant
     └─ Best Path: [2, 4, 0]
     └─ Calculated Loss: 0.235 MW
     └─ Status: Optimal ✓

Industrial Zone Station (75 MW demand)
  └─ Chooses: South Thermal Station
     └─ Best Path: [4, 1]
     └─ Calculated Loss: 0.512 MW
     └─ Status: High Loss (due to high demand)
```

## API Endpoints for Paths

### Get All Optimized Paths
```
GET /api/grid/paths
```
Response includes all active paths with names and losses

### Get Grid State with Names
```
GET /api/grid/state
```
Returns all nodes with:
- id, name, type, demand, voltage

### Get Node Details
```
GET /api/grid/node/2
```
Returns detailed info for "Downtown Substation"

## Real-Time Updates

### Update Frequency
- **Grid State:** Every 5 seconds
- **Optimized Paths:** Every 5 seconds
- **Metrics:** Recalculated each update

### What Updates
- ✓ Optimized paths (may change)
- ✓ Transmission loss (recalculated)
- ✓ Voltages (fluctuation ±5%)
- ✗ Demands (stay constant)
- ✗ Generator names/capacity (fixed)
- ✗ Substation names/capacity (fixed)

## Key Metrics

### Per Route
| Metric | Range | Unit |
|--------|-------|------|
| Demand | 38-75 | MW |
| Loss | 0.1-2.0 | MW |
| Path Length | 1-5 | hops |

### Network-Wide
| Metric | Range | Unit |
|--------|-------|------|
| Total Demand | 299 | MW |
| Total Loss | 1.0-3.5 | % |
| Avg Risk | 0.30-0.50 | score |

## Monitoring the System

### Good Signs ✓
- Loss % stable (1.5-2.5%)
- Paths don't change unnecessarily
- All routes marked "Optimal"
- Risk score below 0.4

### Issues to Watch ⚠️
- Loss % rising (>3%)
- Frequent path changes (every update)
- Routes marked "High Loss"
- Risk score above 0.5

## Customization

### Change a Substation Demand
Edit `backend/datagenerate.py`:
```python
SUBSTATIONS = {
    2: {"name": "Downtown Substation", "constant_demand": 50, ...}  # Was 45
}
```

### Add a New Station
Edit `backend/gridoptimization.py`:
```python
self.substation_names = {
    ...
    8: {"name": "New Station", "demand": 40},
}
```

### Adjust Generator Capacity
Edit `backend/datagenerate.py`:
```python
GENERATORS = {
    0: {"name": "North Power Plant", "base_power": 200, ...}  # Was 150
}
```

## Example Scenarios

### Scenario 1: Industrial Zone Needs More Power
```
Industrial Zone Station requests 75 MW (highest demand)
Optimizer thinks: "75 MW is high, need most direct path"
Decision: Route to South Thermal Station via [4, 1]
Result: Minimal loss due to short path
```

### Scenario 2: Multiple Demands from Same Area
```
Downtown (45 MW) and Uptown (52 MW) both need power
Optimizer distributes: one to North, one to South
Result: Balanced load across both generators
```

### Scenario 3: High-Risk Transmission Line
```
A transmission line between nodes has high risk (0.8)
Optimizer detects this
Decision: Route around it, even if longer
Result: Slightly higher loss, but avoids risky line
```

## Troubleshooting

### Problem: Demands Keep Changing
**Solution:** Demands are constant. If they change, check backend logs.

### Problem: Paths Change Every Update
**Solution:** Normal during optimization. If excessive, check risk scores.

### Problem: All Demand Going to One Generator
**Solution:** Other generator may be overloaded or risky. Monitor risk scores.

### Problem: Loss % Too High (>5%)
**Solution:** 
- Check if Industrial Zone (75 MW) is being served
- Verify transmission line conditions
- Consider optimizing network topology

## Commands to Monitor

### Check Current Demands
```bash
curl http://localhost:5000/api/grid/state | grep '"demand"'
```

### View Optimized Paths
```bash
curl http://localhost:5000/api/grid/paths | jq '.paths'
```

### Get Loss Metrics
```bash
curl http://localhost:5000/api/grid/loss
```

### Check Specific Station
```bash
curl http://localhost:5000/api/grid/node/4
```

---

**Version:** 2.1  
**Last Updated:** February 28, 2026
