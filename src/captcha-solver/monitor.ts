import type { Page } from 'puppeteer-core';
import { EventEmitter } from 'events';
import { detectChallenge } from '../shared/challenge-detection.js';
import { captchaOrchestrator } from './router.js';
import type { CaptchaChallenge } from './types.js';

export const captchaEvents = new EventEmitter();
captchaEvents.setMaxListeners(100);
const monitoredPages = new WeakSet<Page>();

export function monitorCaptchaOnPage(page: Page): void {
  if (process.env.CAPTCHA_MONITOR_ENABLED !== 'true' || monitoredPages.has(page)) return;
  monitoredPages.add(page);
  let inspecting = false;

  const inspect = async () => {
    if (inspecting || page.isClosed()) return;
    inspecting = true;
    try {
      const [pageUrl, pageTitle, visibleText] = await Promise.all([
        Promise.resolve(page.url()),
        page.title().catch(() => ''),
        page.evaluate(() => (document.body?.innerText || '').slice(0, 12000)).catch(() => ''),
      ]);
      if (!pageUrl || pageUrl === 'about:blank') return;
      const detection = detectChallenge({ url: pageUrl, title: pageTitle, text: visibleText });
      if (!detection.detected) return;

      const challenge: CaptchaChallenge = {
        page, pageUrl, pageTitle,
        providers: detection.providers,
        evidence: detection.evidence,
        detectedAt: new Date().toISOString(),
      };
      const session = await captchaOrchestrator.inspect(challenge);
      if (!session) return;
      captchaEvents.emit('session', session);
      if (session.status === 'needs_human_review') {
        captchaEvents.emit('needs_human_review', session);
        await notifyReviewWebhook(session);
      }
    } catch {
      // Navigation races and closed pages must not interrupt browser sessions.
    } finally {
      inspecting = false;
    }
  };

  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) setTimeout(() => void inspect(), 400);
  });
  page.on('response', (response) => {
    if (response.request().isNavigationRequest()) void inspect();
  });
}

async function notifyReviewWebhook(session: {
  id: string; status: string; pageUrl: string; providers: string[]; expiresAt: string;
}): Promise<void> {
  const endpoint = process.env.CAPTCHA_REVIEW_WEBHOOK_URL;
  const secret = process.env.CAPTCHA_CALLBACK_SECRET;
  if (!endpoint || !secret) return;
  try {
    const { signCaptchaCallback } = await import('./verification.js');
    const payload = JSON.stringify({
      sessionId: session.id, status: session.status, pageUrl: session.pageUrl,
      providers: session.providers, expiresAt: session.expiresAt,
    });
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-captcha-signature': signCaptchaCallback(payload, secret) },
      body: payload,
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Do not log challenge contents, callback secrets, or session credentials.
  }
}
