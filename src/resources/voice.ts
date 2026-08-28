/**
 * Voice model resource — validate voice samples, train custom voices, and
 * check voice availability.
 */
import { HttpClient } from '../client.js';
import {
  ValidateVoiceParams,
  GenerateVoiceParams,
  RegenerateVoiceParams,
  CheckVoiceParams,
  TaskCreated,
  VoiceValidateInfo,
  VoiceRecordInfo,
  CheckVoiceResponse,
} from '../types.js';

export class VoiceResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Validate a voice sample (check it's suitable for voice-model training).
   * @returns a task id — poll {@link getValidateInfo}.
   */
  validate(params: ValidateVoiceParams): Promise<TaskCreated> {
    return this.http.request('POST', '/api/v1/voice/validate', { body: params });
  }

  /** Poll the validation result for a voice task. */
  getValidateInfo(taskId: string): Promise<VoiceValidateInfo> {
    return this.http.request('GET', '/api/v1/voice/validate-info', {
      query: { taskId },
    });
  }

  /**
   * Generate a custom voice model from a validated sample.
   * @returns a task id — poll {@link getRecordInfo}.
   */
  generate(params: GenerateVoiceParams): Promise<TaskCreated> {
    return this.http.request('POST', '/api/v1/voice/generate', { body: params });
  }

  /** Poll the voice-model generation result for a task. */
  getRecordInfo(taskId: string): Promise<VoiceRecordInfo> {
    return this.http.request('GET', '/api/v1/voice/record-info', {
      query: { taskId },
    });
  }

  /**
   * Regenerate a voice model. Note: the API expects the callback field spelled
   * `calBackUrl` (lowercase "l").
   */
  regenerate(params: RegenerateVoiceParams): Promise<TaskCreated> {
    return this.http.request('POST', '/api/v1/voice/regenerate', { body: params });
  }

  /**
   * Check whether a voice model is available. Note: the API expects the field
   * spelled `task_id` (snake_case).
   */
  checkVoice(params: CheckVoiceParams): Promise<CheckVoiceResponse> {
    return this.http.request('POST', '/api/v1/voice/check-voice', { body: params });
  }
}
