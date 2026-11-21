import { captchaAdapterRegistry } from './registry.js';
import { captchaSessionManager } from './session-manager.js';
import type { CaptchaChallenge, CaptchaSession } from './types.js';

export class CaptchaOrchestrator {
  async inspect(challenge: CaptchaChallenge): Promise<CaptchaSession | null> {
    if (challenge.providers.length === 0) return null;

    let origin: string;
    try {
      origin = new URL(challenge.pageUrl).origin;
    } catch {
      return null;
    }

    const session = captchaSessionManager.create({
      pageUrl: challenge.pageUrl,
      pageOrigin: origin,
      providers: [...new Set(challenge.providers)],
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
        // Adapter errors are reduced to a safe human-review outcome.
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
