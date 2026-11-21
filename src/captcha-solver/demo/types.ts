export type SyntheticChallengeStatus =
  | 'pending'
  | 'verified'
  | 'failed'
  | 'expired';

export interface SyntheticChallenge {
  id: string;
  kind: 'arithmetic-demo';
  prompt: string;
  createdAt: string;
  expiresAt: string;
}

export interface SyntheticVerificationResult {
  accepted: boolean;
  status: SyntheticChallengeStatus;
  attemptsRemaining: number;
  reason?: string;
}

export interface SyntheticChallengeOptions {
  enabled?: boolean;
  ttlMs?: number;
  maxAttempts?: number;
}
