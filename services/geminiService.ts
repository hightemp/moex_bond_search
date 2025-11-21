import { GoogleGenAI } from "@google/genai";
import { Bond } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is missing in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeBonds = async (
  bonds: Bond[], 
  userQuery: string
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "API Key missing. Cannot generate recommendations.";

  // Context window optimization:
  // We can't send thousands of bonds. We take the top 30 most liquid (volume) bonds 
  // from the current filtered list to ensure high quality recommendations.
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "Не удалось сгенерировать анализ.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Извините, произошла ошибка при анализе данных рынка. Попробуйте позже.";
  }
};