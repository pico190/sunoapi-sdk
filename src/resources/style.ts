/**
 * Music-style boosting resource.
 *
 * Provides a quick way to describe a style that the API can later reuse.
 */
import { HttpClient } from '../client.js';
import { BoostMusicStyleParams } from '../types.js';

export class StyleResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Boost / describe a music style from a free-text description.
   * @returns the raw API response payload.
   */
  boost(params: BoostMusicStyleParams): Promise<Record<string, unknown>> {
    return this.http.request('POST', '/api/v1/style/generate', { body: params });
  }
}
