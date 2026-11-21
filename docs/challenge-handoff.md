# CAPTCHA Detection and Human Handoff

This integration detects and classifies common CAPTCHA and bot-management
challenges in Chromium pages. It is a detection and human-handoff capability:
it does not solve, bypass, suppress, or submit challenge responses.

## Supported provider signatures

The detector currently recognizes indicators for:

- Google reCAPTCHA
- hCaptcha
- Cloudflare Turnstile
- Cloudflare managed/browser-integrity challenge pages
- DataDome
- Akamai Bot Manager
- HUMAN / PerimeterX
- Imperva / Incapsula
- Kasada
- AWS WAF CAPTCHA
- GeeTest
- Arkose Labs / FunCaptcha
- Friendly Captcha
- ALTCHA
- KeyCAPTCHA
- Tencent CAPTCHA
- Yandex SmartCaptcha
- Alibaba Cloud CAPTCHA
- MTCaptcha
- BotDetect CAPTCHA
- CAPTCHA.com
- Securimage
- Zoho CAPTCHA markers
- Generic or site-native CAPTCHA and human-verification indicators

This is not a guarantee that every vendor or every future variant is
recognized. Providers change markup and endpoints; custom implementations may
have no public signature. A generic result means the page contains CAPTCHA or
human-verification indicators but the vendor could not be identified.

## Detect a live Puppeteer page

The page helper collects the URL, title, a bounded amount of visible page text,
script and iframe URLs, and CAPTCHA-related DOM attributes. It does not read
cookie values, form values, response tokens, or interact with challenge UI.

```ts
import { detectChallengeOnPage } from '@browserless.io/browserless';

const challenge = await detectChallengeOnPage(page);

if (challenge.requiresHumanReview) {
  return {
    status: 'needs_human_review',
    challenge,
  };
}
```

## Classify supplied evidence

For applications that already collect page metadata, call the pure classifier
directly. Pass cookie names only, never cookie values.

```ts
import { detectChallenge } from '@browserless.io/browserless';

const challenge = detectChallenge({
  url: pageUrl,
  title: pageTitle,
  text: visibleText,
  scriptUrls,
  iframeUrls,
  selectors: captchaRelatedElementDescriptions,
  formFields: inputNamesAndTypes,
  responseStatus,
});

if (challenge.detected) {
  // Pause automation and route the existing session to human review.
}
```

The result contains:

- `detected`: whether one or more supported indicators matched.
- `providers`: unique provider classifications.
- `evidence`: human-readable matched indicators and the evidence sources.
- `requiresHumanReview`: true whenever a challenge is detected.

An HTTP 403 or 429 by itself is not classified as a CAPTCHA. It must be
accompanied by a challenge-specific marker.

## Human handoff

When a challenge is detected, pause the workflow and preserve the session for
an approved human review flow. Do not automatically retry or submit the form
while the result is unresolved.

A handoff record should contain:

- A caller-generated idempotency key.
- A short-lived session reference, never a raw browser token.
- The target origin and task identifier.
- Challenge providers and detection evidence.
- A bounded expiry time.
- A callback destination configured by the service operator.

The integration layer should authenticate callers, validate target origins
against an explicit allowlist, enforce per-caller concurrency and timeouts,
and sign callbacks (for example, HMAC-SHA256 over the exact request body with
a timestamp and replay window). Keep credentials in a secret manager or
environment variables; never put them in URLs, browser-visible page state, or
logs.

## Limitations and validation

Detection is evidence-based, not proof of provider identity or successful
verification. Some bot-management products operate without displaying a
CAPTCHA; some custom CAPTCHA implementations have no stable public marker.
False positives and false negatives are possible. Keep the evidence in logs
with sensitive values removed, and validate provider signatures against pages
you control.

A challenge detection result is not a successful verification and is not a
submission result. Only report a task as submitted after the destination
application provides an independently observable confirmation. If the result
is ambiguous, return an uncertain state for review to prevent duplicate
submissions.

Run the focused test suite with:

```bash
npm test -- --grep "challenge detection"
```
