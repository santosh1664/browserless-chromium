import './providers/register-defaults.js';
export * from './types.js';
export * from './registry.js';
export * from './session-manager.js';
export * from './router.js';
export * from './verification.js';
export * from './callback-handler.js';
export * from './monitor.js';

export * from './providers/provider.interface.js';
export * from './providers/provider-registry.js';
export * from './providers/unconfigured.adapter.js';
export * from './providers/recaptcha.adapter.js';
export * from './providers/hcaptcha.adapter.js';
export * from './providers/turnstile.adapter.js';
export * from './providers/datadome.adapter.js';
export * from './providers/zoho.adapter.js';
export * from './providers/register-defaults.js';
export * from './detection/detector.js';
export * from './orchestration/retry-policy.js';
export * from './orchestration/fallback-handler.js';
export * from './sessions/session-store.js';
export * from './integrations/webhook-client.js';
export * from './integrations/rejekt-client.js';
export * from './integrations/needs-you-handler.js';

// Educational local-only synthetic challenge demonstration.
export * from './demo/index.js';
