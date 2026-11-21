import { randomInt, randomUUID } from 'node:crypto';
import type {
  SyntheticChallenge,
  SyntheticChallengeOptions,
  SyntheticVerificationResult,
} from './types.js';

interface ChallengeRecord {
  publicChallenge: SyntheticChallenge;
  expectedAnswer: number;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'verified' | 'failed' | 'expired';
}

/**
 * Local educational challenge service.
 *
 * This service generates its own arithmetic puzzles and verifies answers
 * locally. It does not interact with third-party CAPTCHA providers, browser
 * challenge widgets, or remote websites.
 */
export class SyntheticCaptchaDemoService {
  private readonly records = new Map<string, ChallengeRecord>();
  private readonly enabled: boolean;
  private readonly ttlMs: number;
  private readonly maxAttempts: number;

  constructor(options: SyntheticChallengeOptions = {}) {
    this.enabled = options.enabled ?? process.env.CAPTCHA_DEMO_ENABLED === 'true';
    this.ttlMs = options.ttlMs ?? 60_000;
    this.maxAttempts = options.maxAttempts ?? 3;

    if (this.ttlMs <= 0) throw new Error('ttlMs must be greater than zero');
    if (this.maxAttempts < 1) throw new Error('maxAttempts must be at least one');
  }

  createChallenge(): SyntheticChallenge {
    this.assertEnabled();

    const left = randomInt(1, 10);
    const right = randomInt(1, 10);
    const now = Date.now();
    const challenge: SyntheticChallenge = {
      id: randomUUID(),
      kind: 'arithmetic-demo',
      prompt: `What is ${left} + ${right}?`,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + this.ttlMs).toISOString(),
    };

    this.records.set(challenge.id, {
      publicChallenge: challenge,
      expectedAnswer: left + right,
      attempts: 0,
      maxAttempts: this.maxAttempts,
      status: 'pending',
    });

    return { ...challenge };
  }

  verifyAnswer(id: string, answer: string): SyntheticVerificationResult {
    this.assertEnabled();

    const record = this.records.get(id);
    if (!record) {
      return {
        accepted: false,
        status: 'failed',
        attemptsRemaining: 0,
        reason: 'Unknown synthetic challenge',
      };
    }

    if (record.status !== 'pending') {
      return {
        accepted: record.status === 'verified',
        status: record.status,
        attemptsRemaining: Math.max(0, record.maxAttempts - record.attempts),
        reason: 'Challenge is no longer pending',
      };
    }

    if (Date.now() >= Date.parse(record.publicChallenge.expiresAt)) {
      record.status = 'expired';
      return {
        accepted: false,
        status: 'expired',
        attemptsRemaining: 0,
        reason: 'Synthetic challenge expired',
      };
    }

    record.attempts += 1;
    const normalized = answer.trim();
    const validFormat = /^\d{1,2}$/.test(normalized);
    const accepted = validFormat && Number(normalized) === record.expectedAnswer;

    if (accepted) {
      record.status = 'verified';
      return {
        accepted: true,
        status: 'verified',
        attemptsRemaining: record.maxAttempts - record.attempts,
      };
    }

    if (record.attempts >= record.maxAttempts) {
      record.status = 'failed';
    }

    return {
      accepted: false,
      status: record.status,
      attemptsRemaining: Math.max(0, record.maxAttempts - record.attempts),
      reason: record.status === 'failed'
        ? 'Maximum synthetic challenge attempts reached'
        : 'Incorrect synthetic answer',
    };
  }

  getStatus(id: string): SyntheticVerificationResult | undefined {
    this.assertEnabled();

    const record = this.records.get(id);
    if (!record) return undefined;

    if (
      record.status === 'pending' &&
      Date.now() >= Date.parse(record.publicChallenge.expiresAt)
    ) {
      record.status = 'expired';
    }

    return {
      accepted: record.status === 'verified',
      status: record.status,
      attemptsRemaining: Math.max(0, record.maxAttempts - record.attempts),
    };
  }

  private assertEnabled(): void {
    if (!this.enabled) {
      throw new Error(
        'Synthetic CAPTCHA demo is disabled. Set CAPTCHA_DEMO_ENABLED=true to enable it.',
      );
    }
  }
}
