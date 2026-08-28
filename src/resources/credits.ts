/**
 * Account / credits resource.
 *
 * Exposes the remaining-credits endpoint so callers can check their balance
 * before kicking off expensive generations.
 */
import { HttpClient } from '../client.js';

export class CreditsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get your remaining subscription credits (USD).
   *
   * @returns the remaining credit amount as returned by the API (a number).
   */
  getRemaining(): Promise<number> {
    return this.http.request<number>('GET', '/api/v1/account/subscription/remain');
  }
}
