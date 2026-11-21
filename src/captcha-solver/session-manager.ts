import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';
import type { CaptchaSession, CaptchaSessionStatus } from './types.js';

const DEFAULT_TTL_MS = 5 * 60 * 1000;

export class CaptchaSessionManager extends EventEmitter {
  private readonly sessions = new Map<string, CaptchaSession>();

  create(
    input: Omit<CaptchaSession, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'expiresAt'>,
    ttlMs = DEFAULT_TTL_MS,
  ): CaptchaSession {
    const now = new Date();
    for (const [id, existing] of this.sessions) {
      if (Date.parse(existing.expiresAt) <= now.getTime()) this.sessions.delete(id);
    }
    while (this.sessions.size >= 2000) {
      const oldest = this.sessions.keys().next().value;
      if (!oldest) break;
      this.sessions.delete(oldest);
    }
    const session: CaptchaSession = {
      ...input,
      id: randomUUID(),
      status: 'detected',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
    };
    this.sessions.set(session.id, session);
    this.emit('created', this.publicView(session));
    return this.publicView(session);
  }

  get(id: string): CaptchaSession | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    if (Date.parse(session.expiresAt) <= Date.now()) {
      if (['verified', 'failed', 'expired'].includes(session.status)) {
        return this.publicView(session);
      }
      return this.transition(id, 'expired', 'Session TTL elapsed');
    }
    return this.publicView(session);
  }

  transition(
    id: string,
    status: CaptchaSessionStatus,
    reason?: string,
  ): CaptchaSession | undefined {
    const current = this.sessions.get(id);
    if (!current) return undefined;
    const updated: CaptchaSession = {
      ...current,
      status,
      updatedAt: new Date().toISOString(),
      ...(reason ? { reason } : {}),
    };
    this.sessions.set(id, updated);
    this.emit('updated', this.publicView(updated));
    return this.publicView(updated);
  }

  list(): CaptchaSession[] {
    return [...this.sessions.values()]
      .map((session) => this.get(session.id))
      .filter((session): session is CaptchaSession => Boolean(session));
  }

  delete(id: string): boolean {
    return this.sessions.delete(id);
  }

  private publicView(session: CaptchaSession): CaptchaSession {
    return { ...session, providers: [...session.providers], evidence: [...session.evidence] };
  }
}

export const captchaSessionManager = new CaptchaSessionManager();
