import { expect } from 'chai';
import { signCaptchaCallback, verifyCaptchaCallback } from './verification.js';

describe('CAPTCHA callback signatures', () => {
  it('accepts a valid HMAC signature', () => {
    const body = JSON.stringify({ sessionId: 'session-1', status: 'verified' });
    const signature = signCaptchaCallback(body, 'unit-test-secret');
    expect(verifyCaptchaCallback(body, signature, 'unit-test-secret')).to.equal(true);
  });

  it('rejects a changed body or wrong secret', () => {
    const body = JSON.stringify({ sessionId: 'session-1', status: 'verified' });
    const signature = signCaptchaCallback(body, 'unit-test-secret');
    expect(verifyCaptchaCallback(body + ' ', signature, 'unit-test-secret')).to.equal(false);
    expect(verifyCaptchaCallback(body, signature, 'different-secret')).to.equal(false);
  });
});
