import { postSignedWebhook } from './webhook-client.js';

export interface RejektCaptchaEvent {
  applicationId: string;
  sessionId: string;
  status: 'NEEDS_YOU' | 'VERIFIED' | 'FAILED';
  providers: string[];
  pageOrigin: string;
  reason?: string;
}

export class RejektCaptchaClient {
  constructor(
    private readonly endpoint = process.env.REJEKT_CAPTCHA_WEBHOOK_URL,
    private readonly secret = process.env.CAPTCHA_CALLBACK_SECRET,
  ) {}

  async publish(event: RejektCaptchaEvent): Promise<void> {
    if (!this.endpoint) throw new Error('REJEKT_CAPTCHA_WEBHOOK_URL is not configured');
    if (!this.secret) throw new Error('CAPTCHA_CALLBACK_SECRET is not configured');
    await postSignedWebhook({
      endpoint: this.endpoint,
      secret: this.secret,
      payload: event as unknown as Record<string, unknown>,
    });
  }
}
