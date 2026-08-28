/**
 * Lyrics generation resource.
 */
import { HttpClient } from '../client.js';
import {
  GenerateLyricsParams,
  LyricsGenerationRecord,
  TaskCreated,
} from '../types.js';

export class LyricsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Generate lyrics from a description.
   * @returns a task id — poll {@link getRecordInfo} or use `api.waitForLyrics`.
   */
  generate(params: GenerateLyricsParams): Promise<TaskCreated> {
    return this.http.request('POST', '/api/v1/lyrics', { body: params });
  }

  /**
   * Retrieve the generated lyrics for a lyrics task.
   */
  getRecordInfo(taskId: string): Promise<LyricsGenerationRecord> {
    return this.http.request('GET', '/api/v1/lyrics/record-info', {
      query: { taskId },
    });
  }
}
