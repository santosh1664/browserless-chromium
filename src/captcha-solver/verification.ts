import { createHmac, timingSafeEqual } from 'crypto';

export function signCaptchaCallback(
  rawBody: string,
  secret = process.env.CAPTCHA_CALLBACK_SECRET,
): string {
  if (!secret) throw new Error('CAPTCHA_CALLBACK_SECRET is not configured');
  return createHmac('sha256', secret).update(rawBody).digest('hex');
}

export function verifyCaptchaCallback(
  rawBody: string,
  signature: string,
  secret = process.env.CAPTCHA_CALLBACK_SECRET,
): boolean {
  if (!secret || !signature) return false;
  const expected = Buffer.from(signCaptchaCallback(rawBody, secret), 'hex');
  let supplied: Buffer;
  try {
    supplied = Buffer.from(signature, 'hex');
  } catch {
    return false;
  }
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
