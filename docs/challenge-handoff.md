# Challenge Detection and Human Handoff

This integration adds a small, reusable challenge-classification utility to the
browser platform. It is intentionally a detection and handoff capability: it
does not solve or bypass CAPTCHA, bot-management, or access-control challenges.

## What it provides

- Detects common page markers for reCAPTCHA, hCaptcha, Cloudflare Turnstile,
  DataDome, and generic human-verification pages.
- Returns provider classifications and the matched signal patterns.
- Marks any detected challenge as requiring human review.
- Leaves browser lifecycle, authentication, concurrency, and remote WebSocket
  transport to the existing Browserless runtime.

## Usage from a browser automation client

After navigation, collect the page URL, title, visible text, and (when useful)
HTML, then call the helper:

```ts
import { detectChallenge } from './shared/challenge-detection.js';

const result = detectChallenge({
  url: page.url(),
  title: await page.title(),
  text: await page.locator('body').innerText().catch(() => ''),
  html: await page.content(),
});

if (result.requiresHumanReview) {
  // Stop automation. Preserve the session for an approved human review flow.
  // Do not attempt to solve or bypass the challenge.
  return {
    status: 'needs_human_review',
    challenge: result,
  };
}
```

## Recommended external handoff contract

An application integrating this browser service can use the following states:

```text
queued -> running -> completed
                 -> failed
                 -> needs_human_review
```

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

## Submission integrity

A challenge detection result is not a successful verification and is not a
submission result. Only report a task as submitted after the destination
application provides an independently observable confirmation. If the result
is ambiguous, do not retry automatically; return an uncertain state for
review to prevent duplicate submissions.

## Tests

The helper is covered by focused unit tests for the supported provider markers,
generic verification pages, and ordinary pages. Run the repository test suite
with `npm test`.
