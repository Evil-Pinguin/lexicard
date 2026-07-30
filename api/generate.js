// Cache busting: forcing Vercel to rebuild function
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

    // URL API Groq
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Берем ключ из переменных окружения Vercel
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        // Используем быструю и бесплатную модель Llama 3
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'Ты помощник для изучения английского языка. Пользователь назовет тему. Тебе нужно сгенерировать 5 английских слов по этой теме с переводом на русский. Верни ответ СТРОГО в формате JSON массива, без лишнего текста и markdown. Формат: [{"english": "word", "russian": "слово"}]'
          },
          {
            role: 'user',
            content: topic
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errData = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errData}`);
    }

    const data = await response.json();
    let wordsJson = data.choices[0].message.content;

    // Очищаем от markdown на всякий случай
    wordsJson = wordsJson.replace(/```json/g, '').replace(/```/g, '').trim();

    return res.status(200).json(JSON.parse(wordsJson));

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to generate words' });
  }
}