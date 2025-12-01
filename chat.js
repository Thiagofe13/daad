// api/chat.js
export default async function handler(req, res) {
  // 1. Configuração para não ter bloqueio de navegador (CORS)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. Responde rápido se o navegador só estiver testando a conexão
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 3. Segurança: Só aceita método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const { message, history } = req.body;
    
    // 4. Pega a chave que vamos configurar no painel da Vercel
    const apiKey = process.env.DEEPINFRA_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Chave API não configurada no servidor.' });
    }

    // 5. O Cérebro: Chama a DeepInfra
    const response = await fetch("https://api.deepinfra.com/v1/openai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/Mistral-7B-Instruct-v0.2",
        messages: [
            { role: "system", content: "Você é uma assistente de IA neutro, útil e profissional. Responda em Português do Brasil." },
            ...(history || []), // Adiciona o histórico se existir
            { role: "user", content: message }
        ],
        max_tokens: 400,
        temperature: 0.7
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    // 6. Devolve a resposta limpa pro site
    return res.status(200).json({ text: data.choices[0].message.content });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}