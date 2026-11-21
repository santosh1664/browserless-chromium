import { captchaAdapterRegistry } from '../registry.js';

export function resolveProviderAdapter(provider: string) {
  return captchaAdapterRegistry.get(provider);
}
