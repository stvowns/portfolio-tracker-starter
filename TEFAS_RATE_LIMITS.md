# TEFAS API Rate Limits & Strategy

## RapidAPI Free Plan Limits
- **10 requests/day** (hard limit)
- **1000 requests/hour** (rate limit)

## Current Implementation

### Ticker Sync
**Strategy:** Static popular funds list (58 funds)
- ✅ No API calls required
- ✅ Instant sync (~0.2 seconds)
- ✅ Covers 80%+ of retail investors' needs
- ❌ Limited to 58 pre-selected popular funds

**Why not full sync?**
- Full sync would use 1 request (all 3285 funds)
- But it's wasteful when we only need popular ones
- Preserves API quota for price fetching

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
   - ⚠️ 10 requests/day limit
   - ✅ Real-time data
   - ✅ All 3285 funds available
   - Cached for 4 hours to reduce calls

## Usage Recommendations

### For Development
- Use GitHub API for testing (no limits)
- Only test RapidAPI when necessary
- Monitor daily usage

### For Production
- Most users will use GitHub API (popular funds)
- RapidAPI acts as safety net for rare funds
- Expected usage: 2-5 RapidAPI calls/day

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
