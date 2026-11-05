import { describe, expect, it, vi } from 'vitest';
import { AbrovaAuthAdminError, initAdmin } from '../src';
import type { FetchLike } from '../src';

const PROJECT = '0a000000-0000-4000-8000-00000000000a';
const KEY = `ab_live_${'a'.repeat(48)}`;
const SECRET = `ab_srv_${'1'.repeat(48)}`;
const USER = 'ru_0123456789ABCDEFabcdef';

function fake(reply: (url: string, init: any) => { status: number; body?: unknown }) {
  const calls: { url: string; init: any }[] = [];
  const fetch: FetchLike = vi.fn(async (url: string, init: any) => {
    calls.push({ url, init });
    const r = reply(url, init);
    const text = r.body === undefined ? '' : JSON.stringify(r.body);
    return { ok: r.status < 300, status: r.status, text: async () => text };
  }) as unknown as FetchLike;
  return { fetch, calls };
}
const admin = (fetch: FetchLike) => initAdmin({ projectId: PROJECT, apiKey: KEY, serverSecret: SECRET, fetch });

describe('@abrova/auth-admin (Firebase Admin SDK names)', () => {
  it('setCustomUserClaims: PUT with key + secret, the claims as sent; null removes', async () => {
    const f = fake(() => ({ status: 200, body: { customClaims: {}, updatedAt: '2026-11-05T00:00:00.000Z' } }));
    await admin(f.fetch).setCustomUserClaims(USER, { plan: 'pro', team: { id: 't1' } });
    await admin(f.fetch).setCustomUserClaims(USER, null);
    expect(f.calls[0].url).toBe(`https://auth-users.abrova.ir/v1/projects/${PROJECT}/users/${USER}/custom-claims`);
    expect(f.calls[0].init.method).toBe('PUT');
    expect(f.calls[0].init.headers).toMatchObject({ 'x-api-key': KEY, 'x-server-secret': SECRET, 'x-abrova-sdk': expect.stringMatching(/^auth-admin\/\d/) });
    expect(JSON.parse(f.calls[0].init.body)).toEqual({ claims: { plan: 'pro', team: { id: 't1' } } });
    expect(JSON.parse(f.calls[1].init.body)).toEqual({ claims: null });
  });

  it('getUser returns the UserRecord; revokeRefreshTokens POSTs', async () => {
    const record = { uid: USER, customClaims: { plan: 'pro' }, anonymous: true };
    const f = fake((url) => (url.endsWith('revoke-refresh-tokens') ? { status: 204 } : { status: 200, body: record }));
    expect(await admin(f.fetch).getUser(USER)).toEqual(record);
    await admin(f.fetch).revokeRefreshTokens(USER);
    expect(f.calls[1].init.method).toBe('POST');
    expect(f.calls[1].init.body).toBeUndefined();
  });

  it("the server's refusal arrives as a typed error with its code and message", async () => {
    const f = fake(() => ({ status: 400, body: { code: 'INVALID_CLAIMS', message: 'claims.sub: not an allowed name' } }));
    const err = await admin(f.fetch).setCustomUserClaims(USER, { sub: 'x' }).catch((e) => e);
    expect(err).toBeInstanceOf(AbrovaAuthAdminError);
    expect(err).toMatchObject({ code: 'INVALID_CLAIMS', status: 400, message: 'claims.sub: not an allowed name' });
    const down = fake(() => {
      throw new Error('ECONNREFUSED');
    });
    expect(await admin(down.fetch).getUser(USER).catch((e) => e.code)).toBe('NETWORK');
  });

  it('refuses a wrong setup or user id before any request', async () => {
    const f = fake(() => ({ status: 200 }));
    expect(() => initAdmin({ projectId: 'x', apiKey: KEY, serverSecret: SECRET, fetch: f.fetch })).toThrow(/projectId/);
    expect(() => initAdmin({ projectId: PROJECT, apiKey: 'x', serverSecret: SECRET, fetch: f.fetch })).toThrow(/apiKey/);
    expect(() => initAdmin({ projectId: PROJECT, apiKey: KEY, serverSecret: 'x', fetch: f.fetch })).toThrow(/serverSecret/);
    expect(await admin(f.fetch).getUser('../other').catch((e) => e.code)).toBe('USER_NOT_FOUND');
    expect(f.calls).toHaveLength(0);
  });

  it('reads the environment variables by default', async () => {
    const f = fake(() => ({ status: 200, body: {} }));
    Object.assign(process.env, { ABROVA_PROJECT_ID: PROJECT, ABROVA_API_KEY: KEY, ABROVA_SERVER_SECRET: SECRET });
    try {
      await initAdmin({ fetch: f.fetch }).getUser(USER);
      expect(f.calls[0].init.headers['x-server-secret']).toBe(SECRET);
    } finally {
      delete process.env.ABROVA_PROJECT_ID;
      delete process.env.ABROVA_API_KEY;
      delete process.env.ABROVA_SERVER_SECRET;
    }
  });

  it('never runs in a browser (it holds the server secret)', () => {
    const g = globalThis as any;
    g.window = {};
    g.document = {};
    try {
      expect(() => initAdmin({ projectId: PROJECT, apiKey: KEY, serverSecret: SECRET, fetch: fake(() => ({ status: 200 })).fetch })).toThrow(/never in a browser/);
    } finally {
      delete g.window;
      delete g.document;
    }
  });
});
