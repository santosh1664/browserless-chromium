import { expect } from 'chai';
import { CaptchaSessionManager } from './session-manager.js';

describe('CAPTCHA session manager', () => {
  it('creates a session and advances its lifecycle', () => {
    const manager = new CaptchaSessionManager();
    const session = manager.create({
      pageUrl: 'https://owned.example/form',
      pageOrigin: 'https://owned.example',
      providers: ['recaptcha'],
      evidence: [{ provider: 'recaptcha', signals: ['widget marker'] }],
    });
    expect(session.status).to.equal('detected');
    expect(manager.transition(session.id, 'needs_human_review')?.status).to.equal('needs_human_review');
    expect(manager.get(session.id)?.pageOrigin).to.equal('https://owned.example');
  });

  it('expires sessions after their TTL', () => {
    const manager = new CaptchaSessionManager();
    const session = manager.create({
      pageUrl: 'https://owned.example/form',
      pageOrigin: 'https://owned.example',
      providers: ['generic'],
      evidence: [{ provider: 'generic', signals: ['human verification'] }],
    }, -1);
    expect(manager.get(session.id)?.status).to.equal('expired');
  });
});
