/**
 * Provider signature classification is maintained in the shared detector.
 * Re-export it here to give the CAPTCHA subsystem a stable import boundary.
 */
export {
  detectChallenge,
  type ChallengeDetectionInput,
  type ChallengeDetectionResult,
  type ChallengeProvider,
  type ChallengeEvidence,
} from '../../shared/challenge-detection.js';
