export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { topic } = req.body;

    // URL для обращения к Gemini API (модель gemini-1.5-flash - быстрая и бесплатная)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const promptText = `Ты помощник для изучения английского языка. Пользователь назовет тему: "${topic}". Тебе нужно сгенерировать 5 английских слов по этой теме с переводом на русский. Верни ответ СТРОГО в формате JSON массива, без лишнего текста. Формат: [{"english": "word", "russian": "слово"}]`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: 'application/json' // Gemini вернет чистый JSON!
        }
      })
    });

    if (!response.ok) {
      const errData = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errData}`);
    }

    const data = await response.json();
    
    // У Gemini немного другая структура ответа, достаем текст оттуда
    const wordsJson = data.candidates[0].content.parts[0].text;

    // Отправляем слова на наш фронтенд
    return res.status(200).json(JSON.parse(wordsJson));

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to generate words' });
  }
}