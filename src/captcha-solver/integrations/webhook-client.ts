import { signCaptchaCallback } from '../verification.js';

export interface SignedWebhookOptions {
  endpoint: string;
  secret: string;
  payload: Record<string, unknown>;
  timeoutMs?: number;
}

export async function postSignedWebhook(options: SignedWebhookOptions): Promise<void> {
  const endpoint = new URL(options.endpoint);
  if (endpoint.protocol !== 'https:') throw new Error('Webhook endpoint must use HTTPS');
  if (options.secret.length < 32) throw new Error('Webhook secret must be at least 32 characters');

  const body = JSON.stringify(options.payload);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-captcha-signature': signCaptchaCallback(body, options.secret),
    },
    body,
    signal: AbortSignal.timeout(options.timeoutMs ?? 5000),
  });
  if (!response.ok) throw new Error(`Webhook returned HTTP ${response.status}`);
}
