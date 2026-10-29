import type { Config } from '../config.js';
import type { Locale } from '../domain.js';

export function createEmail(config: Config) {
  return async (email: string, token: string, locale: Locale) => {
    if (!config.SENDGRID_API_KEY || !config.SENDGRID_FROM_EMAIL) {
      throw Object.assign(new Error('EMAIL_NOT_CONFIGURED'), {
        code: 'EMAIL_NOT_CONFIGURED',
        status: 503,
      });
    }
    const link = `${config.WEB_ORIGIN}/?activation=${encodeURIComponent(token)}`;
    const hu = locale === 'hu';
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${config.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: { email: config.SENDGRID_FROM_EMAIL, name: 'Hoteliva' },
        personalizations: [{ to: [{ email }] }],
        subject: hu ? 'Aktiváld a Hoteliva-fiókodat' : 'Activate your Hoteliva account',
        content: [
          {
            type: 'text/plain',
            value: hu
              ? `Üdv a Hotelivában!\n\nÁllítsd be a jelszavadat: ${link}\n\nA hivatkozás 24 óráig érvényes.`
              : `Welcome to Hoteliva!\n\nSet your password: ${link}\n\nThis link expires in 24 hours.`,
          },
        ],
      }),
    });
    if (!response.ok)
      throw Object.assign(new Error('EMAIL_FAILED'), { code: 'EMAIL_FAILED', status: 502 });
  };
}
