/**
 * MIDI generation resource — turn a separated track into MIDI instrument data.
 */
import { HttpClient } from '../client.js';
import {
  GenerateMidiParams,
  TaskCreated,
  MidiGenerationRecord,
} from '../types.js';

export class MidiResource {
  constructor(private readonly http: HttpClient) {}

  /** Generate MIDI from a completed separation task. Returns a task id. */
  generate(params: GenerateMidiParams): Promise<TaskCreated> {
    return this.http.request('POST', '/api/v1/midi/generate', { body: params });
  }

  /** Poll the MIDI generation result for a task. */
  getRecordInfo(taskId: string): Promise<MidiGenerationRecord> {
    return this.http.request('GET', '/api/v1/midi/record-info', {
      query: { taskId },
    });
  }
}
