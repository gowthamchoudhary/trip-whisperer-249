const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

function extractJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error('Response did not contain valid JSON.');
  }
}

async function callGroq(systemPrompt, userPrompt, retryContext = '') {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || DEFAULT_MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `${systemPrompt}\nReturn only strict JSON. No markdown, prose, or comments.`
        },
        {
          role: 'user',
          content: retryContext ? `${userPrompt}\n\n${retryContext}` : userPrompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq request failed (${response.status}): ${errorText}`);
  }

  const payload = await response.json();
  return payload.choices?.[0]?.message?.content || '';
}

export async function askGroqJSON(systemPrompt, userPrompt) {
  const first = await callGroq(systemPrompt, userPrompt);

  try {
    return extractJSON(first);
  } catch (error) {
    const retry = await callGroq(
      systemPrompt,
      userPrompt,
      `Your previous response could not be parsed as JSON: ${error.message}. Return corrected strict JSON only.`
    );
    return extractJSON(retry);
  }
}
