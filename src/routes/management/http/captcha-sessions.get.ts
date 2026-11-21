import {
  APITags,
  HTTPRoute,
  Methods,
  Request,
  contentTypes,
  jsonResponse,
} from '@browserless.io/browserless';
import type { ServerResponse } from 'http';
import { captchaSessionManager } from '../../../captcha-solver/session-manager.js';

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

