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
    const idxSecName = getColIndex(secCols, 'SECNAME'); // Полное название
    const idxPrevPrice = getColIndex(secCols, 'PREVLEGALCLOSEPRICE');
    const idxPrevYield = getColIndex(secCols, 'YIELDATPREVWAPRICE');
    const idxMatDate = getColIndex(secCols, 'MATDATE');
    const idxCoupon = getColIndex(secCols, 'COUPONPERCENT');
    const idxCouponPeriod = getColIndex(secCols, 'COUPONPERIOD'); // Длительность купона в днях
    const idxCouponValue = getColIndex(secCols, 'COUPONVALUE'); // Сумма купона
    const idxAccruedInt = getColIndex(secCols, 'ACCRUEDINT'); // НКД
    const idxNextCoupon = getColIndex(secCols, 'NEXTCOUPON'); // Дата следующего купона
    const idxIsin = getColIndex(secCols, 'ISIN');
    const idxRegnumber = getColIndex(secCols, 'REGNUMBER'); // Регистрационный номер
    const idxListLevel = getColIndex(secCols, 'LISTLEVEL');
    const idxOfferDate = getColIndex(secCols, 'OFFERDATE'); // Дата оферты
    const idxFaceValue = getColIndex(secCols, 'FACEVALUE'); // Номинал
    const idxFaceValueOnSettleDate = getColIndex(secCols, 'FACEVALUEONSETTLEDATE');
    const idxLotSize = getColIndex(secCols, 'LOTSIZE'); // Размер лота
    const idxLotValue = getColIndex(secCols, 'LOTVALUE'); // Номинальная стоимость лота
    const idxIssueSize = getColIndex(secCols, 'ISSUESIZE'); // Объем выпуска
    const idxIssueSizePlaced = getColIndex(secCols, 'ISSUESIZEPLACED'); // Объем в обращении
    const idxCurrencyId = getColIndex(secCols, 'CURRENCYID'); // Валюта расчетов
    const idxFaceUnit = getColIndex(secCols, 'FACEUNIT'); // Валюта номинала
    const idxBuybackPrice = getColIndex(secCols, 'BUYBACKPRICE'); // Цена оферты
    const idxBuybackDate = getColIndex(secCols, 'BUYBACKDATE'); // Дата выкупа
    const idxSettleDate = getColIndex(secCols, 'SETTLEDATE'); // Дата расчетов
    const idxCallOptionDate = getColIndex(secCols, 'CALLOPTIONDATE'); // Дата колл-опциона
    const idxPutOptionDate = getColIndex(secCols, 'PUTOPTIONDATE'); // Дата пут-опциона
    const idxBondType = getColIndex(secCols, 'BONDTYPE'); // Вид облигации
    const idxBondSubType = getColIndex(secCols, 'BONDSUBTYPE'); // Подвид облигации
    const idxIssuerId = getColIndex(secCols, 'ISSUERID'); // ИНН эмитента

    // 2. Parse Market Data (Real-time Data: Last Price, Current Yield, Volume)
    const mdCols = json.marketdata.columns;
    const mdData = json.marketdata.data;

    const idxMdSecId = getColIndex(mdCols, 'SECID');
    const idxMdLast = getColIndex(mdCols, 'LAST'); // Last deal price
    const idxMdYield = getColIndex(mdCols, 'YIELD'); // Yield of last deal
    const idxMdVolume = getColIndex(mdCols, 'VALTODAY'); // Volume in RUB
    const idxMdNumTrades = getColIndex(mdCols, 'NUMTRADES'); // Количество сделок
    const idxMdDuration = getColIndex(mdCols, 'DURATION'); // Дюрация от MOEX
    const idxMdYieldToOffer = getColIndex(mdCols, 'YIELDTOOFFER'); // Доходность к оферте
    const idxMdBid = getColIndex(mdCols, 'BID'); // Лучшая цена покупки
    const idxMdOffer = getColIndex(mdCols, 'OFFER'); // Лучшая цена продажи
    const idxMdSpread = getColIndex(mdCols, 'SPREAD'); // Спред bid/offer
    const idxMdOpen = getColIndex(mdCols, 'OPEN'); // Цена открытия
    const idxMdHigh = getColIndex(mdCols, 'HIGH'); // Максимум дня
    const idxMdLow = getColIndex(mdCols, 'LOW'); // Минимум дня
    const idxMdWaprice = getColIndex(mdCols, 'WAPRICE'); // Средневзвешенная цена
    const idxMdZSpread = getColIndex(mdCols, 'ZSPREAD'); // Z-спред

    // Create a map for quick market data lookup
    interface MarketData {
      last: number;
      yield: number;
      volume: number;
      numTrades: number | null;
      durationMoex: number | null;
      yieldToOffer: number | null;
      bid: number | null;
      offer: number | null;
      spread: number | null;
      open: number | null;
      high: number | null;
      low: number | null;
      waprice: number | null;
      zSpread: number | null;
    }
    
    const marketDataMap = new Map<string, MarketData>();
    
    mdData.forEach(row => {
      const secId = row[idxMdSecId] as string;
      marketDataMap.set(secId, { 
        last: row[idxMdLast] as number,
        yield: row[idxMdYield] as number,
        volume: row[idxMdVolume] as number,
        numTrades: idxMdNumTrades !== -1 ? row[idxMdNumTrades] as number : null,
        durationMoex: idxMdDuration !== -1 ? row[idxMdDuration] as number : null,
        yieldToOffer: idxMdYieldToOffer !== -1 ? row[idxMdYieldToOffer] as number : null,
        bid: idxMdBid !== -1 ? row[idxMdBid] as number : null,
        offer: idxMdOffer !== -1 ? row[idxMdOffer] as number : null,
        spread: idxMdSpread !== -1 ? row[idxMdSpread] as number : null,
        open: idxMdOpen !== -1 ? row[idxMdOpen] as number : null,
        high: idxMdHigh !== -1 ? row[idxMdHigh] as number : null,
        low: idxMdLow !== -1 ? row[idxMdLow] as number : null,
        waprice: idxMdWaprice !== -1 ? row[idxMdWaprice] as number : null,
        zSpread: idxMdZSpread !== -1 ? row[idxMdZSpread] as number : null,
      });
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
        // Основные идентификаторы
        secid: secId,
        shortname: shortname,
        secname: idxSecName !== -1 ? (row[idxSecName] as string) || shortname : shortname,
        isin: row[idxIsin] as string,
        regnumber: idxRegnumber !== -1 ? (row[idxRegnumber] as string) || '' : '',
        
        // Цена и доходность
        price: typeof price === 'number' ? price : 0,
        yield: typeof yieldVal === 'number' ? yieldVal : 0,
        yieldToOffer: md?.yieldToOffer || null,
        effectiveYield: null, // Будет добавлено если понадобится
        
        // Купонные данные
        couponPercent: (row[idxCoupon] as number) || 0,
        couponPeriod: (row[idxCouponPeriod] as number) || 0,
        couponValue: (row[idxCouponValue] as number) || 0,
        accruedInt: (row[idxAccruedInt] as number) || 0,
        nextCoupon: idxNextCoupon !== -1 ? (row[idxNextCoupon] as string) : null,
        
        // Даты
        maturityDate: matDateVal,
        offerDate: offerDateVal,
        buybackDate: idxBuybackDate !== -1 ? (row[idxBuybackDate] as string) : null,
        settleDate: idxSettleDate !== -1 ? (row[idxSettleDate] as string) : null,
        
        // Объемы и торговля
        volume: volume,
        numTrades: md?.numTrades || null,
        duration: durationDays > 0 ? durationDays : 0,
        durationMoex: md?.durationMoex || null,
        
        // Номинал и лоты
        faceValue: (row[idxFaceValue] as number) || 1000,
        faceValueOnSettleDate: idxFaceValueOnSettleDate !== -1 ? (row[idxFaceValueOnSettleDate] as number) : null,
        lotSize: (row[idxLotSize] as number) || 1,
        lotValue: idxLotValue !== -1 ? (row[idxLotValue] as number) : null,
        issueSize: (row[idxIssueSize] as number) || 0,
        issueSizePlaced: idxIssueSizePlaced !== -1 ? (row[idxIssueSizePlaced] as number) : null,
        
        // Уровень и валюта
        listLevel: (row[idxListLevel] as number) || 3,
        currencyId: idxCurrencyId !== -1 ? (row[idxCurrencyId] as string) : null,
        faceUnit: idxFaceUnit !== -1 ? (row[idxFaceUnit] as string) : null,
        
        // Опционы
        buybackPrice: idxBuybackPrice !== -1 ? (row[idxBuybackPrice] as number) : null,
        callOptionDate: idxCallOptionDate !== -1 ? (row[idxCallOptionDate] as string) : null,
        putOptionDate: idxPutOptionDate !== -1 ? (row[idxPutOptionDate] as string) : null,
        
        // Спреды
        zSpread: md?.zSpread || null,
        gSpread: null, // G-spread недоступен в основном API
        
        // Тип облигации
        bondType: idxBondType !== -1 ? (row[idxBondType] as string) : null,
        bondSubType: idxBondSubType !== -1 ? (row[idxBondSubType] as string) : null,
        
        // Эмитент
        issuerId: idxIssuerId !== -1 ? (row[idxIssuerId] as string) : null,
        
        // Рыночные данные
        bid: md?.bid || null,
        offer: md?.offer || null,
        spread: md?.spread || null,
        open: md?.open || null,
        high: md?.high || null,
        low: md?.low || null,
        waprice: md?.waprice || null,
        
        // Эвристики
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

// Emitter (issuer) information
export interface EmitterInfo {
  emitentId: number | null;
  emitentTitle: string | null;
  emitentInn: string | null;
  emitentOkpo: string | null;
  securityType: string | null;
  securityGroup: string | null;
  primaryBoardId: string | null;
}

// Fetch emitter info by SECID or ISIN
export const fetchEmitterInfo = async (secidOrIsin: string): Promise<EmitterInfo | null> => {
  const baseUrl = 'https://iss.moex.com/iss/securities.json';
  const params = new URLSearchParams({
    q: secidOrIsin,
    engine: 'stock',
    market: 'bonds',
    'group_by': 'group',
    'group_by_filter': 'stock_bonds',
    'is_trading': '1',
    limit: '20',
    start: '0',
    'iss.only': 'securities',
    'iss.meta': 'off',
    'iss.json': 'compact',
    'securities.columns': 'secid,shortname,isin,emitent_id,emitent_title,emitent_inn,emitent_okpo,type,group,primary_boardid'
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    let json: any;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Direct fetch failed');
      json = await response.json();
    } catch (directError) {
      console.warn("Direct MOEX emitter fetch failed (likely CORS), switching to proxy...");
      const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error(`MOEX API Error via Proxy: ${response.statusText}`);
      }
      json = await response.json();
    }

    // Parse compact JSON format
    const securities = json.securities;
    if (!securities || !securities.columns || !securities.data || securities.data.length === 0) {
      return null;
    }

    const cols = securities.columns as string[];
    const rows = securities.data as (string | number | null)[][];

    // Get column indices
    const getIdx = (name: string) => cols.indexOf(name);
    const idxSecid = getIdx('secid');
    const idxIsin = getIdx('isin');
    const idxEmitentId = getIdx('emitent_id');
    const idxEmitentTitle = getIdx('emitent_title');
    const idxEmitentInn = getIdx('emitent_inn');
    const idxEmitentOkpo = getIdx('emitent_okpo');
    const idxType = getIdx('type');
    const idxGroup = getIdx('group');
    const idxPrimaryBoardId = getIdx('primary_boardid');

    // Find the exact match (search returns similar results, so we need to match exactly)
    const searchTerm = secidOrIsin.toUpperCase();
    const matchedRow = rows.find(row => {
      const secid = (row[idxSecid] as string || '').toUpperCase();
      const isin = (row[idxIsin] as string || '').toUpperCase();
      return secid === searchTerm || isin === searchTerm;
    });

    if (!matchedRow) {
      // If no exact match, return the first result (best guess)
      if (rows.length > 0) {
        const row = rows[0];
        return {
          emitentId: row[idxEmitentId] as number | null,
          emitentTitle: row[idxEmitentTitle] as string | null,
          emitentInn: row[idxEmitentInn] as string | null,
          emitentOkpo: row[idxEmitentOkpo] as string | null,
          securityType: row[idxType] as string | null,
          securityGroup: row[idxGroup] as string | null,
          primaryBoardId: row[idxPrimaryBoardId] as string | null,
        };
      }
      return null;
    }

    return {
      emitentId: matchedRow[idxEmitentId] as number | null,
      emitentTitle: matchedRow[idxEmitentTitle] as string | null,
      emitentInn: matchedRow[idxEmitentInn] as string | null,
      emitentOkpo: matchedRow[idxEmitentOkpo] as string | null,
      securityType: matchedRow[idxType] as string | null,
      securityGroup: matchedRow[idxGroup] as string | null,
      primaryBoardId: matchedRow[idxPrimaryBoardId] as string | null,
    };

  } catch (error) {
    console.error("Failed to fetch emitter info", error);
    return null;
  }
};