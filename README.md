<p align="center">
  <a href="https://abrova.ir">
    <img src="https://abrova.ir/icon.svg" alt="Abrova" width="120" />
  </a>
</p>

<h3 align="center">Abrova Auth Admin SDK</h3>

<p align="center">
  Abrova Auth for your server: custom claims, users and sessions, with the Firebase Admin SDK's names.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5+" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License" />
</p>

---

## Features

- **Custom claims**: `setCustomUserClaims(uid, claims)` puts facts like `{ plan: 'pro' }` into every token of the user
- **Users**: `getUser(uid)` answers the user with its sign-in methods, times and claims
- **Sessions**: `revokeRefreshTokens(uid)` signs the user out on every device
- **Server only**: it holds your server secret and refuses to run in a browser
- **Zero dependencies**, TypeScript declarations included, Node 18+

## Installation

The package is published on [Abrova Center](https://center.abrova.ir). Add this line to your project's `.npmrc`:

```ini
@abrova:registry=https://center.abrova.ir/api/packages/abrova/npm/
```

Then install:

```bash
npm install @abrova/auth-admin
```

## Quick start

Set three environment variables on your server (Console › Project settings): `ABROVA_PROJECT_ID`, `ABROVA_API_KEY`
(`ab_live_…`) and `ABROVA_SERVER_SECRET` (`ab_srv_…`). Never put the server secret in an app.

```ts
import { initAdmin } from '@abrova/auth-admin';

const auth = initAdmin();

// After your server confirmed a payment:
await auth.setCustomUserClaims(userId, { plan: 'pro' });
```

The user's next token carries `plan: 'pro'`: at the next sign-in or refresh (within an hour), or at once when the app
calls `getTokenResult({ forceRefresh: true })`. Abrova Sync rules read it as `auth.token.plan`.

## Custom claims

- `setCustomUserClaims` **replaces** all of the user's claims. `null` or `{}` removes them. To add one, read them with
  `getUser`, change them and write them back.
- Values are JSON: text, numbers, true / false, null, lists and objects, nested at most 5 levels, at most 1000 bytes.
- Some names are taken by the token itself and are refused, for example `sub`, `exp`, `iat`, `auth_time`, `amr`, `pid`,
  `meta`.
- A token is signed, not encrypted: the app can read it. Put roles, plans and ids in claims, never e-mails, phone
  numbers or secrets.

```ts
const user = await auth.getUser(userId);
await auth.setCustomUserClaims(userId, { ...user.customClaims, beta: true });
```

## Users and sessions

```ts
const user = await auth.getUser(userId);
// { uid, email, emailVerified, phoneNumber, displayName, disabled, providerData, metadata,
//   customClaims, tokensValidAfterTime, anonymous }

await auth.revokeRefreshTokens(userId); // signs the user out everywhere
```

## Options

```ts
initAdmin({
  projectId: '…',        // default: ABROVA_PROJECT_ID
  apiKey: 'ab_live_…',   // default: ABROVA_API_KEY
  serverSecret: 'ab_srv_…', // default: ABROVA_SERVER_SECRET
});
```

## Errors

Every error is an `AbrovaAuthAdminError` with `code` and `status`: `INVALID_CLAIMS` (the message says which claim),
`USER_NOT_FOUND`, `UNAUTHENTICATED` (wrong key or secret, or an address the project's IP allow-list doesn't allow),
`RATE_LIMITED`, `NETWORK`.

## Not using Node?

The same calls are plain HTTPS requests with the `x-api-key` and `x-server-secret` headers; see
[Admin API](https://abrova.ir/docs/auth/admin-sdk).

## Documentation

- [Custom claims](https://abrova.ir/docs/auth/custom-claims)
- [Admin SDK](https://abrova.ir/docs/auth/admin-sdk)

## Support

- **Documentation**: [Abrova Auth Docs](https://abrova.ir/docs/auth/quick-start)
- **Issues**: [GitHub Issues](https://github.com/Abrova-co/abrova_auth_node_sdk/issues)
- **Email**: support@abrova.ir

## License

MIT License - see [LICENSE](LICENSE) for details.
