# AGENTS.md - Документация проекта MOEX Bond Search

## Обзор проекта

**MOEX Bond Search** - веб-приложение для поиска и анализа корпоративных облигаций на Московской бирже (MOEX). Приложение предоставляет интерфейс для фильтрации, сортировки и AI-анализа облигаций.

**Демо**: https://hightemp.github.io/moex_bond_search/

## Архитектура

### Тип приложения
- **Single Page Application (SPA)** с клиентским рендерингом
- **Без бэкенда** - все данные получаются напрямую из публичных API
- **Статический хостинг** через GitHub Pages (папка `docs/`)

### Технологический стек

| Технология | Версия | Назначение |
|------------|--------|------------|
| React | 19.2.0 | UI фреймворк |
| TypeScript | 5.8.2 | Типизация |
| Tailwind CSS | CDN | Стилизация |
| Vite | 6.2.0 | Сборка и dev-сервер |
| Recharts | 3.4.1 | Графики |
| Lucide React | 0.554.0 | Иконки |
| React Markdown | 10.1.0 | Рендер AI-ответов |

### Внешние API

| API | Описание | Аутентификация |
|-----|----------|----------------|
| MOEX ISS API | Данные об облигациях | Не требуется (публичный) |
| OpenRouter AI | AI-анализ облигаций | API ключ (хранится в localStorage) |

## Структура проекта

```
moex_bond_search/
├── components/              # React компоненты
│   ├── AIAdvisor.tsx       # AI советник (сайдбар)
│   ├── BondAnalysisModal.tsx # Модалка AI-анализа облигации
│   ├── BondDetailPage.tsx  # Страница детальной информации об облигации
│   ├── BondTable.tsx       # Таблица облигаций
│   ├── CBRWidget.tsx       # Виджет данных ЦБ РФ
│   ├── Filters.tsx         # Фильтры
│   └── YieldChart.tsx      # График доходность/дюрация
├── services/               # Сервисы (API, бизнес-логика)
│   ├── cbrService.ts       # Сервис данных ЦБ РФ
│   ├── moexService.ts      # Сервис MOEX API
│   └── openRouterService.ts # Сервис OpenRouter AI
├── docs/                   # Продакшн сборка (GitHub Pages)
├── App.tsx                 # Главный компонент приложения
├── index.tsx               # Точка входа React
├── index.html              # HTML шаблон
├── types.ts                # TypeScript типы
├── vite.config.ts          # Конфигурация Vite
├── package.json            # Зависимости и скрипты
└── AGENTS.md               # Эта документация
```

## Модели данных

### Bond (Облигация)

```typescript
interface Bond {
  secid: string;          // Тикер (напр. "RU000A107T31")
  shortname: string;      // Краткое название
  price: number;          // Цена в % от номинала
  yield: number;          // Доходность к погашению
  couponPercent: number;  // Ставка купона (% годовых)
  couponPeriod: number;   // Длительность купонного периода (дней)
  couponValue: number;    // Сумма купона в рублях
  accruedInt: number;     // НКД (накопленный купонный доход)
  maturityDate: string;   // Дата погашения
  offerDate?: string;     // Дата оферты (если есть)
  nextCoupon?: string;    // Дата следующего купона
  volume: number;         // Объем торгов (руб.)
  duration: number;       // Дней до погашения
  isin: string;           // ISIN код
  listLevel: number;      // Уровень листинга (1, 2, 3)
  faceValue: number;      // Номинал облигации
  lotSize: number;        // Размер лота
  issueSize: number;      // Объем выпуска (шт.)
  isFloater: boolean;     // Флоатер (плавающий купон)
  isAmortized: boolean;   // Амортизируемая
}
```

### FilterState (Состояние фильтров)

```typescript
interface FilterState {
  minYield: number;           // Мин. доходность (по умолч. 10%)
  maxPrice: number;           // Макс. цена (по умолч. 105%)
  minVolume: number;          // Мин. объем торгов
  maxDurationDays: number;    // Макс. дюрация (по умолч. 2000 дней)
  searchText: string;         // Поиск по названию/тикеру
  listLevel: 'all' | 1 | 2 | 3;
  showBestBuysOnly: boolean;  // Только "лучшие" облигации
  showFavoritesOnly: boolean;
}
```

