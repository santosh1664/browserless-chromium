import type { Page } from 'puppeteer-core';
import { EventEmitter } from 'events';
import { detectChallenge } from '../shared/challenge-detection.js';
import { captchaOrchestrator } from './router.js';
import { captchaSessionManager } from './session-manager.js';
import type { CaptchaChallenge } from './types.js';

export const captchaEvents = new EventEmitter();
captchaEvents.setMaxListeners(100);
captchaSessionManager.on('created', (session) => captchaEvents.emit('session', session));
captchaSessionManager.on('updated', (session) => {
  captchaEvents.emit('session', session);
  captchaEvents.emit(session.status, session);
  if (session.status === 'needs_human_review') void notifyReviewWebhook(session);
});
const monitoredPages = new WeakSet<Page>();
const reportedChallenges = new WeakMap<Page, Set<string>>();

export function monitorCaptchaOnPage(page: Page, correlationId?: string): void {
  if (
    process.env.CAPTCHA_MONITOR_ENABLED !== 'true' ||
    !correlationId ||
    monitoredPages.has(page)
  ) return;
  monitoredPages.add(page);
  reportedChallenges.set(page, new Set());
  let inspecting = false;

  const inspect = async () => {
    if (inspecting || page.isClosed()) return;
    inspecting = true;
    try {
      const [pageUrl, pageTitle, pageSignals] = await Promise.all([
        Promise.resolve(page.url()),
        page.title().catch(() => ''),
        page.evaluate(() => ({
          text: (document.body?.innerText || '').slice(0, 12000),
          scriptUrls: Array.from(document.scripts)
            .map((item) => item.src)
            .filter(Boolean)
            .slice(0, 100),
          iframeUrls: Array.from(document.querySelectorAll('iframe'))
            .map((item) => item.src)
            .filter(Boolean)
            .slice(0, 50),
          selectors: Array.from(
            document.querySelectorAll(
              '[class*="captcha" i], [id*="captcha" i], [class*="challenge" i], [id*="challenge" i], [data-sitekey]',
            ),
          )
            .slice(0, 60)
            .map((item) =>
              [
                item.tagName,
                (item as HTMLElement).id,
                typeof (item as HTMLElement).className === 'string'
                  ? (item as HTMLElement).className
                  : '',
                item.getAttribute('data-sitekey') ? 'data-sitekey' : '',
              ]
                .filter(Boolean)
                .join(' '),
            ),
          formFields: Array.from(document.querySelectorAll('input, textarea'))
            .map((item) =>
              [
                (item as HTMLInputElement).name,
                (item as HTMLInputElement).id,
                (item as HTMLInputElement).type,
              ]
                .filter(Boolean)
                .join(' '),
            )
            .filter(Boolean)
            .slice(0, 100),
        })).catch(() => ({
          text: '',
          scriptUrls: [],
          iframeUrls: [],
          selectors: [],
          formFields: [],
        })),
      ]);
      if (!pageUrl || pageUrl === 'about:blank') return;
      // The Browserless API token authenticates the Rejekt caller. A trackingId
      // is required so only explicitly correlated Rejekt jobs enter this flow.

      const detection = detectChallenge({
        url: pageUrl,
        title: pageTitle,
        ...pageSignals,
      });
      if (!detection.detected) return;

      const challengeKey = `${pageUrl}|${detection.providers.slice().sort().join(',')}`;
      const reported = reportedChallenges.get(page) || new Set<string>();
      if (reported.has(challengeKey)) return;
      reported.add(challengeKey);
      reportedChallenges.set(page, reported);

      const safeCorrelationId = correlationId
        ?.replace(/[^a-zA-Z0-9._:-]/g, '')
        .slice(0, 128);
      const challenge: CaptchaChallenge = {
        page,
        pageUrl,
        pageTitle,
        ...(safeCorrelationId ? { correlationId: safeCorrelationId } : {}),
        providers: detection.providers,
        evidence: detection.evidence,
        detectedAt: new Date().toISOString(),
      };
      const session = await captchaOrchestrator.inspect(challenge);
      if (!session) return;


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
  id: string;
  status: string;
  pageUrl: string;
  pageOrigin: string;
  providers: string[];
  expiresAt: string;
  correlationId?: string;
}): Promise<void> {
  const endpoint = process.env.CAPTCHA_REVIEW_WEBHOOK_URL;
  const secret = process.env.CAPTCHA_CALLBACK_SECRET;
  if (!endpoint || !secret) return;
  try {
    if (new URL(endpoint).protocol !== 'https:') return;
    const { signCaptchaCallback } = await import('./verification.js');
    const payload = JSON.stringify({
      sessionId: session.id,
      correlationId: session.correlationId,
      status: session.status,
      pageUrl: session.pageUrl,
      pageOrigin: session.pageOrigin,
      providers: session.providers,
      expiresAt: session.expiresAt,
    });
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-captcha-signature': signCaptchaCallback(payload, secret),
      },
      body: payload,
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Do not log challenge contents, callback secrets, or session credentials.
  }
}
