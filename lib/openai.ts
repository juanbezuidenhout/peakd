const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  category: 'skincare' | 'makeup' | 'hair' | 'lifestyle';
}

export interface AnalysisResult {
  aura_score: number;
  potential_score: number;
  face_shape: string;
  eye_type: string;
  color_season: string;
  skin_tone: string;
  archetype: string;
  archetype_description: string;
  top_features: string[];
  improvement_areas: string[];
  daily_tasks: DailyTask[];
}

const SYSTEM_PROMPT = `You are Peakd, an expert AI beauty coach. Analyze this face and return a JSON object with:
{
  aura_score: number (0-100, the user's current beauty potential score),
  potential_score: number (always 10-15 points higher than aura_score, represents achievable potential),
  face_shape: string (oval | round | heart | square | diamond | oblong),
  eye_type: string (almond | round | hooded | monolid | upturned | downturned | doe | siren),
  color_season: string (Spring Warm | Summer Cool | Autumn Warm | Winter Cool | High Contrast Winter | Soft Summer),
  skin_tone: string (fair | light | medium | tan | deep),
  archetype: string (a poetic 2-3 word beauty archetype label e.g. 'Ethereal Doe', 'Dark Siren', 'Golden Goddess', 'Soft Romantic'),
  archetype_description: string (1 sentence describing the archetype),
  top_features: string[] (2-3 standout positive features),
  improvement_areas: string[] (2-3 areas to focus on — phrased positively, e.g. 'Enhance eye definition'),
  daily_tasks: [
    { id: string, title: string, description: string, category: 'skincare'|'makeup'|'hair'|'lifestyle' },
    { id: string, title: string, description: string, category: string },
    { id: string, title: string, description: string, category: string }
  ]
}
Be specific, empowering, and accurate. Never use negative language.
Return ONLY valid JSON, no markdown.`;

// Coach Chat

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const COACH_SYSTEM_PROMPT = (scanContext: string | null) =>
  `You are Peakd Coach, an expert AI beauty and self-improvement coach. You are warm, empowering, specific, and concise. ${
    scanContext
      ? `The user's face analysis: ${scanContext}. Reference these details when giving personalized advice.`
      : 'The user has not completed a face scan yet. Encourage them to do one for personalized advice.'
  } Keep responses to 2-4 sentences. Be actionable. Never use negative language.`;

export async function chatWithCoach(
  messages: ChatMessage[],
  scanResult: string | null,
  apiKey: string,
): Promise<string> {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: COACH_SYSTEM_PROMPT(scanResult) },
        ...messages,
      ],
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from coach');
  }

  return content;
}

// Photo Analysis

export async function analyzePhoto(
  base64Image: string,
  apiKey: string,
): Promise<AnalysisResult> {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this selfie:' },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No analysis content returned');
  }

  return JSON.parse(content) as AnalysisResult;
}
