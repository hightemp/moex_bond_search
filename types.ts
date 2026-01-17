export interface Bond {
  secid: string;
  shortname: string;
  price: number; // % от номинала
  yield: number; // Доходность
  couponPercent: number;
  couponPeriod: number; // Длительность купона в днях
  couponValue: number; // Сумма купона в рублях
  accruedInt: number; // НКД
  nextCoupon?: string | null; // Дата следующего купона
  maturityDate: string;
  offerDate?: string | null; // Дата оферты
  volume: number; // Объем в рублях
  duration: number; // Дней до погашения
  isin: string;
  listLevel: number;
  faceValue: number; // Номинал
  lotSize: number; // Размер лота
  issueSize: number; // Объем выпуска
  isFloater: boolean; // Флоатер (эвристика)
  isAmortized: boolean; // Амортизация (эвристика)
}

export enum SortField {
  YIELD = 'yield',
  MATURITY = 'maturity',
  VOLUME = 'volume',
  PRICE = 'price'
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