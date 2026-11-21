# CAPTCHA integration lifecycle

Browserless includes challenge detection and session orchestration. The provider
solver implementations are intentionally not included in this repository.

## Scope and safety

The integration is intended for sites you own or administer, using their
documented challenge-verification APIs. It does not automate interactions with
third-party anti-bot challenges, manufacture challenge tokens, or submit forms.
An unhandled challenge is paused for human review.

## Runtime configuration

Set these variables in the deployment environment:

| Variable | Required | Purpose |
| --- | --- | --- |
| `CAPTCHA_MONITOR_ENABLED` | Yes | Set to `true` to monitor newly created pages |
| `CAPTCHA_CALLBACK_SECRET` | For callbacks | High-entropy secret shared with your site-owned verification service |
| `CAPTCHA_REVIEW_WEBHOOK_URL` | Optional | HTTPS endpoint notified when a session needs human review |

Do not commit secrets to the repository. Keep Browserless behind TLS and restrict
the management API to trusted callers. The session and callback endpoints use
the Browserless API token in addition to the signed callback check.

## Flow

1. The Browserless page hook installs a lightweight navigation monitor.
2. After a main-frame navigation, the monitor reads the URL, title, visible
   text, script and iframe URLs, CAPTCHA-related element attributes, and form
   field names. It does not read input values, cookies, or challenge tokens.
3. The detector classifies known provider markers and records evidence labels.
4. The orchestrator looks for a registered provider adapter.
5. An adapter may call a documented verifier for a site you administer.
   Adapter implementations are deliberately not supplied here.
6. If no adapter confirms verification, Browserless creates a
   `needs_human_review` session and optionally sends a signed webhook.
7. A configured site-owned verifier can send a signed callback to
   `POST /captcha/callback`.
8. Session metadata can be queried at `GET /captcha/sessions` or
   `GET /captcha/sessions?sessionId=<id>`.

## Callback contract

The callback body is JSON with these fields:

```json
{
  "sessionId": "session UUID",
  "status": "verified",
  "pageOrigin": "https://your-owned-site.example",
  "reference": "optional verifier reference"
}
```

Sign the exact compact JSON body with HMAC-SHA256 using
`CAPTCHA_CALLBACK_SECRET` and send the lowercase hexadecimal digest in
`x-captcha-signature`. The callback is rejected if the signature is invalid,
the session is unknown/expired, or the page origin does not match the stored
session origin.

## Current limitations

- Session storage is in-memory and is lost when the process restarts.
- Sessions expire after five minutes by default.
- No solver implementation is included; provider files remain empty plug-in
  locations.
- A `verified` session records a trusted verifier result; it does not itself
  submit a form or prove that a website accepted a form submission.
- Browserless does not automatically resume a paused third-party workflow.
  The calling application must decide what to do after receiving the verified
  session event.
