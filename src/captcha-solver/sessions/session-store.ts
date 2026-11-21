import type { CaptchaSession } from '../types.js';

/**
 * Storage contract. The current implementation remains in-memory;
 * use a durable adapter before running multiple Browserless replicas.
 */
export interface CaptchaSessionStore {
  get(id: string): Promise<CaptchaSession | undefined>;
  put(session: CaptchaSession): Promise<void>;
  delete(id: string): Promise<void>;
}
