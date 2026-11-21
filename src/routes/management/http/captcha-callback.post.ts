import {
  APITags,
  HTTPRoute,
  Methods,
  Request,
  contentTypes,
  jsonResponse,
} from '@browserless.io/browserless';
import type { ServerResponse } from 'http';
import { handleCaptchaCallback } from '../../../captcha-solver/callback-handler.js';

export default class CaptchaCallbackPostRoute extends HTTPRoute {
  name = 'CaptchaCallbackPostRoute';
  accepts = [contentTypes.json];
  auth = true;
  browser = null;
  concurrency = false;
  contentTypes = [contentTypes.json];
  description = 'Accepts signed verification callbacks from a configured site-owned verifier.';
  method = Methods.post;
  path = '/captcha/callback';
  tags = [APITags.management];

  async handler(req: Request, res: ServerResponse): Promise<void> {
    if (!req.body || typeof req.body !== 'object') {
      return jsonResponse(res, 400, { accepted: false, error: 'JSON body required' });
    }
    const signature = req.headers['x-captcha-signature'];
    const result = handleCaptchaCallback(
      JSON.stringify(req.body),
      Array.isArray(signature) ? signature[0] : signature || '',
    );
    if (!result.accepted) return jsonResponse(res, 401, { accepted: false });
    return jsonResponse(res, 200, result);
  }
}
