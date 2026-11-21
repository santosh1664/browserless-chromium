import { expect } from 'chai';
import { handleCaptchaCallback } from './callback-handler.js';
import { captchaSessionManager } from './session-manager.js';
import { signCaptchaCallback } from './verification.js';

describe('CAPTCHA callback correlation', () => {
  const secret = 'unit-test-captcha-secret-with-more-than-32-characters';

  it('accepts a signed callback for the matching session and Rejekt job', () => {
    const session = captchaSessionManager.create({
      pageUrl: 'https://destination.example/apply',
      pageOrigin: 'https://destination.example',
      correlationId: 'application-123',
      providers: ['recaptcha'],
      evidence: [{ provider: 'recaptcha', signals: ['test marker'] }],
    });
    const payload = {
      sessionId: session.id,
      correlationId: 'application-123',
      status: 'verified',
      pageOrigin: 'https://destination.example',
    };
    const rawBody = JSON.stringify(payload);
    const result = handleCaptchaCallback(rawBody, signCaptchaCallback(rawBody, secret), secret);
    expect(result.accepted).to.equal(true);
    expect(captchaSessionManager.get(session.id)?.status).to.equal('verified');
  });

  it('rejects a callback for a different Rejekt job', () => {
    const session = captchaSessionManager.create({
      pageUrl: 'https://destination.example/apply',
      pageOrigin: 'https://destination.example',
      correlationId: 'application-456',
      providers: ['hcaptcha'],
      evidence: [{ provider: 'hcaptcha', signals: ['test marker'] }],
    });
    const payload = {
      sessionId: session.id,
      correlationId: 'another-application',
      status: 'verified',
      pageOrigin: 'https://destination.example',
    };
    const rawBody = JSON.stringify(payload);
    const result = handleCaptchaCallback(rawBody, signCaptchaCallback(rawBody, secret), secret);
    expect(result.accepted).to.equal(false);
    expect(captchaSessionManager.get(session.id)?.status).to.equal('detected');
  });
});