## Потоки данных

### Загрузка облигаций

```
MOEX ISS API ──► moexService.ts ──► App.tsx (state) ──► BondTable.tsx
                     │
                     ├── securities (статические данные)
                     └── marketdata (real-time данные)
```

### AI-анализ

```
User Input ──► AIAdvisor.tsx ──► openRouterService.ts ──► OpenRouter API
                                                              │
Bond Data ────────────────────────────────────────────────────┘
```

## API Endpoints

### MOEX ISS API

**Base URL**: `https://iss.moex.com/iss/`

| Endpoint | Описание |
|----------|----------|
| `engines/stock/markets/bonds/boards/TQCB/securities.json` | Список корпоративных облигаций |
| `securities/{SECID}.json` | Детальная информация по облигации |

**Поля из `securities`**:
- `SECID`, `SHORTNAME`, `ISIN`
- `PREVLEGALCLOSEPRICE` - цена закрытия
- `YIELDATPREVWAPRICE` - доходность
- `MATDATE`, `COUPONPERCENT`, `COUPONPERIOD`, `COUPONVALUE`
- `LISTLEVEL`, `OFFERDATE`, `FACEVALUE`, `LOTSIZE`

**Поля из `marketdata`**:
- `LAST` - последняя цена
- `YIELD` - текущая доходность
- `VALTODAY` - объем торгов

### OpenRouter API

**Base URL**: `https://openrouter.ai/api/v1/`

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `models` | GET | Список доступных моделей |
| `chat/completions` | POST | AI-анализ |

## Локальное хранилище (localStorage)

| Ключ | Описание |
|------|----------|
| `favorite_bonds_full` | Избранные облигации (полные объекты Bond) |
| `openrouter_api_key` | API ключ OpenRouter |
| `openrouter_model` | Выбранная AI модель |
| `cbr_data` | Данные ЦБ РФ (ключевая ставка, инфляция) |

## Рейтинговая система облигаций

Функция `getBondRating()` в `App.tsx` присваивает рейтинги:

| Рейтинг | Условия | Описание |
|---------|---------|----------|
| GEM (Топ) | Листинг 1-2, Доходность > 20%, Цена < 108%, Ликвидная | Лучший выбор |
| SAFE (Надежная) | Листинг 1-2, Доходность > 16%, Короткий срок, Ликвидная | Консервативная |
| HIGH_YIELD (Доходная) | Доходность > 24%, Высокая ликвидность | Агрессивная стратегия |

## Навигация и Views

| View | Описание |
|------|----------|
| `market` | Основной рынок с фильтрами и графиками |
| `favorites` | Избранные облигации пользователя |
| `bond/:secid` | Детальная страница облигации с AI-помощником |

## Команды разработки

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера (порт 3000)
npm run dev

# Сборка для продакшн (в папку docs/)
npm run build

# Предпросмотр продакшн сборки
npm run preview
```

## Деплой

Приложение автоматически деплоится на GitHub Pages из папки `docs/`. Для обновления:

1. Внести изменения
2. Запустить `npm run build`
3. Закоммитить изменения включая `docs/`
4. Запушить в main ветку

## Особенности реализации

### CORS обход
При прямом запросе к MOEX API может возникать CORS ошибка. Используется fallback через прокси `https://api.allorigins.win/raw?url=`.

### Эвристики определения типа облигации
- **Флоатер**: название содержит "фл", "пк", "ruonia", "кс"
- **Амортизация**: название содержит "ам", "аморт"

### Расчет количества выплат в год
```typescript
couponFrequency = Math.round(365 / couponPeriod)
```

## Безопасность

- API ключ OpenRouter хранится только в localStorage браузера пользователя
- Приложение не имеет бэкенда и не передает данные на сторонние серверы (кроме OpenRouter для AI-анализа)

## Известные ограничения

1. Данные MOEX обновляются только при перезагрузке страницы
2. Эвристики типа облигации (флоатер/амортизация) могут быть неточными
3. AI-анализ требует внешнего API ключа

## Будущие улучшения

- [ ] Автоматическое обновление данных
- [ ] Кеширование данных облигаций
- [ ] История просмотренных облигаций
- [ ] Сравнение облигаций
- [ ] Экспорт в Excel/CSV
