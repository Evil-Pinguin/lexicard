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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
   
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
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
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    let wordsJson = data.choices[0].message.content;

    // Очищаем от возможных markdown символов (```json и ```)
    wordsJson = wordsJson.replace(/```json/g, '').replace(/```/g, '').trim();

    // Отправляем слова на наш фронтенд
    return res.status(200).json(JSON.parse(wordsJson));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to generate words' });
  }
}