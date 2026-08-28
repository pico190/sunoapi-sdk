/**
 * Vocal / stem separation resource.
 *
 * Split a track into vocals + accompaniment, common stems, or a single
 * advanced instrument.
 */
import { HttpClient } from '../client.js';
import {
  SeparateVocalsParams,
  TaskCreated,
  VocalSeparationRecord,
} from '../types.js';

export class SeparationResource {
  constructor(private readonly http: HttpClient) {}

  /** Start a separation job. Returns a task id. */
  generate(params: SeparateVocalsParams): Promise<TaskCreated> {
    return this.http.request('POST', '/api/v1/vocal-removal/generate', { body: params });
  }

  /** Poll the separation result for a task. */
  getRecordInfo(taskId: string): Promise<VocalSeparationRecord> {
    return this.http.request('GET', '/api/v1/vocal-removal/record-info', {
      query: { taskId },
    });
  }
}
