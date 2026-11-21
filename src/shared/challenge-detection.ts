/**
 * CAPTCHA and bot-challenge detection for Chromium pages.
 *
 * This module identifies challenge providers and returns evidence for an
 * application to pause automation and request human review. It deliberately
 * does not solve, bypass, hide, or submit challenge responses.
 */
import type { Page } from 'puppeteer-core';
export type ChallengeProvider =
  | 'recaptcha'
  | 'hcaptcha'
  | 'turnstile'
  | 'cloudflare'
  | 'datadome'
  | 'akamai'
  | 'perimeterx'
  | 'imperva'
  | 'kasada'
  | 'aws-waf'
  | 'geetest'
  | 'arkose'
  | 'friendlycaptcha'
  | 'altcha'
  | 'keycaptcha'
  | 'tencent'
  | 'yandex'
  | 'aliyun'
  | 'mtcaptcha'
  | 'botdetect'
  | 'captcha-com'
  | 'securimage'
  | 'zoho'
  | 'generic';
export interface ChallengeEvidence {
  provider: ChallengeProvider;
  /** Human-readable indicators; never contains form values or challenge tokens. */
  signals: string[];
  sources: string[];
}
export interface ChallengeDetectionInput {
  url?: string;
  title?: string;
  text?: string;
  html?: string;
  scriptUrls?: string[];
  iframeUrls?: string[];
  resourceUrls?: string[];
  selectors?: string[];
  formFields?: string[];
  headers?: Record<string, string>;
  responseStatus?: number;
}
export interface ChallengeDetectionResult {
  detected: boolean;
  providers: ChallengeProvider[];
  evidence: ChallengeEvidence[];
  requiresHumanReview: boolean;
}
interface ProviderRule {
  provider: ChallengeProvider;
  rules: Array<{ label: string; pattern: RegExp }>;
}
const PROVIDER_RULES: ProviderRule[] = [
  {
    provider: 'recaptcha',
    rules: [
      { label: 'Google reCAPTCHA script or frame', pattern: /(?:google\.com|recaptcha\.net)\/recaptcha|recaptcha\/api/i },
      { label: 'reCAPTCHA widget marker', pattern: /g-recaptcha|grecaptcha/i },
      { label: 'reCAPTCHA response field', pattern: /g-recaptcha-response/i },
    ],
  },
  {
    provider: 'hcaptcha',
    rules: [
      { label: 'hCaptcha script or frame', pattern: /(?:js|newassets|assets)\.hcaptcha\.com|hcaptcha\.com/i },
      { label: 'hCaptcha widget marker', pattern: /h-captcha|hcaptcha/i },
      { label: 'hCaptcha response field', pattern: /h-captcha-response/i },
    ],
  },
  {
    provider: 'turnstile',
    rules: [
      { label: 'Cloudflare Turnstile script or frame', pattern: /challenges\.cloudflare\.com\/turnstile/i },
      { label: 'Turnstile widget marker', pattern: /cf-turnstile|cf-turnstile-response/i },
    ],
  },
  {
    provider: 'cloudflare',
    rules: [
      { label: 'Cloudflare challenge platform', pattern: /cdn-cgi\/challenge-platform|__cf_chl_|cf-chl-|cf_chl_|cf-mitigated:\s*challenge/i },
      { label: 'Cloudflare challenge page marker', pattern: /just a moment\.\.\.|attention required! \| cloudflare|cf-browser-verification/i },
    ],
  },
  {
    provider: 'datadome',
    rules: [
      { label: 'DataDome script, frame, or endpoint', pattern: /datadome|captcha-delivery\.com|geo\.captcha-delivery\.com/i },
      { label: 'DataDome challenge marker', pattern: /dd\.(?:js|captcha)|datadome-captcha/i },
    ],
  },
  {
    provider: 'akamai',
    rules: [
      { label: 'Akamai CAPTCHA or challenge marker', pattern: /akamai.{0,100}(?:captcha|challenge)|\/akam\/[^\s"'<>]*(?:captcha|challenge)/i },
    ],
  },
  {
    provider: 'perimeterx',
    rules: [
      { label: 'PerimeterX / HUMAN challenge marker', pattern: /perimeterx.{0,100}(?:captcha|challenge)|humansecurity.{0,100}(?:captcha|challenge)|_pxcaptcha|px-captcha-modal|px-block/i },
    ],
  },
  {
    provider: 'imperva',
    rules: [
      { label: 'Imperva / Incapsula challenge marker', pattern: /imperva.{0,100}(?:captcha|challenge)|incapsula.{0,100}(?:captcha|challenge)|\/_?incapsula_resource|imperva-captcha/i },
    ],
  },
  {
    provider: 'kasada',
    rules: [
      { label: 'Kasada challenge marker', pattern: /kasada.{0,100}(?:captcha|challenge)|kpsdk.{0,100}(?:captcha|challenge)|ips\.html/i },
    ],
  },
  {
    provider: 'aws-waf',
    rules: [
      { label: 'AWS WAF CAPTCHA marker', pattern: /aws-waf-token|awswaf|captcha\.awswaf\.com|aws-waf-captcha/i },
    ],
  },
  {
    provider: 'geetest',
    rules: [
      { label: 'GeeTest script or widget', pattern: /geetest\.com|gt\.js|geetest|geetest-captcha/i },
    ],
  },
  {
    provider: 'arkose',
    rules: [
      { label: 'Arkose Labs or FunCaptcha script', pattern: /arkoselabs|funcaptcha|arkose/i },
      { label: 'Arkose frame or response field', pattern: /fc-token|arkose-token/i },
    ],
  },
  {
    provider: 'friendlycaptcha',
    rules: [
      { label: 'Friendly Captcha script or widget', pattern: /friendlycaptcha|friendlycaptcha\.com|frc-captcha/i },
    ],
  },
  {
    provider: 'altcha',
    rules: [
      { label: 'ALTCHA script or widget', pattern: /altcha|altcha\.org/i },
    ],
  },
  {
    provider: 'keycaptcha',
    rules: [
      { label: 'KeyCAPTCHA script or widget', pattern: /keycaptcha|keycaptcha\.com/i },
    ],
  },
  {
    provider: 'tencent',
    rules: [
      { label: 'Tencent CAPTCHA script or widget', pattern: /captcha\.tencentcloud\.com|tencentcloud.*captcha|tcaptcha/i },
    ],
  },
  {
    provider: 'yandex',
    rules: [
      { label: 'Yandex SmartCaptcha script or widget', pattern: /smartcaptcha(?:\.yandexcloud\.net|\.yandex\.ru)?|captcha-api\.yandex\.ru/i },
    ],
  },
  {
    provider: 'aliyun',
    rules: [
      { label: 'Alibaba Cloud CAPTCHA script or widget', pattern: /captcha\.aliyun\.com|aliyuncs\.com\/captcha|aliyun.?captcha/i },
    ],
  },
  {
    provider: 'mtcaptcha',
    rules: [
      { label: 'MTCaptcha script or widget', pattern: /mtcaptcha(?:\.com)?|mtcapcha/i },
    ],
  },
  {
    provider: 'botdetect',
    rules: [
      { label: 'BotDetect CAPTCHA script or widget', pattern: /botdetect(?:captcha)?|captcha\.ashx/i },
    ],
  },
  {
    provider: 'captcha-com',
    rules: [
      { label: 'CAPTCHA.com script or widget', pattern: /captcha\.com|captcha-com/i },
    ],
  },
  {
    provider: 'securimage',
    rules: [
      { label: 'Securimage native CAPTCHA marker', pattern: /securimage(?:_show)?|securimage_show\.php/i },
    ],
  },
  {
    provider: 'zoho',
    rules: [
      { label: 'Zoho CAPTCHA endpoint or widget', pattern: /(?:captcha|challenge)[^\s"'<>]{0,80}zoho|zoho[^\s"'<>]{0,80}(?:captcha|challenge)|zohocaptcha|zcaptcha/i },
    ],
  },
];
const GENERIC_RULES = [
  { label: 'Human-verification language', pattern: /verify (?:that )?you are human|prove you are human|human verification/i },
  { label: 'Security-check language', pattern: /complete the security check|security check required|additional verification required/i },
  { label: 'Unusual-traffic language', pattern: /unusual traffic|automated requests|suspicious activity detected/i },
  { label: 'CAPTCHA form field or widget', pattern: /(?:captcha|challenge)[-_ ]?(?:response|token|input|image|widget)?|data-sitekey/i },
  { label: 'Browser integrity challenge', pattern: /checking your browser|performing security verification|enable javascript and cookies to continue/i },
];
const PAGE_PROBE = () => {
  const body = document.body;
  const challengeElements = Array.from(
    document.querySelectorAll(
      [
        '[class*="captcha" i]',
        '[id*="captcha" i]',
        '[class*="challenge" i]',
        '[id*="challenge" i]',
        '[data-sitekey]',
        '[data-captcha]',
        'iframe[src*="captcha" i]',
        'iframe[src*="challenge" i]',
        'input[name*="captcha" i]',
        'input[id*="captcha" i]',
      ].join(','),
    ),
  ).slice(0, 100);
  const describe = (element: Element) => {
    const node = element as HTMLElement;
    return [
      element.tagName,
      node.id,
      typeof node.className === 'string' ? node.className : '',
      element.getAttribute('name') || '',
      element.getAttribute('title') || '',
      element.getAttribute('data-sitekey') ? 'data-sitekey' : '',
      element.getAttribute('data-captcha') || '',
      element.getAttribute('src') || '',
    ]
      .filter(Boolean)
      .join(' ');
  };
  return {
    url: location.href,
    title: document.title,
    text: (body?.innerText || '').slice(0, 20000),
    scriptUrls: Array.from(document.scripts)
      .map((script) => script.src)
      .filter(Boolean)
      .slice(0, 200),
    iframeUrls: Array.from(document.querySelectorAll('iframe'))
      .map((frame) => [frame.src, frame.title].filter(Boolean).join(' '))
      .filter(Boolean)
      .slice(0, 100),
    selectors: challengeElements.map(describe),
    formFields: Array.from(document.querySelectorAll('input, textarea'))
      .map((field) => {
        const input = field as HTMLInputElement;
        return [input.name, input.id, input.type].filter(Boolean).join(' ');
      })
      .filter(Boolean)
      .slice(0, 200),
  };
};
/**
 * Collects low-risk DOM indicators from a Puppeteer page and classifies them.
 * It reads names/attributes and visible text only; it never reads cookie values,
 * form values, challenge tokens, or attempts any interaction with a challenge.
 */
export async function detectChallengeOnPage(
  page: Page,
): Promise<ChallengeDetectionResult> {
  const input = await page.evaluate(PAGE_PROBE);
  return detectChallenge(input);
}
export function detectChallenge(
  input: ChallengeDetectionInput,
): ChallengeDetectionResult {
  const fields: Array<{ name: string; value: string }> = [];
  const add = (name: string, value?: string) => {
    if (typeof value === 'string' && value.length) {
      fields.push({ name, value });
    }
  };
  add('url', input.url);
  add('title', input.title);
  add('text', input.text);
  add('html', input.html);
  add('scripts', input.scriptUrls?.join('\n'));
  add('iframes', input.iframeUrls?.join('\n'));
  add('resources', input.resourceUrls?.join('\n'));
  add('DOM selectors', input.selectors?.join('\n'));
  add('form field names', input.formFields?.join('\n'));
  const challengeHeaders = Object.entries(input.headers || {}).filter(
    ([key]) =>
      /^(?:cf-mitigated|x-(?:datadome|akamai|iinfo|captcha|waf)(?:-|$))/i.test(
        key,
      ),
  );
  add(
    'challenge response headers',
    challengeHeaders
      .map(([key, value]) => `${key}: ${value.slice(0, 500)}`)
      .join('\n'),
  );
  if (input.responseStatus === 403 || input.responseStatus === 429) {
    add('HTTP status', String(input.responseStatus));
  }
  const evidence: ChallengeEvidence[] = [];
  for (const { provider, rules } of PROVIDER_RULES) {
    const matched = rules
      .map(({ label, pattern }) => ({
        label,
        sources: fields
          .filter(({ value }) => pattern.test(value))
          .map(({ name }) => name),
      }))
      .filter(({ sources }) => sources.length > 0);
    if (matched.length) {
      evidence.push({
        provider,
        signals: matched.map(({ label }) => label),
        sources: [...new Set(matched.flatMap(({ sources }) => sources))],
      });
    }
  }
  const genericMatches = GENERIC_RULES.map(({ label, pattern }) => ({
    label,
    sources: fields
      .filter(({ value }) => pattern.test(value))
      .map(({ name }) => name),
  })).filter(({ sources }) => sources.length > 0);
  // A 403/429 alone is not proof of CAPTCHA. Require a challenge-related
  // marker before classifying it as a generic human-review challenge.
  if (genericMatches.length) {
    evidence.push({
      provider: 'generic',
      signals: genericMatches.map(({ label }) => label),
      sources: [...new Set(genericMatches.flatMap(({ sources }) => sources))],
    });
  }
  const providers = evidence.map(({ provider }) => provider);
  return {
    detected: evidence.length > 0,
    providers,
    evidence,
    requiresHumanReview: evidence.length > 0,
  };
}