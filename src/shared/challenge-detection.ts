/**
 * Lightweight challenge-page classification for browser automation clients.
 *
 * This module only detects and classifies challenge indicators. It does not
 * solve, bypass, suppress, or submit challenge responses.
 */

export type ChallengeProvider =
  | 'recaptcha'
  | 'hcaptcha'
  | 'turnstile'
  | 'datadome'
  | 'generic';

export interface ChallengeEvidence {
  provider: ChallengeProvider;
  signals: string[];
}

export interface ChallengeDetectionInput {
  url?: string;
  title?: string;
  text?: string;
  html?: string;
}

export interface ChallengeDetectionResult {
  detected: boolean;
  providers: ChallengeProvider[];
  evidence: ChallengeEvidence[];
  requiresHumanReview: boolean;
}

const PROVIDER_PATTERNS: Array<{
  provider: ChallengeProvider;
  patterns: RegExp[];
}> = [
  {
    provider: 'recaptcha',
    patterns: [
      /google\.com\/recaptcha/i,
      /g-recaptcha/i,
      /grecaptcha/i,
      /recaptcha\/api/i,
    ],
  },
  {
    provider: 'hcaptcha',
    patterns: [
      /hcaptcha\.com/i,
      /h-captcha/i,
      /hcaptcha/i,
    ],
  },
  {
    provider: 'turnstile',
    patterns: [
      /challenges\.cloudflare\.com\/turnstile/i,
      /cf-turnstile/i,
      /turnstile/i,
    ],
  },
  {
    provider: 'datadome',
    patterns: [
      /datadome/i,
      /captcha-delivery\.com/i,
    ],
  },
];

const GENERIC_PATTERNS = [
  /verify (that )?you are human/i,
  /human verification/i,
  /unusual traffic/i,
  /security check/i,
  /complete the security check/i,
  /automated requests/i,
];

export function detectChallenge(
  input: ChallengeDetectionInput,
): ChallengeDetectionResult {
  const source = [input.url, input.title, input.text, input.html]
    .filter((value): value is string => typeof value === 'string')
    .join('\n');

  const evidence: ChallengeEvidence[] = [];

  for (const { provider, patterns } of PROVIDER_PATTERNS) {
    const signals = patterns
      .filter((pattern) => pattern.test(source))
      .map((pattern) => pattern.source);

    if (signals.length) evidence.push({ provider, signals });
  }

  const genericSignals = GENERIC_PATTERNS
    .filter((pattern) => pattern.test(source))
    .map((pattern) => pattern.source);

  if (genericSignals.length) {
    evidence.push({ provider: 'generic', signals: genericSignals });
  }

  const providers = evidence.map(({ provider }) => provider);

  return {
    detected: evidence.length > 0,
    providers,
    evidence,
    requiresHumanReview: evidence.length > 0,
  };
}
