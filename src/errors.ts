/** Codes Abrova Auth answers with (plus `NETWORK` when it couldn't be reached). */
export type AbrovaAuthAdminErrorCode =
  | 'INVALID_CLAIMS'
  | 'USER_NOT_FOUND'
  | 'UNAUTHENTICATED'
  | 'RATE_LIMITED'
  | 'INVALID_INPUT'
  | 'INTERNAL'
  | 'NETWORK'
  | (string & {});

export class AbrovaAuthAdminError extends Error {
  constructor(
    readonly code: AbrovaAuthAdminErrorCode,
    message: string,
    /** The HTTP status, or 0 when the server couldn't be reached. */
    readonly status: number,
  ) {
    super(message);
    this.name = 'AbrovaAuthAdminError';
  }
}
