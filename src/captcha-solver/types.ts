import type { Page } from 'puppeteer-core';

export type CaptchaSessionStatus =
  | 'detected'
  | 'verifying'
  | 'needs_human_review'
  | 'verified'
  | 'failed'
  | 'expired';

export interface CaptchaEvidence {
  provider: string;
  signals: string[];
}

export interface CaptchaChallenge {
  page: Page;
  pageUrl: string;
  pageTitle: string;
  providers: string[];
  evidence: CaptchaEvidence[];
  detectedAt: string;
}

export interface CaptchaSession {
  id: string;
  status: CaptchaSessionStatus;
  pageUrl: string;
  pageOrigin: string;
  providers: string[];
  evidence: CaptchaEvidence[];
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  reason?: string;
}

export interface CaptchaVerificationResult {
  verified: boolean;
  provider: string;
  reference?: string;
  reason?: string;
}

/**
 * Plug-in contract for a verifier implemented separately.
 * Implementations must use a site's documented verification flow and must
 * not bypass third-party access controls.
 */
export interface CaptchaProviderAdapter {
  readonly provider: string;
  verify(challenge: CaptchaChallenge): Promise<CaptchaVerificationResult>;
}

export interface CaptchaSessionOptions {
  ttlMs?: number;
}
