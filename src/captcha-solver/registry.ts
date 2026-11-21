import type { CaptchaProviderAdapter } from './types.js';

export class CaptchaAdapterRegistry {
  private readonly adapters = new Map<string, CaptchaProviderAdapter>();

  register(adapter: CaptchaProviderAdapter): void {
    const key = adapter.provider.trim().toLowerCase();
    if (!key) throw new Error('A provider name is required');
    if (this.adapters.has(key)) {
      throw new Error(`A CAPTCHA adapter is already registered for "${key}"`);
    }
    this.adapters.set(key, adapter);
  }

  get(provider: string): CaptchaProviderAdapter | undefined {
    return this.adapters.get(provider.toLowerCase());
  }

  list(): string[] {
    return [...this.adapters.keys()].sort();
  }

  clear(): void {
    this.adapters.clear();
  }
}

export const captchaAdapterRegistry = new CaptchaAdapterRegistry();
