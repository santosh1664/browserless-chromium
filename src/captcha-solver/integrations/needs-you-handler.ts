import type { CaptchaSession } from '../types.js';
import { RejektCaptchaClient } from './rejekt-client.js';

export async function notifyRejektNeedsYou(
  session: CaptchaSession,
  reason: string,
): Promise<void> {
  if (!session.correlationId) {
    throw new Error('Cannot notify Rejekt without an application correlation ID');
  }

  const client = new RejektCaptchaClient();
  await client.publish({
    applicationId: session.correlationId,
    sessionId: session.id,
    status: 'NEEDS_YOU',
    providers: session.providers,
    pageOrigin: session.pageOrigin,
    reason,
  });
}
