# 🔌 Price API Endpoints Documentation

**Version**: 1.0.0  
**Last Updated**: 2025-10-13  
**Base URL**: `/api/prices`

## Overview

Price API provides endpoints for managing real-time asset price synchronization using Borsa MCP integration.

---

## Authentication

All endpoints require authentication (to be implemented based on your auth system).

---

## Endpoints

### 1. Manual Price Sync

Manually trigger price synchronization for selected assets.

**Endpoint**: `POST /api/prices/sync`

#### Request Body

```json
{
  "asset_types": ["gold", "stock", "crypto"],  // Optional
  "asset_ids": ["uuid-1", "uuid-2"],           // Optional  
  "force": false,                               // Optional, bypass market hours
  "max_age": 3600000                           // Optional, ms (1 hour)
}
```

#### Response (Success)

```json
{
  "success": true,
  "message": "Price synchronization completed",
  "data": {
    "log_id": "abc-123-def",
    "total_assets": 25,
    "successful": 23,
    "failed": 2,
    "skipped": 10,
    "duration_ms": 8542,
    "errors": [
      {
        "assetId": "uuid-1",
        "error": "Asset not found in Borsa MCP"
      }
    ]
  }
}
```

#### Response (Error)

```json
{
  "success": false,
  "error": "Invalid request parameters",
  "details": [...]
}
```

#### Status Codes

- `200 OK`: Sync completed successfully
- `400 Bad Request`: Invalid parameters
- `500 Internal Server Error`: Sync failed

---

### 2. Health Check

Check if Price API is operational.

**Endpoint**: `GET /api/prices/sync`

#### Response

```json
{
  "success": true,
  "message": "Price sync API is operational",
  "endpoints": {
    "sync": "POST /api/prices/sync"
  }
}
```

---

## Asset Types

Supported asset types for synchronization:

| Asset Type | Description | Market | Sync Interval |
|------------|-------------|--------|---------------|
| `gold` | Gold (Gram, Quarter, Half, Full) | Dovizcom | Hourly |
| `silver` | Silver | Dovizcom | Hourly |
| `stock` | BIST stocks | BIST | Hourly |
| `fund` | TEFAS funds | TEFAS | Daily (11:00) |
| `crypto` | Cryptocurrencies | BtcTurk | Hourly (24/7) |
| `currency` | Currencies (USD, EUR, GBP) | Dovizcom | Hourly |
| `commodity` | Commodities (Oil, Gas) | Dovizcom | Hourly |

---

## Market Hours

Price synchronization respects market hours:

### Weekdays

- **BIST Stocks**: 09:30 - 18:00
- **TEFAS Funds**: 11:00 only
- **Gold/Silver/Currency**: 09:00 - 18:00
- **Crypto**: 24/7

### Weekends

- **All assets**: Closed (except crypto 24/7)

Use `force: true` to bypass market hours check.

---

## Rate Limiting

- **Manual Sync**: 10 requests per minute per user
- **Automatic Sync**: Managed by cron service

---

## Error Handling

### Common Errors

#### Market Closed

```json
{
  "success": false,
  "error": "Market is closed for asset type: stock"
}
```

**Solution**: Wait for market hours or use `force: true`

#### Borsa MCP Unavailable

```json
{
  "success": false,
  "error": "Borsa MCP service unavailable"
}
```

**Solution**: Check Borsa MCP installation and retry

#### Asset Not Found

```json
{
  "success": false,
  "error": "Asset not found in Borsa MCP: XYZ123"
}
```

**Solution**: Verify asset symbol/code is correct

---

## Usage Examples

### Example 1: Sync All Gold Assets

```bash
curl -X POST http://localhost:3000/api/prices/sync \
  -H "Content-Type: application/json" \
  -d '{"asset_types": ["gold"]}'
```

### Example 2: Sync Specific Assets

```bash
curl -X POST http://localhost:3000/api/prices/sync \
  -H "Content-Type: application/json" \
  -d '{
    "asset_ids": ["asset-uuid-1", "asset-uuid-2"],
    "force": true
  }'
```

### Example 3: Force Sync All Assets

```bash
curl -X POST http://localhost:3000/api/prices/sync \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```

---

## Integration Guide

### Frontend Integration

```typescript
// components/sync-prices-button.tsx
async function syncPrices() {
  const response = await fetch('/api/prices/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      asset_types: ['gold', 'stock']
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log(`Synced ${data.data.successful} assets`);
  }
}
```

### Backend Integration

```typescript
// lib/scheduler.ts
import { syncAssetPrices } from '@/lib/services/price-sync-service';

// Schedule hourly sync
setInterval(async () => {
  const result = await syncAssetPrices({
    assetTypes: ['gold', 'silver', 'stock', 'crypto', 'currency']
  });
  console.log(`Sync completed: ${result.successful} successful`);
}, 60 * 60 * 1000); // 1 hour
```

---

## Troubleshooting

### Borsa MCP Not Installed

```bash
# Install Borsa MCP
uvx --from git+https://github.com/saidsurucu/borsa-mcp borsa-mcp

# Verify installation
uvx borsa-mcp --help
```

### Python/UV Not Found

```bash
# Install Python 3.11+
sudo apt install python3.11

# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Sync Taking Too Long

- Check Borsa MCP timeout configuration
- Reduce number of assets synced at once
- Check network connectivity

---

## Performance Tips

1. **Batch Syncing**: Sync assets in batches of 10-20
2. **Market Hours**: Only sync during market hours to reduce failures
3. **Cache TTL**: Set appropriate `max_age` to avoid unnecessary syncs
4. **Parallel Processing**: Use cron for background syncs

---

## Changelog

### v1.0.0 (2025-10-13)
- Initial release
- Manual sync endpoint
- Health check endpoint
- Market hours validation
- Error handling

---

## Support

For issues or questions:
- GitHub: https://github.com/saidsurucu/borsa-mcp
- Documentation: See PRICE_API_INTEGRATION.md

---

**Status**: ✅ Implemented  
**Next Steps**: Add cron service, implement additional endpoints (latest, history)
