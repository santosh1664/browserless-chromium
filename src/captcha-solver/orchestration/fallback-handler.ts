import type { CaptchaSession } from '../types.js';

export function createHumanReviewResult(session: CaptchaSession, reason: string) {
  return {
    applicationId: session.correlationId,
    sessionId: session.id,
    status: 'NEEDS_YOU' as const,
    provider: session.providers,
    reason,
    expiresAt: session.expiresAt,
  };
}
