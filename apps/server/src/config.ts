import { z } from 'zod';

export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  const values = z
    .object({
      NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
      PORT: z.coerce.number().int().min(1).max(65535).default(3001),
      MONGODB_URI: z.string().min(1),
      WEB_ORIGIN: z.url().default('http://localhost:8081'),
      SESSION_DAYS: z.coerce.number().int().min(1).max(180).default(90),
      SENDGRID_API_KEY: z.string().optional(),
      SENDGRID_FROM_EMAIL: z.string().optional(),
      DEEPSEEK_API_KEY: z.string().optional(),
      DEEPSEEK_TRANSLATION_MODEL: z.string().optional(),
      DEEPSEEK_ASSISTANT_MODEL: z.string().optional(),
    })
    .parse(env);
  if (values.NODE_ENV === 'production' && !values.WEB_ORIGIN.startsWith('https://')) {
    throw new Error('WEB_ORIGIN must use HTTPS in production');
  }
  return values;
}
export type Config = ReturnType<typeof readConfig>;
