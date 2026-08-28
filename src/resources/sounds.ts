/**
 * Sound-effects generation resource.
 */
import { HttpClient } from '../client.js';
import { GenerateSoundsParams, TaskCreated } from '../types.js';

export class SoundsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Generate a sound effect from a text prompt (model `V5` only).
   * @returns a task id — poll {@link MusicResource.getRecordInfo} for the audio.
   */
  generate(params: GenerateSoundsParams): Promise<TaskCreated> {
    return this.http.request('POST', '/api/v1/generate/sounds', { body: params });
  }
}
