# Smart Grid API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Currently no authentication required. Add before production deployment.

## Response Format
All responses use JSON format with consistent error handling.

### Success Response
```json
{
  "data": {},
  "timestamp": 1645000000.123,
  "status": "success"
}
```

### Error Response
```json
{
  "error": "Error message",
  "timestamp": 1645000000.123,
  "status": "error"
}
```

## Endpoints

### 1. Health Check
**GET** `/api/health`

Check if backend API is running.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1645000000.123
}
```

---

### 2. Get Grid State
**GET** `/api/grid/state`

Get complete grid topology with all nodes and edges.

**Response:**
```json
{
  "timestamp": 1645000000.123,
  "nodes": [
    {
      "id": 0,
      "type": "generator",
      "demand": 0,
      "voltage": 235.5,
      "degree": 3
    },
    {
      "id": 1,
      "type": "generator",
      "demand": 0,
      "voltage": 234.2,
      "degree": 3
    },
    {
      "id": 2,
      "type": "load",
      "demand": 45,
      "voltage": 230.1,
      "degree": 2
    }
  ],
  "edges": [
    {
      "source": 0,
      "target": 2,
      "resistance": 0.0029,
      "current": 145.2,
      "temperature": 48.5,
      "power_flow": 33.8,
      "risk": 0.35
    }
  ],
  "metrics": {
    "total_demand": 274,
    "total_nodes": 8,
    "total_edges": 12,
    "average_risk": 0.35,
    "generators": 2
  },
  "currentEpisodeResult": {
    "loss_percent": 2.15,
    "reward": -2.15,
    "avg_risk": 0.35,
    "paths": []
  }
}
```

**Error Cases:**
- 500: Grid not initialized

---

### 3. Run Grid Optimization
**POST** `/api/grid/optimize`

Trigger one optimization episode. Updates grid state, calculates optimal paths, updates loss metrics.

**Request Body:**
```json
{}  # No parameters required
```

**Response:**
```json
{
  "success": true,
  "episode_result": {
    "loss_percent": 2.08,
    "reward": -2.08,
    "avg_risk": 0.342,
    "paths": [
      {
        "load": 2,
        "generator": 0,
        "path": [2, 4, 0]
      },
      {
        "load": 3,
        "generator": 1,
        "path": [3, 1]
      }
    ]
  },
  "timestamp": 1645000000.123
}
```

**Error Cases:**
- 500: Optimization failed (check backend logs)

---

### 4. Get Optimized Paths
**GET** `/api/grid/paths`

Get the most recent optimized paths from the last optimization episode.

**Response:**
```json
{
  "paths": [
    {
      "load": 2,
      "generator": 0,
      "path": [2, 4, 0]
    },
    {
      "load": 3,
      "generator": 1,
      "path": [3, 1]
    },
    {
      "load": 5,
      "generator": 1,
      "path": [5, 7, 1]
    }
  ],
  "loss_percent": 2.08,
  "avg_risk": 0.342,
  "timestamp": 1645000000.123
}
```

**Error Cases:**
- 404: No optimization results available yet

---

### 5. Get Risk Analysis
**GET** `/api/grid/risk`

Get comprehensive risk analysis for all grid assets.

**Response:**
```json
{
  "nodes": [
    {
      "id": 5,
      "type": "load",
      "average_neighbor_risk": 0.45,
      "max_neighbor_risk": 0.52,
      "neighbors": 3
    },
    {
      "id": 0,
      "type": "generator",
      "average_neighbor_risk": 0.38,
      "max_neighbor_risk": 0.48,
      "neighbors": 3
    }
  ],
  "edges": [
    {
      "source": 0,
      "target": 2,
      "risk": 0.52,
      "temperature": 52.1,
      "current": 178.3
    },
    {
      "source": 1,
      "target": 5,
      "risk": 0.48,
      "temperature": 49.8,
      "current": 165.2
    }
  ],
  "timestamp": 1645000000.123
}
```

---

### 6. Get Loss Metrics
**GET** `/api/grid/loss`

Get transmission loss history and metrics.

**Response:**
```json
{
  "history": [2.15, 2.12, 2.08, 2.10, 2.05, ...],
  "risk_history": [0.35, 0.346, 0.342, 0.344, 0.341, ...],
  "current_loss_percent": 2.05,
  "current_avg_risk": 0.341,
  "best_loss": 1.85,
  "timestamp": 1645000000.123
}
```

**Data Points:**
- `history`: Array of last 100 loss percentages
- `risk_history`: Array of last 100 average risk scores
- `current_loss_percent`: Latest transmission loss
- `current_avg_risk`: Latest average asset risk
- `best_loss`: Minimum loss achieved during training

---

### 7. Get Node Details
**GET** `/api/grid/node/<node_id>`

Get detailed information about a specific node.

**Parameters:**
- `node_id` (integer): Node ID (0-7 for default grid)

**Response:**
```json
{
  "id": 2,
  "type": "load",
  "demand": 45,
  "voltage": 230.1,
  "degree": 3,
  "neighbors": [0, 1, 4],
  "neighbor_details": [
    {
      "node_id": 0,
      "type": "generator",
      "resistance": 0.0029,
      "current": 145.2,
      "temperature": 48.5,
      "risk": 0.35
    },
    {
      "node_id": 1,
      "type": "generator",
      "resistance": 0.0031,
      "current": 132.1,
      "temperature": 50.2,
      "risk": 0.38
    },
    {
      "node_id": 4,
      "type": "load",
      "resistance": 0.0027,
      "current": 89.3,
      "temperature": 44.1,
      "risk": 0.28
    }
  ]
}
```

**Error Cases:**
- 404: Node not found

---

### 8. Get Grid Statistics
**GET** `/api/grid/statistics`

Get comprehensive statistical summary of entire grid.

**Response:**
```json
{
  "voltage": {
    "mean": 230.5,
    "std": 2.3,
    "min": 225.1,
    "max": 235.8
  },
  "demand": {
    "total": 274,
    "mean": 38.2,
    "max": 52,
    "min": 35
  },
  "risk": {
    "mean": 0.341,
    "max": 0.52,
    "min": 0.15,
    "high_risk_edges": 2
  },
  "temperature": {
    "mean": 49.2,
    "max": 62.1,
    "min": 42.3
  },
  "current": {
    "mean": 156.3,
    "max": 185.2,
    "min": 78.1
  },
  "timestamp": 1645000000.123
}
```

---

## Common Response Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Successful API call |
| 404 | Not Found | Requested resource doesn't exist |
| 500 | Server Error | Backend error occurred |

## Rate Limiting

- No built-in rate limiting (recommended for production)
- Typical response time: 50-200ms
- Optimize requests: cache when possible

## Caching Strategy

**Frontend should cache:**
- Grid state for 2-5 seconds
- Risk analysis for 10 seconds
- Loss metrics for 5 seconds

**Frontend should NOT cache:**
- Optimization results (always fetch fresh)
- Node details (on-demand only)

## Example Usage

### Fetch Grid and Optimize
```javascript
// Get current state
const state = await fetch('/api/grid/state');
const gridData = await state.json();

