/**
 * Challenge-page classification only. This module does not solve, bypass,
 * suppress, or submit challenge responses.
 */
export type ChallengeProvider =
  | 'recaptcha' | 'hcaptcha' | 'turnstile' | 'cloudflare' | 'datadome'
  | 'akamai' | 'perimeterx' | 'imperva' | 'kasada' | 'aws-waf'
  | 'geetest' | 'arkose' | 'friendlycaptcha' | 'altcha' | 'keycaptcha'
  | 'tencent' | 'yandex' | 'aliyun' | 'mtcaptcha' | 'botdetect'
  | 'captcha-com' | 'securimage' | 'zoho' | 'generic';

export interface ChallengeEvidence {
  provider: ChallengeProvider;
  signals: string[];
}

export interface ChallengeDetectionInput {
  url?: string;
  title?: string;
  text?: string;
  html?: string;
  scriptUrls?: string[];
  iframeUrls?: string[];
  selectors?: string[];
  formFields?: string[];
  responseHeaders?: Record<string, string>;
  responseStatus?: number;
}

export interface ChallengeDetectionResult {
  detected: boolean;
  providers: ChallengeProvider[];
  evidence: ChallengeEvidence[];
  requiresHumanReview: boolean;
}

const PROVIDER_RULES: Array<{
  provider: ChallengeProvider;
  rules: Array<{ label: string; pattern: RegExp }>;
}> = [
  { provider: 'recaptcha', rules: [
    { label: 'Google reCAPTCHA script or widget', pattern: /(?:google\.com|recaptcha\.net)\/recaptcha|g-recaptcha|grecaptcha|g-recaptcha-response/i },
  ] },
  { provider: 'hcaptcha', rules: [
    { label: 'hCaptcha script, widget, or response field', pattern: /(?:js|newassets|assets)\.hcaptcha\.com|hcaptcha\.com|h-captcha|h-captcha-response/i },
  ] },
  { provider: 'turnstile', rules: [
    { label: 'Cloudflare Turnstile widget', pattern: /challenges\.cloudflare\.com\/turnstile|cf-turnstile(?:-response)?/i },
  ] },
  { provider: 'cloudflare', rules: [
    { label: 'Cloudflare managed challenge', pattern: /cdn-cgi\/challenge-platform|__cf_chl_|cf-chl-|cf_chl_|cf-mitigated:\s*challenge|cf-browser-verification/i },
  ] },
  { provider: 'datadome', rules: [
    { label: 'DataDome challenge resource or marker', pattern: /datadome|captcha-delivery\.com|geo\.captcha-delivery\.com|dd-captcha/i },
  ] },
  { provider: 'akamai', rules: [
    { label: 'Akamai challenge marker', pattern: /akamai.{0,100}(?:captcha|challenge)|\/akam\/[^\s"'<>]*(?:captcha|challenge)/i },
  ] },
  { provider: 'perimeterx', rules: [
    { label: 'HUMAN / PerimeterX challenge marker', pattern: /perimeterx.{0,100}(?:captcha|challenge)|humansecurity.{0,100}(?:captcha|challenge)|_pxcaptcha|px-captcha-modal|px-block/i },
  ] },
  { provider: 'imperva', rules: [
    { label: 'Imperva / Incapsula challenge marker', pattern: /imperva.{0,100}(?:captcha|challenge)|incapsula.{0,100}(?:captcha|challenge)|\/_?incapsula_resource|imperva-captcha/i },
  ] },
  { provider: 'kasada', rules: [
    { label: 'Kasada challenge marker', pattern: /kasada.{0,100}(?:captcha|challenge)|kpsdk.{0,100}(?:captcha|challenge)|ips\.html/i },
  ] },
  { provider: 'aws-waf', rules: [
    { label: 'AWS WAF CAPTCHA marker', pattern: /aws-waf-token|awswaf|captcha\.awswaf\.com|aws-waf-captcha/i },
  ] },
  { provider: 'geetest', rules: [
    { label: 'GeeTest widget or script', pattern: /geetest\.com|gt\.js|geetest-captcha/i },
  ] },
  { provider: 'arkose', rules: [
    { label: 'Arkose Labs / FunCaptcha marker', pattern: /arkoselabs|funcaptcha|fc-token|arkose-token/i },
  ] },
  { provider: 'friendlycaptcha', rules: [
    { label: 'Friendly Captcha marker', pattern: /friendlycaptcha|frc-captcha/i },
  ] },
  { provider: 'altcha', rules: [
    { label: 'ALTCHA marker', pattern: /altcha/i },
  ] },
  { provider: 'keycaptcha', rules: [
    { label: 'KeyCAPTCHA marker', pattern: /keycaptcha/i },
  ] },
  { provider: 'tencent', rules: [
    { label: 'Tencent CAPTCHA marker', pattern: /captcha\.tencentcloud\.com|tencentcloud.*captcha|tcaptcha/i },
  ] },
  { provider: 'yandex', rules: [
    { label: 'Yandex SmartCaptcha marker', pattern: /smartcaptcha\.yandexcloud\.net|captcha-api\.yandex\.ru/i },
  ] },
  { provider: 'aliyun', rules: [
    { label: 'Alibaba Cloud CAPTCHA marker', pattern: /captcha\.aliyun\.com|aliyuncs\.com\/captcha|aliyun.?captcha/i },
  ] },
  { provider: 'mtcaptcha', rules: [
    { label: 'MTCaptcha marker', pattern: /mtcaptcha|mtcapcha/i },
  ] },
  { provider: 'botdetect', rules: [
    { label: 'BotDetect marker', pattern: /botdetect(?:captcha)?|captcha\.ashx/i },
  ] },
  { provider: 'captcha-com', rules: [
    { label: 'CAPTCHA.com marker', pattern: /captcha\.com|captcha-com/i },
  ] },
  { provider: 'securimage', rules: [
    { label: 'Securimage marker', pattern: /securimage(?:_show)?|securimage_show\.php/i },
  ] },
  { provider: 'zoho', rules: [
    { label: 'Zoho native CAPTCHA marker', pattern: /zohocaptcha|zcaptcha|zoho.{0,80}(?:captcha|challenge)/i },
  ] },
];

const GENERIC_RULES = [
  { label: 'Human-verification language', pattern: /verify (?:that )?you are human|prove you are human|human verification/i },
  { label: 'Security-check language', pattern: /complete the security check|security check required|additional verification required/i },
  { label: 'Unusual-traffic language', pattern: /unusual traffic|automated requests|suspicious activity detected/i },
  { label: 'Generic CAPTCHA field or widget', pattern: /(?:captcha|challenge)[-_ ]?(?:response|token|input|image|widget)|data-sitekey/i },
];

export function detectChallenge(input: ChallengeDetectionInput): ChallengeDetectionResult {
  const fields = [
    input.url, input.title, input.text, input.html,
    ...(input.scriptUrls || []), ...(input.iframeUrls || []),
    ...(input.selectors || []), ...(input.formFields || []),
    ...Object.entries(input.responseHeaders || {})
      .filter(([key]) => /^(?:cf-mitigated|x-(?:datadome|akamai|iinfo|captcha|waf)(?:-|$))/i.test(key))
      .map(([key, value]) => `${key}: ${value.slice(0, 300)}`),
  ].filter((value): value is string => typeof value === 'string');
  const source = fields.join('\n');
  const evidence: ChallengeEvidence[] = [];

  for (const { provider, rules } of PROVIDER_RULES) {
    const signals = rules.filter(({ pattern }) => pattern.test(source)).map(({ label }) => label);
    if (signals.length) evidence.push({ provider, signals });
  }

  const genericSignals = GENERIC_RULES
    .filter(({ pattern }) => pattern.test(source))
    .map(({ label }) => label);
  if (genericSignals.length) evidence.push({ provider: 'generic', signals: genericSignals });

  const providers = evidence.map(({ provider }) => provider);
  return {
    detected: evidence.length > 0,
    providers,
    evidence,
    requiresHumanReview: evidence.length > 0,
  };
}
