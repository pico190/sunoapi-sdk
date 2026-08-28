/**
 * WAV conversion resource — convert generated audio to high-quality WAV.
 */
import { HttpClient } from '../client.js';
import {
  ConvertToWavParams,
  TaskCreated,
  WavConversionRecord,
} from '../types.js';

export class WavResource {
  constructor(private readonly http: HttpClient) {}

  /** Convert a generated track to WAV. Returns a task id. */
  generate(params: ConvertToWavParams): Promise<TaskCreated> {
    return this.http.request('POST', '/api/v1/wav/generate', { body: params });
  }

  /** Poll the conversion status / result for a WAV task. */
  getRecordInfo(taskId: string): Promise<WavConversionRecord> {
    return this.http.request('GET', '/api/v1/wav/record-info', {
      query: { taskId },
    });
  }
}
