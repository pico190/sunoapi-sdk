/**
 * Error types thrown by the SunoAPI SDK.
 */

/**
 * Raised when the SunoAPI returns a non-success response envelope.
 *
 * @example
 * try {
 *   await api.music.generate(...);
 * } catch (err) {
 *   if (err instanceof SunoAPIError) {
 *     console.log(err.code, err.message); // e.g. 429 "Insufficient credits"
 *   }
 * }
 */
export class SunoAPIError extends Error {
  /** HTTP-like status code returned by the API (see `ERROR_CODES`). */
  public readonly code: number;

  constructor(code: number, message: string) {
    super(`SunoAPI error ${code}: ${message}`);
    this.name = 'SunoAPIError';
    this.code = code;
    // Restore prototype chain (TS target ES5/ES2015 compatibility).
    Object.setPrototypeOf(this, SunoAPIError.prototype);
  }
}

/**
 * Raised by `waitFor*` polling helpers when a task reaches a failed state.
 */
export class SunoTaskFailedError extends Error {
  /** The failed task id. */
  public readonly taskId: string;
  /** Optional raw error reason from the API. */
  public readonly reason?: string;

  constructor(taskId: string, reason?: string) {
    super(`Task "${taskId}" failed${reason ? `: ${reason}` : ''}`);
    this.name = 'SunoTaskFailedError';
    this.taskId = taskId;
    this.reason = reason;
    Object.setPrototypeOf(this, SunoTaskFailedError.prototype);
  }
}

/**
 * Raised by `waitFor*` polling helpers when a task does not finish within the
 * configured timeout.
 */
export class SunoTimeoutError extends Error {
  /** The task id that timed out. */
  public readonly taskId?: string;

  constructor(message: string, taskId?: string) {
    super(message);
    this.name = 'SunoTimeoutError';
    this.taskId = taskId;
    Object.setPrototypeOf(this, SunoTimeoutError.prototype);
  }
}

/**
 * Human-friendly descriptions for the SunoAPI error codes.
 */
export const ERROR_CODES: Record<number, string> = {
  200: 'Success',
  400: 'Invalid or missing parameters',
  401: 'Unauthorized — check your API key',
  404: 'Method or path not found',
  405: 'Rate limit exceeded',
  413: 'Prompt or style too long',
  429: 'Insufficient credits',
  430: 'Call frequency too high',
  455: 'System maintenance — please retry later',
  500: 'Server error',
};
