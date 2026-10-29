import type { Config } from '../config.js';
import { fail } from '../domain.js';

export type IntelligenceTask = 'translation' | 'assistant';
export type Intelligence = (
  system: string,
  text: string,
  task: IntelligenceTask,
) => Promise<string>;

export function createIntelligence(config: Config, request: typeof fetch = fetch): Intelligence {
  return async (system, text, task) => {
    // The task selects the model; clients cannot request arbitrary provider models.
    const model =
      task === 'translation' ? config.DEEPSEEK_TRANSLATION_MODEL : config.DEEPSEEK_ASSISTANT_MODEL;
    if (!config.DEEPSEEK_API_KEY || !model) fail('AI_NOT_CONFIGURED', 503);
    let response: Response;
    try {
      response = await request('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        signal: AbortSignal.timeout(25000),
        headers: {
          Authorization: `Bearer ${config.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: text },
          ],
          stream: false,
          max_tokens: 3000,
        }),
      });
    } catch {
      fail('AI_UNAVAILABLE', 503);
    }
    if (!response.ok) fail('AI_UNAVAILABLE', 503);
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content || content.length > 30000) fail('AI_UNAVAILABLE', 503);
    return content;
  };
}
