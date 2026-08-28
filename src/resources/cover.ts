/**
 * Cover-art generation resource.
 */
import { HttpClient } from '../client.js';
import {
  GenerateCoverParams,
  TaskCreated,
  CoverGenerationRecord,
} from '../types.js';

export class CoverResource {
  constructor(private readonly http: HttpClient) {}

  /** Generate cover art for an existing track. Returns a task id. */
  generate(params: GenerateCoverParams): Promise<TaskCreated> {
    return this.http.request('POST', '/api/v1/suno/cover/generate', { body: params });
  }

  /** Poll the cover-art result for a task. */
  getRecordInfo(taskId: string): Promise<CoverGenerationRecord> {
    return this.http.request('GET', '/api/v1/suno/cover/record-info', {
      query: { taskId },
    });
  }
}
