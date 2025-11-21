import { Bond, MoexResponse } from '../types';

// Corporate Bonds (TQCB)
const MOEX_URL = 'https://iss.moex.com/iss/engines/stock/markets/bonds/boards/TQCB/securities.json';
// Fallback proxy in case of CORS issues (common in browser environments)
const PROXY_URL = 'https://api.allorigins.win/raw?url=';

export const fetchBonds = async (): Promise<Bond[]> => {
  try {
    let json: MoexResponse;
    
    try {
      // Try direct fetch first
      const response = await fetch(MOEX_URL);
      if (!response.ok) throw new Error('Direct fetch failed');
      json = await response.json();
    } catch (directError) {
      console.warn("Direct MOEX fetch failed (likely CORS), switching to proxy...");
      // Fallback to proxy
      const response = await fetch(`${PROXY_URL}${encodeURIComponent(MOEX_URL)}`);
      if (!response.ok) {
        throw new Error(`MOEX API Error via Proxy: ${response.statusText}`);
      }
      json = await response.json();
    }

    // Helper to find column index
    const getColIndex = (columns: string[], name: string) => columns.indexOf(name);

    // 1. Parse Securities (Static Data + Previous Close)
    const secCols = json.securities.columns;
    const secData = json.securities.data;

    const idxSecId = getColIndex(secCols, 'SECID');
    const idxName = getColIndex(secCols, 'SHORTNAME');
    const idxPrevPrice = getColIndex(secCols, 'PREVLEGALCLOSEPRICE');
    const idxPrevYield = getColIndex(secCols, 'YIELDATPREVWAPRICE');
    const idxMatDate = getColIndex(secCols, 'MATDATE');
    const idxCoupon = getColIndex(secCols, 'COUPONPERCENT');
    const idxIsin = getColIndex(secCols, 'ISIN');
    const idxListLevel = getColIndex(secCols, 'LISTLEVEL');
    const idxOfferDate = getColIndex(secCols, 'OFFERDATE'); // Дата оферты

    // 2. Parse Market Data (Real-time Data: Last Price, Current Yield, Volume)
    const mdCols = json.marketdata.columns;
    const mdData = json.marketdata.data;

    const idxMdSecId = getColIndex(mdCols, 'SECID');
    const idxMdLast = getColIndex(mdCols, 'LAST'); // Last deal price
    const idxMdYield = getColIndex(mdCols, 'YIELD'); // Yield of last deal
    const idxMdVolume = getColIndex(mdCols, 'VALTODAY'); // Volume in RUB

    // Create a map for quick market data lookup
    const marketDataMap = new Map<string, { last: number; yield: number; volume: number }>();
    
    mdData.forEach(row => {
      const secId = row[idxMdSecId] as string;
      const last = row[idxMdLast] as number;
      const yieldVal = row[idxMdYield] as number;
      const volume = row[idxMdVolume] as number;
      marketDataMap.set(secId, { last, yield: yieldVal, volume });
    });

    // 3. Merge and Construct Bond Objects
    const bonds: Bond[] = secData.map((row) => {
      const secId = row[idxSecId] as string;
      const md = marketDataMap.get(secId);
      const shortname = row[idxName] as string;

      // Prefer Real-time data, fallback to Previous Close data
      let price = md?.last;
      if (price === null || price === undefined || price === 0) {
        price = row[idxPrevPrice] as number;
      }

      let yieldVal = md?.yield;
      if (yieldVal === null || yieldVal === undefined || yieldVal === 0) {
        yieldVal = row[idxPrevYield] as number;
      }

      // Volume is strictly from today's market data
      const volume = md?.volume || 0;

      const matDateVal = row[idxMatDate] as string;
      const offerDateVal = idxOfferDate !== -1 ? (row[idxOfferDate] as string) : null;
      
      // Calculate duration
      const maturity = new Date(matDateVal);
      const today = new Date();
      const durationTime = maturity.getTime() - today.getTime();
      const durationDays = Math.ceil(durationTime / (1000 * 3600 * 24));

      // Heuristic analysis for properties not explicitly in TQCB default columns
      const lowerName = shortname.toLowerCase();
      // "Фл" or "ПК" often implies variable coupon (Floater) in Russian naming convention
      const isFloater = lowerName.includes('фл') || lowerName.includes('пк') || lowerName.includes('ruonia') || lowerName.includes('кс');
      // "Ам" implies Amortization
      const isAmortized = lowerName.includes('ам') || lowerName.includes('аморт');

      return {
        secid: secId,
        shortname: shortname,
        price: typeof price === 'number' ? price : 0,
        yield: typeof yieldVal === 'number' ? yieldVal : 0,
        couponPercent: (row[idxCoupon] as number) || 0,
        maturityDate: matDateVal,
        offerDate: offerDateVal,
        volume: volume,
        duration: durationDays > 0 ? durationDays : 0,
        isin: row[idxIsin] as string,
        listLevel: (row[idxListLevel] as number) || 3,
        isFloater,
        isAmortized
      };
    });

    // Filter junk: 
    // - Must have a valid price
    // - Must not be expired (duration > 0)
    return bonds.filter(b => b.price > 0 && b.duration > 0);

  } catch (error) {
    console.error("Failed to fetch bonds", error);
    throw error;
  }
};