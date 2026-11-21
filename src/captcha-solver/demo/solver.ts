import type {
  SyntheticChallenge,
  SyntheticVerificationResult,
} from './types.js';
import { SyntheticCaptchaDemoService } from './service.js';

/**
 * Demonstrates a provider-style solver against the local arithmetic challenge.
 * It derives an answer only from the synthetic prompt and submits it to the
 * local verifier; it has no real CAPTCHA provider or browser integration.
 */
export async function solveSyntheticChallenge(
  challenge: SyntheticChallenge,
  verifier: SyntheticCaptchaDemoService,
): Promise<SyntheticVerificationResult> {
  if (challenge.kind !== 'arithmetic-demo') {
    return {
      accepted: false,
      status: 'failed',
      attemptsRemaining: 0,
      reason: 'Unsupported synthetic challenge type',
    };
  }

  const match = /^What is (\d{1,2}) \+ (\d{1,2})\?$/.exec(challenge.prompt);
  if (!match) {
    return {
      accepted: false,
      status: 'failed',
      attemptsRemaining: 0,
      reason: 'Synthetic prompt format is invalid',
    };
  }

  const answer = Number(match[1]) + Number(match[2]);
  return verifier.verifyAnswer(challenge.id, String(answer));
}
