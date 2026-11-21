# Rejekt-to-Browserless integration

This document describes the Browserless side of the Rejekt integration. It
covers authenticated browser-session correlation, challenge detection, review
notification, and verification callbacks. It does not implement CAPTCHA
solving or third-party anti-bot bypass.

## 1. Start a browser session from Rejekt

Rejekt's worker connects to the Browserless Playwright WebSocket endpoint using
the Browserless API token and a per-application `trackingId`.

Example connection URL:

```text
ws://browserless.internal:3000/chromium/playwright?token=<BROWSERLESS_TOKEN>&trackingId=<APPLICATION_ID>
```

Use URL encoding for the token and tracking ID. Use TLS/WSS when the connection
crosses an untrusted network. Do not expose the Browserless token in browser
page URLs or client-side code.

The tracking ID is propagated into CAPTCHA session metadata as
`correlationId`. Browserless only activates CAPTCHA monitoring for pages
opened through a session with a tracking ID. There is no fixed destination
domain allowlist; the Browserless API token authenticates the caller.

## 2. Runtime configuration

Configure these values in the Browserless deployment:

```env
CAPTCHA_MONITOR_ENABLED=true
CAPTCHA_CALLBACK_SECRET=<at-least-32-random-characters>
CAPTCHA_REVIEW_WEBHOOK_URL=https://rejekt.example/api/browserless/captcha-review
```

The webhook endpoint must be HTTPS. Keep the callback secret out of source
control and use the same secret on the receiving Rejekt service.

## 3. Challenge notification

When a challenge is detected and no registered verification adapter confirms
it, Browserless transitions the session to `needs_human_review` and sends a
signed webhook. The payload contains:

```json
{
  "sessionId": "browserless-session-uuid",
  "correlationId": "rejekt-application-id",
  "status": "needs_human_review",
  "pageUrl": "https://destination.example/application",
  "pageOrigin": "https://destination.example",
  "providers": ["recaptcha"],
  "expiresAt": "2026-11-21T18:00:00.000Z"
}
```

The exact compact JSON request body is signed using HMAC-SHA256. The lowercase
hex digest is sent in the `x-captcha-signature` header. Rejekt should verify
the signature with constant-time comparison before accepting the notification.

Rejekt should use `correlationId` to update the matching application to
`NEEDS_YOU`. The Browserless session should remain open in the worker while
the review is pending; the Rejekt worker owns that browser connection and its
timeout policy.

## 4. Session status lookup

The authenticated Browserless management endpoints are:

- `GET /captcha/sessions`
- `GET /captcha/sessions?sessionId=<session-id>`

These return session metadata, not CAPTCHA response tokens or form values.

## 5. Verification callback

After a configured integration has verified a challenge through the site's
documented verification mechanism, the trusted integration can call:

`POST /captcha/callback`

Example body:

```json
{
  "sessionId": "browserless-session-uuid",
  "correlationId": "rejekt-application-id",
  "status": "verified",
  "pageOrigin": "https://destination.example",
  "reference": "verification-reference"
}
```

Sign the exact compact JSON body with HMAC-SHA256 using
`CAPTCHA_CALLBACK_SECRET`; send the lowercase hex digest in
`x-captcha-signature`. Browserless checks the signature, session ID, origin,
and correlation ID before accepting the transition.

A verified callback is a verification result only. It does not prove that an
application form was submitted or accepted. Rejekt must separately confirm the
destination site's submission result before marking an application
`SUBMITTED`.

## 6. Operational rules

- Rejekt is the source of browser jobs; each job must carry a unique tracking ID.
- Keep one isolated browser context per application.
- Do not treat CAPTCHA detection as CAPTCHA verification.
- Do not treat a verification callback as an application-submission receipt.
- Unsupported or failed verification remains `NEEDS_YOU`.
- Expired or disconnected sessions require a new browser session; do not
  silently report them as completed.
- The provider adapter files are scaffolding. No solver implementation is
  included in this repository.
