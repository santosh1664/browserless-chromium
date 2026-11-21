import { detectChallenge } from '../shared/challenge-detection.js';
import { captchaAdapterRegistry } from './registry.js';
import { captchaSessionManager } from './session-manager.js';
import type { CaptchaChallenge, CaptchaSession } from './types.js';

export class CaptchaOrchestrator {
  async inspect(challenge: CaptchaChallenge): Promise<CaptchaSession | null> {
    const detection = detectChallenge({
      url: challenge.pageUrl,
      title: challenge.pageTitle,
      text: challenge.evidence.map((item) => item.signals.join(' ')).join(' '),
    });
    if (!detection.detected && challenge.providers.length === 0) return null;

    const origin = new URL(challenge.pageUrl).origin;
    const session = captchaSessionManager.create({
      pageUrl: challenge.pageUrl,
      pageOrigin: origin,
      providers: [...new Set(challenge.providers.length ? challenge.providers : detection.providers)],
      evidence: challenge.evidence,
    });

    for (const provider of session.providers) {
      const adapter = captchaAdapterRegistry.get(provider);
      if (!adapter) continue;
      captchaSessionManager.transition(session.id, 'verifying');
      try {
        const result = await adapter.verify(challenge);
        if (result.verified) {
          return captchaSessionManager.transition(
            session.id,
            'verified',
            result.reference ? `Verified: ${result.reference}` : 'Site verifier confirmed the challenge',
          ) || session;
        }
      } catch {
        // Adapter errors are deliberately reduced to a safe review reason.
      }
    }

    return captchaSessionManager.transition(
      session.id,
      'needs_human_review',
      'No configured site-owned verifier confirmed the challenge',
    ) || session;
  }
}

export const captchaOrchestrator = new CaptchaOrchestrator();
