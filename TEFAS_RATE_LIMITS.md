# TEFAS API Rate Limits & Strategy

## RapidAPI Free Plan Limits
- **10 requests/day** (hard limit)
- **1000 requests/hour** (rate limit)

## Current Implementation

### Ticker Sync
**Strategy:** Full sync via RapidAPI (3,285 funds)
- ✅ `/api/v1/funds` = 1 request → ALL 3285 funds
- ✅ Daily syncs (11:00 + 17:00) = only 2 requests/day
- ✅ Complete coverage of all TEFAS funds
- ✅ ~10 seconds per sync

**Rate Limit Math:**
```
Daily Budget: 10 requests/day
- 2 requests: Ticker sync (11:00, 17:00)
- 8 requests: Price fetching (as needed)
= Perfect fit for our use case!
```

### Price Fetching
**Strategy:** GitHub primary, RapidAPI fallback

1. **GitHub intermittent API** (Primary)
   - Source: https://github.com/emirhalici/tefas_intermittent_api
   - ✅ FREE - no rate limits
   - ✅ Updated daily at 12PM Turkey time
   - ✅ Includes ~50-100 popular funds
   - ✅ Cached for 1 hour in Next.js
   - Data: https://raw.githubusercontent.com/emirhalici/tefas_intermittent_api/data/fund_data.json

2. **RapidAPI TEFAS** (Fallback)
   - Only used if fund not in GitHub data
   - ⚠️ Uses from remaining 8 requests/day
   - ✅ Real-time data
   - ✅ All 3285 funds available
   - Cached for 4 hours to reduce calls

**Expected Daily Usage:**
- Ticker sync: 2 requests (scheduled)
- Price fetch: ~3-5 requests (user-triggered)
- Total: ~5-7 requests/day (within 10/day limit)

## Usage Recommendations

### For Development
- Use GitHub API for price testing (no limits)
- Manual ticker sync only when needed
- Monitor daily usage in RapidAPI dashboard

### For Production
- Scheduled sync: 11:00 and 17:00 daily (2 requests)
- Price fetch: GitHub primary, RapidAPI fallback
- Expected total: 5-7 requests/day (safely under 10/day)

## Monitoring
Check RapidAPI dashboard: https://rapidapi.com/serifcolakel-wlDXdMYbT/api/tefas-api/playground

## Upgrade Path
If 10 requests/day becomes insufficient:
- **Pro Plan**: $10/month → 5000 requests/month
- **Ultra Plan**: $25/month → 100,000 requests/month

## Alternative: Self-hosted TEFAS Scraper
Consider forking: https://github.com/emirhalici/tefas_intermittent_api
- Run own GitHub Actions scraper
- Customize fund list
- No API costs
