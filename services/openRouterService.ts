import { Bond } from "../types";
import { CBRData } from "./cbrService";

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

export const fetchModels = async (): Promise<OpenRouterModel[]> => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models");
    if (!response.ok) {
      throw new Error("Failed to fetch models");
    }
    const data = await response.json();
    // Filter for free or low cost models, or just return all. 
    // Let's return a curated list or all of them.
    // For now, returning all but we might want to filter in UI.
    return data.data.sort((a: OpenRouterModel, b: OpenRouterModel) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching OpenRouter models:", error);
    return [];
  }
};

export const analyzeSingleBond = async (
  bond: Bond,
  apiKey: string,
  modelId: string,
  cbrData?: CBRData
): Promise<string> => {
  if (!apiKey) return "API Key missing.";

  const cbrInfo = cbrData
    ? `Текущая ключевая ставка ЦБ РФ: ${cbrData.keyRate}%. Официальная инфляция: ${cbrData.inflation}%.`
    : "Данные ЦБ РФ недоступны, используй общие знания о высокой ставке (~21%).";

  const prompt = `
    Ты профессиональный финансовый аналитик, специализирующийся на рынке облигаций РФ (Мосбиржа).
    Отвечай строго на русском языке.
    
    Проанализируй данную облигацию и дай рекомендацию: СТОИТ ЛИ ЕЕ ПОКУПАТЬ СЕЙЧАС?

    Контекст рынка:
    ${cbrInfo}

    Данные облигации:
    - Тикер: ${bond.secid}
    - Название: ${bond.shortname}
    - Цена: ${bond.price}%
    - Доходность: ${bond.yield}%
    - Купон: ${bond.couponPercent}%
    - Погашение: ${bond.maturityDate} (Дюрация: ${bond.duration} дн.)
    - Объем торгов: ${bond.volume} RUB
    - Оферта: ${bond.offerDate || 'Нет'}
    - Флоатер: ${bond.isFloater ? 'Да' : 'Нет'}
    - Амортизация: ${bond.isAmortized ? 'Да' : 'Нет'}
    - Уровень листинга: ${bond.listLevel}

    Твоя задача:
    1. Дай четкий вердикт: "Покупать", "Держать", "Продавать" или "Рискованно".
    2. Обоснуй решение, оценив соотношение риск/доходность.
    3. Сравни доходность с текущей ключевой ставкой ЦБ РФ (${cbrData?.keyRate || 21}%).
    4. Укажи главные плюсы и минусы инструмента.
    5. Отформатируй ответ в Markdown.
  `;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "MOEX Bond Search",
      },
      body: JSON.stringify({
        "model": modelId,
        "messages": [
          { "role": "user", "content": prompt }
        ]
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || "OpenRouter API Error");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "Не удалось получить ответ от модели.";
  } catch (error: any) {
    console.error("OpenRouter Error:", error);
    return `Ошибка при обращении к AI: ${error.message}`;
  }
};

export const analyzeBondsOpenRouter = async (
  bonds: Bond[],
  userQuery: string,
  apiKey: string,
  modelId: string
): Promise<string> => {
  if (!apiKey) return "API Key missing.";

  // Context window optimization:
  // We take the top 30 most liquid (volume) bonds 
  const topLiquidityBonds = [...bonds]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 30)
    .map(b => ({
      Ticker: b.secid,
      Name: b.shortname,
      Price: b.price,
      Yield: b.yield,
      Maturity: b.maturityDate,
      Coupon: b.couponPercent,
      OfferDate: b.offerDate,
      IsFloater: b.isFloater,
      IsAmortized: b.isAmortized
    }));

  const prompt = `
    Ты профессиональный финансовый аналитик, специализирующийся на рынке облигаций РФ (Мосбиржа).
    Отвечай строго на русском языке.
    
    Запрос пользователя: "${userQuery}"

    Вот список наиболее ликвидных доступных облигаций (в формате JSON):
    ${JSON.stringify(topLiquidityBonds)}

    Задача:
    1. Проанализируй предоставленные облигации исходя из цели пользователя.
    2. Порекомендуй конкретно 3 облигации из списка.
    3. Для каждой рекомендации объясни ПОЧЕМУ она подходит (доходность vs риск, дюрация, ликвидность).
    4. Учитывай параметры оферты (OfferDate) и тип купона (IsFloater), если это важно для запроса.
    5. Отформатируй ответ в чистом Markdown. Используй жирный шрифт для Тикеров и Доходностей.
    
    Если запрос пользователя нечеткий (например, "порекомендуй что-нибудь"), предполагай сбалансированную стратегию (доходность > 15%, но без мусора).
  `;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin, // Optional, for including your app on openrouter.ai rankings.
        "X-Title": "MOEX Bond Search", // Optional. Shows in rankings on openrouter.ai.
      },
      body: JSON.stringify({
        "model": modelId,
        "messages": [
          { "role": "user", "content": prompt }
        ]
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || "OpenRouter API Error");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "Не удалось получить ответ от модели.";
  } catch (error: any) {
    console.error("OpenRouter Error:", error);
    return `Ошибка при обращении к AI: ${error.message}`;
  }
};