/** Any JSON value a custom claim can hold. */
export type ClaimValue = string | number | boolean | null | ClaimValue[] | { [name: string]: ClaimValue };
/** Custom claims: names to JSON values, at most 1000 bytes, values nested at most 5 levels. */
export type CustomClaims = Record<string, ClaimValue>;

/** A `fetch` the SDK can use (Node 18+ has one built in). */
export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string },
) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

export interface AbrovaAuthAdminConfig {
  /** The project's id (Console › Project settings). Default: the ABROVA_PROJECT_ID environment variable. */
  projectId?: string;
  /** The project's public key (`ab_live_…`). Default: ABROVA_API_KEY. */
  apiKey?: string;
  /** The project's server secret (`ab_srv_…`). Server only, never in an app. Default: ABROVA_SERVER_SECRET. */
  serverSecret?: string;
  /** Default: https://auth-users.abrova.ir */
  baseUrl?: string;
  /** Default: the global fetch. */
  fetch?: FetchLike;
}

/** Firebase's UserRecord, with the fields Abrova Auth holds. Times are UTC ISO strings. */
export interface UserRecord {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  displayName: string | null;
  disabled: boolean;
  /** Linked sign-in methods: `google`, `apple`, `password`, `telegram`, `magic_link`. Empty for an anonymous user. */
  providerData: { providerId: string }[];
  metadata: { creationTime: string; lastSignInTime: string | null; lastRefreshTime: string | null };
  /** `{}` when none. */
  customClaims: CustomClaims;
  /** The last time all of the user's sessions were ended (revokeRefreshTokens, sign out everywhere…), or null. */
  tokensValidAfterTime: string | null;
  /** An anonymous user (Abrova extra; in Firebase, a user without providers). */
  anonymous: boolean;
}
