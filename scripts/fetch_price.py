#!/usr/bin/env python3
"""
Borsa MCP Alternative: Direct API Wrapper
Uses requests to fetch prices from Dovizcom, BtcTurk without MCP
"""

import sys
import json
import requests
from datetime import datetime

def fetch_gold_price(symbol="gram-altin"):
    """Fetch gold price from Dovizcom"""
    try:
        url = "https://api.doviz.com/v12/gram-altin"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        return {
            "success": True,
            "symbol": symbol,
            "name": "Gram Altın",
            "current_price": data.get("selling", 0),
            "previous_close": data.get("buying", 0),
            "change_percent": data.get("change_rate", 0),
            "market": "Dovizcom",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def fetch_crypto_price(symbol="BTCTRY"):
    """Fetch crypto price from BtcTurk"""
    try:
        url = f"https://api.btcturk.com/api/v2/ticker?pairSymbol={symbol}"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if not data.get("data"):
            return {"success": False, "error": "No data"}
        
        ticker = data["data"][0]
        return {
            "success": True,
            "symbol": symbol,
            "name": symbol.replace("TRY", " TRY"),
            "current_price": float(ticker.get("last", 0)),
            "previous_close": float(ticker.get("open", 0)),
            "change_percent": float(ticker.get("dailyChangePercent", 0)),
            "market": "BtcTurk",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Usage: fetch_price.py <type> <symbol>"}))
        sys.exit(1)
    
    asset_type = sys.argv[1].lower()
    symbol = sys.argv[2]
    
    if asset_type in ["gold", "silver", "currency"]:
        result = fetch_gold_price(symbol)
    elif asset_type == "crypto":
        result = fetch_crypto_price(symbol)
    else:
        result = {"success": False, "error": f"Unsupported type: {asset_type}"}
    
    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()
