import {
  APITags,
  BadRequest,
  HTTPRoute,
  Methods,
  Request,
  contentTypes,
  jsonResponse,
} from '@browserless.io/browserless';
import type { ServerResponse } from 'http';
import { captchaSessionManager } from '../../../captcha-solver/session-manager.js';
import { handleCaptchaCallback } from '../../../captcha-solver/callback-handler.js';

export default class CaptchaSessionsGetRoute extends HTTPRoute {
  name = 'CaptchaSessionsGetRoute';
  accepts = [contentTypes.any];
  auth = true;
  browser = null;
  concurrency = false;
  contentTypes = [contentTypes.json];
  description = 'Returns CAPTCHA review session metadata without page contents or response tokens.';
  method = Methods.get;
  path = '/captcha/sessions';
  tags = [APITags.management];

  async handler(req: Request, res: ServerResponse): Promise<void> {
    const sessionId = req.queryParams.sessionId as string | undefined;
    if (sessionId) {
      const session = captchaSessionManager.get(sessionId);
      if (!session) throw new BadRequest('Unknown or expired CAPTCHA session');
      return jsonResponse(res, 200, session);
    }
    return jsonResponse(res, 200, captchaSessionManager.list());
  }
}

export class CaptchaCallbackPostRoute extends HTTPRoute {
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
      throw new BadRequest('A JSON callback body is required');
    }
    const signature = req.headers['x-captcha-signature'];
    const result = handleCaptchaCallback(
      JSON.stringify(req.body),
      Array.isArray(signature) ? signature[0] : signature || '',
    );
    if (!result.accepted) {
      return jsonResponse(res, 401, { accepted: false });
    }
    return jsonResponse(res, 200, result);
  }
}
