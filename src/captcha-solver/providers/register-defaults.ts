import { captchaAdapterRegistry } from '../registry.js';
import { RecaptchaAdapter } from './recaptcha.adapter.js';
import { HcaptchaAdapter } from './hcaptcha.adapter.js';
import { TurnstileAdapter } from './turnstile.adapter.js';
import { DatadomeAdapter } from './datadome.adapter.js';
import { ZohoAdapter } from './zoho.adapter.js';

/** Register safe placeholders; each returns unverified until a real integration is configured. */
for (const adapter of [
  new RecaptchaAdapter(),
  new HcaptchaAdapter(),
  new TurnstileAdapter(),
  new DatadomeAdapter(),
  new ZohoAdapter(),
]) {
  if (!captchaAdapterRegistry.get(adapter.provider)) {
    captchaAdapterRegistry.register(adapter);
  }
}
