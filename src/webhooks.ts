/**
 * Webhook (callback) handling for SunoAPI.
 *
 * Several SunoAPI endpoints require a `callBackUrl`: when a task finishes,
 * SunoAPI sends an HTTP `POST` to that URL with the result. This module turns
 * that raw POST body into a typed, normalized {@link SunoWebhookEvent} and lets
 * the top-level {@link SunoAPI.handleWebhook} method resolve a pending
 * `waitFor*` promise for you — so you never have to wire the callback payload
 * back into your generation code by hand.
 *
 * @packageDocumentation
 */
import { SunoAPIError } from './errors.js';
import { AudioTrack, MusicGenerationRecord, TaskStatus } from './types.js';

/**
 * Raw shape SunoAPI `POST`s to your `callBackUrl`.
 *
 * The callback envelope uses **snake_case** (`audio_url`, `task_id`, …), unlike
 * `record-info` which uses camelCase. This module normalizes both for you.
 */
export interface SunoWebhookPayload {
  /** SunoAPI envelope code. `200` means success. */
  code: number;
  /** Human-readable message from SunoAPI. */
  msg?: string;
  /** The task result. May be nested under `data` or be the top-level object. */
  data: {
    /** Task identifier (snake_case). */
    task_id?: string;
    /** Finished audio URL (snake_case). */
    audio_url?: string;
    /** Streamable audio URL (snake_case). */
    stream_audio_url?: string;
    /** Cover-image URL (snake_case). */
    image_url?: string;
    /** Task status string. */
    status?: string;
    /** Track title. */
    title?: string;
    /** Track prompt / lyrics. */
    prompt?: string;
    /** Any other fields SunoAPI may send. */
    [key: string]: unknown;
  };
}

/**
 * Normalized, camelCase event the SDK hands back after parsing a webhook.
 * This is what {@link SunoAPI.handleWebhook} returns and what a webhook-driven
 * `waitFor*` resolves with (for music, mapped to {@link MusicGenerationRecord}).
 */
export interface SunoWebhookEvent {
  /** Envelope code (`200` on success). */
  code: number;
  /** Human-readable message. */
  msg?: string;
  /** Task identifier, normalized to camelCase. */
  taskId?: string;
  /** Task status, if present in the payload. */
  status?: string;
  /** Finished audio URL, normalized to camelCase. */
  audioUrl?: string;
  /** Streamable audio URL, normalized to camelCase. */
  streamAudioUrl?: string;
  /** Cover-image URL, normalized to camelCase. */
  imageUrl?: string;
  /** Track title, if present. */
  title?: string;
  /** Track prompt / lyrics, if present. */
  prompt?: string;
  /** The untouched original payload (useful for debugging). */
  raw: unknown;
}

/**
 * Parse and validate a raw SunoAPI webhook payload.
 *
 * @throws {SunoAPIError} if the payload is not an object, is missing `taskId`,
 *   or reports a non-`200` code.
 */
export function parseWebhook(raw: unknown): SunoWebhookEvent {
  if (!raw || typeof raw !== 'object') {
    throw new SunoAPIError(0, 'Invalid webhook payload: expected a JSON object');
  }
  const obj = raw as Record<string, any>;
  const code = typeof obj.code === 'number' ? obj.code : obj.success === true ? 200 : 0;
  if (code !== 200) {
    throw new SunoAPIError(code, obj.msg ?? 'Webhook reported a non-success status');
  }

  const data = obj.data && typeof obj.data === 'object' ? obj.data : obj;
  const taskId = data.task_id ?? data.taskId;
  if (taskId === undefined || taskId === null) {
    throw new SunoAPIError(code, 'Webhook payload is missing taskId');
  }

  return {
    code,
    msg: obj.msg,
    taskId: String(taskId),
    status: data.status,
    audioUrl: data.audio_url ?? data.audioUrl,
    streamAudioUrl: data.stream_audio_url ?? data.streamAudioUrl,
    imageUrl: data.image_url ?? data.imageUrl,
    title: data.title,
    prompt: data.prompt,
    raw: obj,
  };
}

/**
 * Map a {@link SunoWebhookEvent} into a {@link MusicGenerationRecord} so a
 * webhook-driven {@link SunoAPI.waitForMusic} call returns the exact same shape
 * as a polled one (i.e. `record.response.sunoData[0].audioUrl` keeps working).
 */
export function webhookToMusicRecord(event: SunoWebhookEvent): MusicGenerationRecord {
  const track: AudioTrack = {
    id: event.taskId ?? '',
    audioUrl: event.audioUrl ?? '',
    streamAudioUrl: event.streamAudioUrl ?? '',
    imageUrl: event.imageUrl ?? '',
    title: event.title ?? '',
    prompt: event.prompt ?? '',
    modelName: '',
    tags: '',
    createTime: '',
    duration: 0,
  };

  return {
    taskId: event.taskId ?? '',
    status: (event.status as TaskStatus) ?? TaskStatus.SUCCESS,
    response: { taskId: event.taskId ?? '', sunoData: [track] },
  } as MusicGenerationRecord;
}
