/**
 * Music-video (MP4) generation resource.
 */
import { HttpClient } from '../client.js';
import {
  CreateMusicVideoParams,
  TaskCreated,
  MusicVideoRecord,
} from '../types.js';

export class VideoResource {
  constructor(private readonly http: HttpClient) {}

  /** Create a music video from a generated track. Returns a task id. */
  generate(params: CreateMusicVideoParams): Promise<TaskCreated> {
    return this.http.request('POST', '/api/v1/mp4/generate', { body: params });
  }

  /** Poll the video generation result for a task. */
  getRecordInfo(taskId: string): Promise<MusicVideoRecord> {
    return this.http.request('GET', '/api/v1/mp4/record-info', {
      query: { taskId },
    });
  }
}
