export {
  type CaptchaChallenge,
  type CaptchaEvidence,
  type CaptchaSession,
  type CaptchaSessionStatus,
  type CaptchaVerificationResult,
} from '../types.js';

export type CaptchaProviderName =
  | 'recaptcha' | 'hcaptcha' | 'turnstile' | 'cloudflare'
  | 'datadome' | 'akamai' | 'perimeterx' | 'imperva'
  | 'kasada' | 'aws-waf' | 'geetest' | 'arkose'
  | 'friendlycaptcha' | 'altcha' | 'keycaptcha'
  | 'tencent' | 'yandex' | 'aliyun' | 'mtcaptcha'
  | 'botdetect' | 'captcha-com' | 'securimage' | 'zoho' | 'generic';
