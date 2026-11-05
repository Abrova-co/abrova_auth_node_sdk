## [0.1.0] - 2026-11-05

- First release, with the Firebase Admin SDK's names: `setCustomUserClaims(uid, claims)` (replaces all; `null`
  removes), `getUser(uid)` and `revokeRefreshTokens(uid)`.
- Reads `ABROVA_PROJECT_ID`, `ABROVA_API_KEY` and `ABROVA_SERVER_SECRET`; refuses to run in a browser.
- Typed errors (`AbrovaAuthAdminError` with `code` and `status`).
