/**
 * Gold Price Service
 *
 * Calculates prices for different gold types based on gram price
 */

export interface GoldType {
  id: string;
  name: string;
  grams: number;
  symbol?: string;
}

// Altın türleri ve gramajları
export const GOLD_TYPES: GoldType[] = [
  { id: 'gram', name: 'Altın', grams: 1 },
  { id: 'ceyrek', name: 'Çeyrek Altın', grams: 1.75 },
  { id: 'yarim', name: 'Yarım Altın', grams: 3.5 },
  { id: 'tam', name: 'Tam Altın (Cumhuriyet)', grams: 7.216 },
  { id: 'ata', name: 'Ata Altın', grams: 7.216 },
  { id: 'iki-buçuk', name: "2.5'lik (Beşliye)", grams: 17.5 },
  { id: 'gremse', name: 'Gremse', grams: 3.5 },
  { id: 'çeyrek-slug', name: 'Çeyrek Slug', grams: 1.75 },
  { id: 'yarim-slug', name: 'Yarım Slug', grams: 3.5 },
  { id: 'tam-slug', name: 'Tam Slug', grams: 7.216 }
];

// Gümüş türleri ve gramajları
export const SILVER_TYPES: GoldType[] = [
  { id: 'gram', name: 'Gümüş', grams: 1 },
  { id: 'ceyrek', name: 'Çeyrek Gümüş', grams: 1.75 },
  { id: 'yarim', name: 'Yarım Gümüş', grams: 3.5 },
  { id: 'tam', name: 'Tam Gümüş', grams: 7.216 },
  { id: 'iki-buçuk', name: "2.5'lik Gümüş", grams: 17.5 },
  { id: 'gremse', name: 'Gremse Gümüş', grams: 3.5 }
];

export interface GoldPrice {
  type: GoldType;
  price: number;
  priceFormatted: string;
  changePercent?: number;
  changeAmount?: number;
}

/**
 * Fetch gram gold price from Yahoo Finance
 */
async function fetchGramGoldPrice(): Promise<number> {
  try {
    // Fetch USD/TRY rate
    let usdTryRate = 34; // Fallback
    try {
      const usdTryUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/TRY=X?interval=1d&range=1d';
      const usdTryResponse = await fetch(usdTryUrl);
      const usdTryData = await usdTryResponse.json();

      if (usdTryData?.chart?.result?.[0]?.meta?.regularMarketPrice) {
        usdTryRate = usdTryData.chart.result[0].meta.regularMarketPrice;
      }
    } catch (error) {
      console.warn('Could not fetch USD/TRY rate:', error);
    }

    // Fetch gold price
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=1d';
    const response = await fetch(url);
    const data = await response.json();

    if (!data?.chart?.result?.[0]) {
      throw new Error('Invalid response from Yahoo Finance');
    }

    const result = data.chart.result[0];
    const meta = result.meta;
    const currentPriceUSD = meta.regularMarketPrice;

    // Convert to TRY (1 ounce = 31.1035 grams)
    const GRAMS_PER_OUNCE = 31.1035;
    const gramPriceTRY = (currentPriceUSD / GRAMS_PER_OUNCE) * usdTryRate;

    return gramPriceTRY;
  } catch (error) {
    console.error('Error fetching gram gold price:', error);
    throw error;
  }
}

/**
 * Calculate all gold prices based on gram price
 */
export async function getAllGoldPrices(): Promise<GoldPrice[]> {
  const gramPrice = await fetchGramGoldPrice();

  const prices: GoldPrice[] = GOLD_TYPES.map(goldType => {
    const price = gramPrice * goldType.grams;

    return {
      type: goldType,
      price,
      priceFormatted: new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2
      }).format(price)
    };
  });

  return prices;
}

/**
 * Get specific gold type price
 */
export async function getGoldPrice(typeId: string): Promise<GoldPrice | null> {
  const allPrices = await getAllGoldPrices();
  return allPrices.find(p => p.type.id === typeId) || null;
}

/**
 * Get prices for multiple gold types
 */
export async function getGoldPrices(typeIds: string[]): Promise<GoldPrice[]> {
  const allPrices = await getAllGoldPrices();
  return allPrices.filter(p => typeIds.includes(p.type.id));
}

/**
 * Fetch gram silver price from Yahoo Finance
 */
async function fetchGramSilverPrice(): Promise<number> {
  try {
    // Fetch USD/TRY rate
    let usdTryRate = 34; // Fallback
    try {
      const usdTryUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/TRY=X?interval=1d&range=1d';
      const usdTryResponse = await fetch(usdTryUrl);
      const usdTryData = await usdTryResponse.json();

      if (usdTryData?.chart?.result?.[0]?.meta?.regularMarketPrice) {
        usdTryRate = usdTryData.chart.result[0].meta.regularMarketPrice;
      }
    } catch (error) {
      console.warn('Could not fetch USD/TRY rate:', error);
    }

    // Fetch silver price
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/SI=F?interval=1d&range=1d';
    const response = await fetch(url);
    const data = await response.json();

    if (!data?.chart?.result?.[0]) {
      throw new Error('Invalid response from Yahoo Finance');
    }

    const result = data.chart.result[0];
    const meta = result.meta;
    const currentPriceUSD = meta.regularMarketPrice;

    // Convert to TRY (1 ounce = 31.1035 grams)
    const GRAMS_PER_OUNCE = 31.1035;
    const gramPriceTRY = (currentPriceUSD / GRAMS_PER_OUNCE) * usdTryRate;

    return gramPriceTRY;
  } catch (error) {
    console.error('Error fetching gram silver price:', error);
    throw error;
  }
}

/**
 * Calculate all silver prices based on gram price
 */
export async function getAllSilverPrices(): Promise<GoldPrice[]> {
  const gramPrice = await fetchGramSilverPrice();

  const prices: GoldPrice[] = SILVER_TYPES.map(silverType => {
    const price = gramPrice * silverType.grams;

    return {
      type: silverType,
      price,
      priceFormatted: new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2
      }).format(price)
    };
  });

  return prices;
}

/**
 * Get specific silver type price
 */
export async function getSilverPrice(typeId: string): Promise<GoldPrice | null> {
  const allPrices = await getAllSilverPrices();
  return allPrices.find(p => p.type.id === typeId) || null;
}

/**
 * Get prices for multiple silver types
 */
export async function getSilverPrices(typeIds: string[]): Promise<GoldPrice[]> {
  const allPrices = await getAllSilverPrices();
  return allPrices.filter(p => typeIds.includes(p.type.id));
}