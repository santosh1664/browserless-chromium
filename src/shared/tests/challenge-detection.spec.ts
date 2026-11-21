import { expect } from 'chai';

import { detectChallenge } from '../challenge-detection.js';

describe('challenge detection', () => {
  it('detects Google reCAPTCHA from a widget marker', () => {
    const result = detectChallenge({
      html: '<div class="g-recaptcha" data-sitekey="public-site-key"></div>',
    });

    expect(result.detected).to.equal(true);
    expect(result.providers).to.include('recaptcha');
    expect(result.requiresHumanReview).to.equal(true);
  });

  it('detects hCaptcha from a script URL', () => {
    const result = detectChallenge({
      scriptUrls: ['https://js.hcaptcha.com/1/api.js'],
    });

    expect(result.providers).to.include('hcaptcha');
  });

  it('detects Cloudflare Turnstile separately from a Cloudflare challenge page', () => {
    const turnstile = detectChallenge({
      selectors: ['DIV cf-turnstile'],
    });
    const managedChallenge = detectChallenge({
      url: 'https://example.com/cdn-cgi/challenge-platform/h/g/orchestrate/chl_page',
      text: 'Just a moment...',
    });

    expect(turnstile.providers).to.include('turnstile');
    expect(managedChallenge.providers).to.include('cloudflare');
  });

  it('detects DataDome challenge resources', () => {
    const result = detectChallenge({
      iframeUrls: ['https://geo.captcha-delivery.com/captcha/?initialCid=abc'],
    });

    expect(result.providers).to.include('datadome');
  });

  it('detects Akamai Bot Manager indicators', () => {
    const result = detectChallenge({
      resourceUrls: ['https://example.com/akam/13/captcha/challenge.js'],
    });

    expect(result.providers).to.include('akamai');
  });

  it('detects HUMAN / PerimeterX indicators', () => {
    const result = detectChallenge({
      scriptUrls: ['https://client.perimeterx.net/PXabc/captcha.js'],
    });

    expect(result.providers).to.include('perimeterx');
  });

  it('detects Imperva / Incapsula indicators', () => {
    const result = detectChallenge({
      html: '<script src="/_Incapsula_Resource?SWJIYLWA=abc"></script>',
    });

    expect(result.providers).to.include('imperva');
  });

  it('detects Kasada indicators', () => {
    const result = detectChallenge({
      resourceUrls: ['https://example.com/kpsdk/captcha.js'],
    });

    expect(result.providers).to.include('kasada');
  });

  it('detects AWS WAF CAPTCHA indicators', () => {
    const result = detectChallenge({
      html: '<script src="https://captcha.awswaf.com/..."></script>',
    });

    expect(result.providers).to.include('aws-waf');
  });

  it('detects GeeTest indicators', () => {
    const result = detectChallenge({
      scriptUrls: ['https://static.geetest.com/v4/gt4.js'],
    });

    expect(result.providers).to.include('geetest');
  });

  it('detects Arkose Labs / FunCaptcha indicators', () => {
    const result = detectChallenge({
      iframeUrls: ['https://client-api.arkoselabs.com/fc/gc/?token=redacted'],
    });

    expect(result.providers).to.include('arkose');
  });

  it('detects Friendly Captcha indicators', () => {
    const result = detectChallenge({
      selectors: ['DIV frc-captcha'],
    });

    expect(result.providers).to.include('friendlycaptcha');
  });

  it('detects ALTCHA indicators', () => {
    const result = detectChallenge({
      selectors: ['ALTCHA-WIDGET altcha'],
    });

    expect(result.providers).to.include('altcha');
  });

  it('detects KeyCAPTCHA indicators', () => {
    const result = detectChallenge({
      scriptUrls: ['https://backs.keycaptcha.com/swfs/cap.js'],
    });

    expect(result.providers).to.include('keycaptcha');
  });

  it('detects Tencent CAPTCHA indicators', () => {
    const result = detectChallenge({
      scriptUrls: ['https://captcha.tencentcloud.com/TCaptcha.js'],
    });

    expect(result.providers).to.include('tencent');
  });

  it('detects Yandex SmartCaptcha', () => {
    const result = detectChallenge({
      scriptUrls: ['https://smartcaptcha.yandexcloud.net/captcha.js'],
    });

    expect(result.providers).to.include('yandex');
  });

  it('detects Alibaba Cloud CAPTCHA', () => {
    const result = detectChallenge({
      scriptUrls: ['https://captcha.aliyun.com/captcha.js'],
    });

    expect(result.providers).to.include('aliyun');
  });

  it('detects MTCaptcha', () => {
    const result = detectChallenge({
      scriptUrls: ['https://service.mtcaptcha.com/mtcv1/client/mtcaptcha.min.js'],
    });

    expect(result.providers).to.include('mtcaptcha');
  });

  it('detects BotDetect CAPTCHA', () => {
    const result = detectChallenge({
      html: '<img src="/BotDetectCaptcha.ashx?get=image" />',
    });

    expect(result.providers).to.include('botdetect');
  });

  it('detects CAPTCHA.com', () => {
    const result = detectChallenge({
      scriptUrls: ['https://captcha.com/widget.js'],
    });

    expect(result.providers).to.include('captcha-com');
  });

  it('detects Securimage native CAPTCHA', () => {
    const result = detectChallenge({
      html: '<img src="/securimage_show.php" />',
    });

    expect(result.providers).to.include('securimage');
  });

  it('detects Zoho native CAPTCHA indicators', () => {
    const result = detectChallenge({
      html: '<div id="zohocaptcha"></div>',
    });

    expect(result.providers).to.include('zoho');
  });

  it('detects generic native CAPTCHA fields for manual review', () => {
    const result = detectChallenge({
      formFields: ['security_captcha text'],
    });

    expect(result.providers).to.include('generic');
    expect(result.requiresHumanReview).to.equal(true);
  });

  it('detects multiple providers on the same page', () => {
    const result = detectChallenge({
      scriptUrls: [
        'https://www.google.com/recaptcha/api.js',
        'https://js.hcaptcha.com/1/api.js',
      ],
    });

    expect(result.providers).to.include.members(['recaptcha', 'hcaptcha']);
  });

  it('detects Cloudflare challenges from the cf-mitigated response header', () => {
    const result = detectChallenge({
      headers: {
        'cf-mitigated': 'challenge',
        'set-cookie': 'session=must-not-be-inspected',
      },
    });

    expect(result.providers).to.include('cloudflare');
  });

  it('does not classify an HTTP status by itself as a CAPTCHA', () => {
    const result = detectChallenge({
      url: 'https://example.com/jobs',
      title: 'Forbidden',
      responseStatus: 403,
    });

    expect(result.detected).to.equal(false);
    expect(result.providers).to.deep.equal([]);
    expect(result.requiresHumanReview).to.equal(false);
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
