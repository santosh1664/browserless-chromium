export type RetryDecision = {
  retry: boolean;
  delayMs: number;
  reason: string;
};

/** Retry only transient infrastructure failures, never a challenge result. */
export function classifyRetry(error: unknown, attempt: number, maxAttempts = 3): RetryDecision {
  const message = error instanceof Error ? error.message : String(error);
  const transient = /timeout|temporar|econnreset|econnrefused|socket|network|429|502|503|504/i.test(message);
  if (!transient || attempt >= maxAttempts) {
    return { retry: false, delayMs: 0, reason: 'Non-transient failure or retry limit reached' };
  }
  return {
    retry: true,
    delayMs: Math.min(30_000, 500 * 2 ** Math.max(0, attempt)),
    reason: 'Transient infrastructure failure',
  };
}
