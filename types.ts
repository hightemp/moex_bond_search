export interface Bond {
  // Основные идентификаторы
  secid: string;
  shortname: string;
  secname: string; // Полное название
  isin: string;
  regnumber: string; // Регистрационный номер
  
  // Цена и доходность
  price: number; // % от номинала
  yield: number; // Доходность к погашению
  yieldToOffer?: number | null; // Доходность к оферте
  effectiveYield?: number | null; // Эффективная доходность
  
  // Купонные данные
  couponPercent: number;
  couponPeriod: number; // Длительность купона в днях
  couponValue: number; // Сумма купона в рублях
  accruedInt: number; // НКД
  nextCoupon?: string | null; // Дата следующего купона
  
  // Даты
  maturityDate: string;
  offerDate?: string | null; // Дата оферты
  buybackDate?: string | null; // Дата выкупа
  settleDate?: string | null; // Дата расчетов
  
  // Объемы и торговля
  volume: number; // Объем в рублях
  numTrades?: number | null; // Количество сделок
  duration: number; // Дней до погашения (рассчитанная дюрация)
  durationMoex?: number | null; // Дюрация от MOEX
  
  // Номинал и лоты
  faceValue: number; // Номинал
  faceValueOnSettleDate?: number | null; // Номинал на дату расчетов
  lotSize: number; // Размер лота
  lotValue?: number | null; // Номинальная стоимость лота
  issueSize: number; // Объем выпуска
  issueSizePlaced?: number | null; // Объем в обращении
  
  // Уровень и валюта
  listLevel: number;
  currencyId?: string | null; // Валюта расчетов
  faceUnit?: string | null; // Валюта номинала
  
  // Опционы
  buybackPrice?: number | null; // Цена оферты
  callOptionDate?: string | null; // Дата колл-опциона
  putOptionDate?: string | null; // Дата пут-опциона
  
  // Спреды
  zSpread?: number | null; // Z-спред
  gSpread?: number | null; // G-спред
  
  // Тип облигации
  bondType?: string | null; // Вид облигации
  bondSubType?: string | null; // Подвид облигации
  
  // Рыночные данные
  bid?: number | null; // Лучшая цена покупки
  offer?: number | null; // Лучшая цена продажи
  spread?: number | null; // Спред bid/offer
  open?: number | null; // Цена открытия
  high?: number | null; // Максимум дня
  low?: number | null; // Минимум дня
  waprice?: number | null; // Средневзвешенная цена
  
  // Эвристики
  isFloater: boolean; // Флоатер (плавающий купон)
  isAmortized: boolean; // Амортизация
}

export enum SortField {
  YIELD = 'yield',
  MATURITY = 'maturity',
  VOLUME = 'volume',
  PRICE = 'price',
  COUPON = 'couponPercent',
  COUPON_FREQUENCY = 'couponFrequency',
  LIST_LEVEL = 'listLevel'
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

export interface FilterState {
  minYield: number;
  maxPrice: number;
  minVolume: number;
  maxDurationDays: number;
  searchText: string;
  listLevel: 'all' | 1 | 2 | 3;
  couponFrequency: 'all' | 1 | 2 | 4 | 12; // Выплат в год: все, 1, 2, 4, 12
  currency: 'all' | 'RUB' | 'USD' | 'EUR' | 'CNY'; // Валюта
  showBestBuysOnly: boolean;
  showFavoritesOnly: boolean;
}

// MOEX API Raw Response Types
export interface MoexDataset {
  metadata: Record<string, unknown>;
  columns: string[];
  data: (string | number | null)[][];
}

export interface MoexResponse {
  securities: MoexDataset;
  marketdata: MoexDataset;
}