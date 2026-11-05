import { AbrovaAuthAdminError } from './errors';
import type { AbrovaAuthAdminConfig, CustomClaims, FetchLike, UserRecord } from './types';
import { SDK_NAME, SDK_VERSION } from './version';

export const DEFAULT_BASE_URL = 'https://auth-users.abrova.ir';
const USER_ID = /^ru_[0-9A-Za-z]{22}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Abrova Auth for your SERVER, the Firebase Admin SDK model: custom claims, users and sessions. It holds the project's
 * server secret, so it refuses to run in a browser. Apps read claims with `getTokenResult()` in the Abrova Auth SDKs.
 */
export class AbrovaAuthAdmin {
  private readonly projectId: string;
  private readonly apiKey: string;
  private readonly serverSecret: string;
  private readonly baseUrl: string;
  private readonly fetch: FetchLike;

  constructor(config: AbrovaAuthAdminConfig = {}) {
    if (typeof (globalThis as { window?: unknown }).window !== 'undefined' && typeof (globalThis as { document?: unknown }).document !== 'undefined') {
      throw new AbrovaAuthAdminError('INVALID_INPUT', '@abrova/auth-admin holds your server secret: use it on your server, never in a browser', 0);
    }
    const env = (typeof process !== 'undefined' ? process.env : {}) as Record<string, string | undefined>;
    this.projectId = config.projectId ?? env.ABROVA_PROJECT_ID ?? '';
    this.apiKey = config.apiKey ?? env.ABROVA_API_KEY ?? '';
    this.serverSecret = config.serverSecret ?? env.ABROVA_SERVER_SECRET ?? '';
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    const f = config.fetch ?? (globalThis.fetch as unknown as FetchLike | undefined);
    if (!f) throw new AbrovaAuthAdminError('INVALID_INPUT', 'No fetch: use Node 18 or newer, or pass `fetch`', 0);
    this.fetch = f;
    if (!UUID.test(this.projectId)) throw new AbrovaAuthAdminError('INVALID_INPUT', 'projectId (or ABROVA_PROJECT_ID) must be the project id', 0);
    if (!this.apiKey.startsWith('ab_live_')) throw new AbrovaAuthAdminError('INVALID_INPUT', 'apiKey (or ABROVA_API_KEY) must be the ab_live_ key', 0);
    if (!this.serverSecret.startsWith('ab_srv_')) throw new AbrovaAuthAdminError('INVALID_INPUT', 'serverSecret (or ABROVA_SERVER_SECRET) must be the ab_srv_ secret', 0);
  }

  /**
   * Replaces ALL of the user's custom claims (Firebase's setCustomUserClaims). `null` or `{}` removes them. Every new
   * token of the user carries them: at the user's next sign-in or refresh (within an hour), or at once when the app
   * calls `getTokenResult({ forceRefresh: true })`. At most 1000 bytes of JSON; no personal or secret data (an app can
   * read its own token).
   */
  async setCustomUserClaims(uid: string, claims: CustomClaims | null): Promise<void> {
    await this.request('PUT', `${this.userPath(uid)}/custom-claims`, { claims });
  }

  /** The user as Firebase's getUser answers it, custom claims included. */
  async getUser(uid: string): Promise<UserRecord> {
    return (await this.request('GET', this.userPath(uid))) as UserRecord;
  }

  /**
   * Ends every session of the user (Firebase's revokeRefreshTokens): no refresh works any more, so the user signs in
   * again. Access tokens already issued stay valid until they expire (at most an hour).
   */
  async revokeRefreshTokens(uid: string): Promise<void> {
    await this.request('POST', `${this.userPath(uid)}/revoke-refresh-tokens`);
  }

  private userPath(uid: string): string {
    if (typeof uid !== 'string' || !USER_ID.test(uid)) {
      throw new AbrovaAuthAdminError('USER_NOT_FOUND', 'Not an Abrova Auth user id (ru_…)', 404);
    }
    return `/v1/projects/${this.projectId}/users/${uid}`;
  }

  private async request(method: string, path: string, body?: unknown): Promise<unknown> {
    let res: Awaited<ReturnType<FetchLike>>;
    try {
      res = await this.fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'content-type': 'application/json',
          'x-api-key': this.apiKey,
          'x-server-secret': this.serverSecret,
          'x-abrova-sdk': `auth-${SDK_NAME}/${SDK_VERSION}`,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch (err) {
      throw new AbrovaAuthAdminError('NETWORK', `Abrova Auth could not be reached: ${(err as Error).message}`, 0);
    }
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    if (!res.ok) {
      throw new AbrovaAuthAdminError(typeof json?.code === 'string' ? json.code : 'INTERNAL', typeof json?.message === 'string' ? json.message : `HTTP ${res.status}`, res.status);
    }
    return json;
  }
}

/** The admin SDK; with no options it reads ABROVA_PROJECT_ID, ABROVA_API_KEY and ABROVA_SERVER_SECRET. */
export function initAdmin(config: AbrovaAuthAdminConfig = {}): AbrovaAuthAdmin {
  return new AbrovaAuthAdmin(config);
}
