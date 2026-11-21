import { createHmac, timingSafeEqual } from 'crypto';

export function signCaptchaCallback(
  rawBody: string,
  secret = process.env.CAPTCHA_CALLBACK_SECRET,
): string {
  if (!secret || secret.length < 32) {
    throw new Error('CAPTCHA_CALLBACK_SECRET must contain at least 32 characters');
  }
  return createHmac('sha256', secret).update(rawBody).digest('hex');
}

export function verifyCaptchaCallback(
  rawBody: string,
  signature: string,
  secret = process.env.CAPTCHA_CALLBACK_SECRET,
): boolean {
  if (!secret || secret.length < 32 || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = Buffer.from(signCaptchaCallback(rawBody, secret), 'hex');
  let supplied: Buffer;
  try {
    supplied = Buffer.from(signature, 'hex');
  } catch {
    return false;
  }
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