// Run optimization
const optResponse = await fetch('/api/grid/optimize', {
  method: 'POST'
});
const optimization = await optResponse.json();

// Get loss metrics
const metrics = await fetch('/api/grid/loss');
const metricsData = await metrics.json();
```

### Monitor Risk
```javascript
const riskResponse = await fetch('/api/grid/risk');
const riskData = await riskResponse.json();

// Find high-risk edges
const highRiskEdges = riskData.edges.filter(e => e.risk > 0.5);
```

## Testing with cURL

```bash
# Health check
curl http://localhost:5000/api/health

# Get grid state
curl http://localhost:5000/api/grid/state

# Run optimization
curl -X POST http://localhost:5000/api/grid/optimize

# Get node 2 details
curl http://localhost:5000/api/grid/node/2

# Get loss metrics
curl http://localhost:5000/api/grid/loss
```

## Testing with Postman

1. Import as Postman Collection:
2. Create requests for each endpoint
3. Use environment variables for base URL
4. Test auto-refresh every 5 seconds

## Future Enhancements

- [ ] Authentication & authorization
- [ ] Rate limiting
- [ ] Response compression
- [ ] Pagination for large datasets
- [ ] GraphQL alternative
- [ ] WebSocket real-time updates
- [ ] Batch operations
- [ ] Data export (CSV/Excel)

---

**Last Updated:** February 2026
