import { expect } from 'chai';
import { signCaptchaCallback, verifyCaptchaCallback } from './verification.js';

describe('CAPTCHA callback signatures', () => {
  it('accepts a valid HMAC signature', () => {
    const body = JSON.stringify({ sessionId: 'session-1', status: 'verified' });
    const signature = signCaptchaCallback(body, 'unit-test-secret-that-is-at-least-32-chars');
    expect(verifyCaptchaCallback(body, signature, 'unit-test-secret-that-is-at-least-32-chars')).to.equal(true);
  });

  it('rejects a changed body or wrong secret', () => {
    const body = JSON.stringify({ sessionId: 'session-1', status: 'verified' });
    const signature = signCaptchaCallback(body, 'unit-test-secret-that-is-at-least-32-chars');
    expect(verifyCaptchaCallback(body + ' ', signature, 'unit-test-secret-that-is-at-least-32-chars')).to.equal(false);
    expect(verifyCaptchaCallback(body, signature, 'different-secret-that-is-also-32-chars-long')).to.equal(false);
  });
});
