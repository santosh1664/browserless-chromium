import { expect } from 'chai';

import { detectChallenge } from '../challenge-detection.js';

describe('challenge detection', () => {
  it('detects reCAPTCHA markers', () => {
    const result = detectChallenge({
      html: '<div class="g-recaptcha"></div>',
    });

    expect(result.detected).to.equal(true);
    expect(result.providers).to.include('recaptcha');
    expect(result.requiresHumanReview).to.equal(true);
  });

  it('detects hCaptcha markers', () => {
    const result = detectChallenge({
      url: 'https://js.hcaptcha.com/1/api.js',
    });

    expect(result.providers).to.include('hcaptcha');
  });

  it('detects Cloudflare Turnstile markers', () => {
    const result = detectChallenge({
      html: '<div class="cf-turnstile"></div>',
    });

    expect(result.providers).to.include('turnstile');
  });

  it('detects DataDome markers', () => {
    const result = detectChallenge({
      text: 'DataDome security check',
    });

    expect(result.providers).to.include('datadome');
  });

  it('classifies generic verification pages for review', () => {
    const result = detectChallenge({
      title: 'Security check',
      text: 'Verify that you are human to continue.',
    });

    expect(result.detected).to.equal(true);
    expect(result.providers).to.include('generic');
    expect(result.requiresHumanReview).to.equal(true);
  });

  it('detects providers from script and iframe URLs', () => {
    const result = detectChallenge({
      scriptUrls: ['https://smartcaptcha.yandexcloud.net/captcha.js'],
      iframeUrls: ['https://geo.captcha-delivery.com/captcha/'],
    });
    expect(result.providers).to.include.members(['yandex', 'datadome']);
  });

  it('detects native CAPTCHA fields without reading their values', () => {
    const result = detectChallenge({
      selectors: ['DIV data-sitekey'],
      formFields: ['captcha_response text'],
    });
    expect(result.detected).to.equal(true);
    expect(result.providers).to.include('generic');
  });

  it('does not treat a 403 or 429 status alone as a CAPTCHA', () => {
    const result = detectChallenge({ responseStatus: 403 });
    expect(result.detected).to.equal(false);
  });

  it('does not flag an ordinary page', () => {
    const result = detectChallenge({
      url: 'https://example.com/jobs',
      title: 'Open positions',
      text: 'Browse our current job openings.',
      html: '<main><h1>Careers</h1></main>',
    });

    expect(result.detected).to.equal(false);
    expect(result.providers).to.deep.equal([]);
    expect(result.requiresHumanReview).to.equal(false);
  });
});
