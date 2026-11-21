import { captchaSessionManager } from './session-manager.js';
import { verifyCaptchaCallback } from './verification.js';

export interface CaptchaCallbackPayload {
  sessionId: string;
  status: 'verified' | 'failed' | 'needs_human_review';
  pageOrigin: string;
  correlationId?: string;
  reference?: string;
}

export function handleCaptchaCallback(
  rawBody: string,
  signature: string,
  secret = process.env.CAPTCHA_CALLBACK_SECRET,
): { accepted: boolean; sessionId?: string; status?: string } {
  if (!verifyCaptchaCallback(rawBody, signature, secret)) {
    return { accepted: false };
  }

  let payload: CaptchaCallbackPayload;
  try {
    payload = JSON.parse(rawBody) as CaptchaCallbackPayload;
  } catch {
    return { accepted: false };
  }

  if (
    !payload.sessionId ||
    !['verified', 'failed', 'needs_human_review'].includes(payload.status)
  ) {
    return { accepted: false };
  }

  const current = captchaSessionManager.get(payload.sessionId);
  if (
    !current ||
    current.pageOrigin !== payload.pageOrigin ||
    (payload.correlationId !== undefined && current.correlationId !== payload.correlationId) ||
    ['verified', 'failed', 'expired'].includes(current.status)
  ) {
    return { accepted: false };
  }

  const updated = captchaSessionManager.transition(
    payload.sessionId,
    payload.status,
    payload.reference ? `Callback reference: ${payload.reference}` : undefined,
  );
  if (!updated) return { accepted: false };

  return { accepted: true, sessionId: updated.id, status: updated.status };
}
