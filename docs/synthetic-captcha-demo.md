# Synthetic CAPTCHA demo

## Purpose

This is an educational, local-only demonstration of a challenge lifecycle. It
generates simple arithmetic prompts and verifies answers against an in-memory
server-side record.

It is not a CAPTCHA solver for reCAPTCHA, hCaptcha, Turnstile, DataDome,
Akamai, Zoho, or any other third-party provider. It does not automate
third-party challenge widgets, generate provider tokens, inject tokens into
pages, or bypass anti-bot controls.

## Enablement

The demo is disabled by default. To enable it in a local development process:

```bash
CAPTCHA_DEMO_ENABLED=true
```

Do not enable this demonstration in a production deployment. It is intended
for local learning and automated unit tests only.

## Example

```ts
import {
  SyntheticCaptchaDemoService,
  solveSyntheticChallenge,
} from '../src/captcha-solver/demo/index.js';

const service = new SyntheticCaptchaDemoService({ enabled: true });
const challenge = service.createChallenge();

console.log(challenge.prompt);

const result = await solveSyntheticChallenge(challenge, service);
console.log(result.status); // verified
```

The public challenge contains only an ID, prompt, type and timestamps. The
expected answer remains in the service's in-memory record. The demonstration
solver parses the arithmetic prompt, computes the answer and submits it to the
same local verifier.

## Lifecycle and safeguards

- Challenges expire after a configurable TTL (60 seconds by default).
- Incorrect answers consume an attempt.
- Three attempts are allowed by default.
- A verified, failed or expired challenge cannot be reused.
- Unknown challenge IDs are rejected.
- The demo refuses to run unless explicitly enabled.

## Limitations

- State is in-memory and is lost when the process restarts.
- The arithmetic prompt is intentionally trivial and is not a security
  mechanism.
- This module is not connected to Browserless navigation, provider adapters,
  external websites, or Rejekt job submission.
- It must not be used as a production anti-bot or CAPTCHA verification system.

## Tests

Run the repository test suite or build the project and execute the compiled
Mocha tests. The spec covers enablement, successful synthetic verification,
incorrect answers, attempt limits, expiry and unknown challenge IDs.
