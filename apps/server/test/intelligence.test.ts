import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createIntelligence } from '../src/adapters/intelligence.js';
import { readConfig } from '../src/config.js';

test('DeepSeek routes each task to its configured model and missing configuration makes no request', async () => {
  const config = readConfig({
    MONGODB_URI: 'mongodb://unused.test/hoteliva',
    DEEPSEEK_API_KEY: 'synthetic-test-key',
    DEEPSEEK_TRANSLATION_MODEL: 'translation-test-model',
    DEEPSEEK_ASSISTANT_MODEL: 'assistant-test-model',
  });
  const calls: { model: string; messages: { content: string }[] }[] = [];
  const request: typeof fetch = async (_url, options) => {
    calls.push(JSON.parse(String(options?.body)));
    return new Response(JSON.stringify({ choices: [{ message: { content: 'Test answer' } }] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  };
  const provider = createIntelligence(config, request);
  assert.equal(await provider('Translate', 'A szoba tiszta.', 'translation'), 'Test answer');
  assert.equal(await provider('Use handbook', 'How do I clean?', 'assistant'), 'Test answer');
  assert.deepEqual(
    calls.map((c) => c.model),
    ['translation-test-model', 'assistant-test-model'],
  );
  const translationOnly = createIntelligence(
    { ...config, DEEPSEEK_ASSISTANT_MODEL: undefined },
    request,
  );
  await assert.rejects(
    translationOnly('Use handbook', 'Question', 'assistant'),
    /AI_NOT_CONFIGURED/,
  );
  assert.equal(calls.length, 2);
  const noKey = createIntelligence({ ...config, DEEPSEEK_API_KEY: undefined }, request);
  await assert.rejects(noKey('Translate', 'Text', 'translation'), /AI_NOT_CONFIGURED/);
  assert.equal(calls.length, 2);
});
