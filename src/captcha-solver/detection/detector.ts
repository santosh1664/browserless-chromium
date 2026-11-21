import {
  detectChallenge,
  type ChallengeDetectionInput,
  type ChallengeDetectionResult,
} from '../../shared/challenge-detection.js';

export function inspectCaptchaEvidence(
  input: ChallengeDetectionInput,
): ChallengeDetectionResult {
  return detectChallenge(input);
}
