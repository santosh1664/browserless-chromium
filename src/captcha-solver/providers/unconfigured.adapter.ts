import type {
  CaptchaChallenge,
  CaptchaProviderAdapter,
  CaptchaVerificationResult,
} from '../types.js';

/**
 * Safe placeholder for a provider integration that has not been configured.
 * It deliberately does not interact with challenge widgets or generate tokens.
 */
export class UnconfiguredProviderAdapter implements CaptchaProviderAdapter {
  constructor(readonly provider: string) {}

  async verify(_challenge: CaptchaChallenge): Promise<CaptchaVerificationResult> {
    return {
      verified: false,
      provider: this.provider,
      reason: 'Provider verification integration is not configured',
    };
  }
}
