/**
 * SunoAPI SDK — the complete, zero-dependency TypeScript client for
 * [SunoAPI.org](https://sunoapi.org) / [docs.sunoapi.org](https://docs.sunoapi.org).
 *
 * This is the single entry point you need. Construct {@link SunoAPI} with your
 * Bearer token, then call the resource methods (e.g. `api.music`, `api.voice`,
 * `api.upload`) or the convenience `waitFor*` pollers.
 *
 * @example
 * ```ts
 * import { SunoAPI } from 'sunoapi-sdk';
 *
 * const api = new SunoAPI({ apiKey: process.env.SUNO_API_KEY! });
 *
 * const { taskId } = await api.music.generate({
 *   prompt: 'A chill lo-fi beat with warm piano',
 *   style: 'lo-fi, chill, study',
 *   title: 'Late Night',
 *   customMode: false,
 *   instrumental: false,
 *   model: 'V4_5',
 *   callBackUrl: 'https://my-app.com/callback',
 * });
 *
 * const record = await api.waitForMusic(taskId);
 * for (const track of record.response.sunoData) {
 *   console.log(track.title, track.audioUrl);
 * }
 * ```
 *
 * @packageDocumentation
 */
import { HttpClient, SunoAPIOptions } from './client.js';
import { MusicResource } from './resources/music.js';
import { SoundsResource } from './resources/sounds.js';
import { LyricsResource } from './resources/lyrics.js';
import { StyleResource } from './resources/style.js';
import { WavResource } from './resources/wav.js';
import { SeparationResource } from './resources/separation.js';
import { MidiResource } from './resources/midi.js';
import { VideoResource } from './resources/video.js';
import { CoverResource } from './resources/cover.js';
import { VoiceResource } from './resources/voice.js';
import { UploadResource } from './resources/upload.js';
import { CreditsResource } from './resources/credits.js';

import {
  TaskStatus,
  VoiceStatus,
  SongGenerationModel,
  SoundGenerationModel,
  VocalGender,
  PersonaModel,
  AddTrackModel,
  SoundKey,
  VocalSeparationType,
  StemName,
  VoiceLanguage,
  SingerSkillLevel,
  MusicGenerationRecord,
  LyricsGenerationRecord,
  WavConversionRecord,
  VocalSeparationRecord,
  MidiGenerationRecord,
  MusicVideoRecord,
  CoverGenerationRecord,
  VoiceValidateInfo,
  VoiceRecordInfo,
} from './types.js';
import { SunoAPIError, SunoTaskFailedError, SunoTimeoutError, ERROR_CODES } from './errors.js';

/** Options controlling the `waitFor*` polling helpers. */
export interface WaitOptions {
  /** Polling interval in milliseconds. @default 5000 */
  intervalMs?: number;
  /** Maximum time to wait before throwing {@link SunoTimeoutError}. @default 600000 (10 minutes) */
  timeoutMs?: number;
}

/** Internal polling-decision states. */
type PollerState = 'pending' | 'success' | 'failed';

/** Decide a task's state from a status enum (`PENDING`/`GENERATING`/`SUCCESS`/`FAILED`). */
function statusState(status: TaskStatus | VoiceStatus | undefined): PollerState {
  if (status === 'SUCCESS') return 'success';
  if (status === 'FAILED') return 'failed';
  return 'pending';
}

/**
 * Decide a task's state from the `successFlag` / `errorCode` / `errorMessage`
 * fields used by the WAV, separation, MIDI, video and cover endpoints.
 * `successFlag` may be a string (`'1'`) or a number (`1`); `errorCode` may be a
 * number (`0`) or a string (`'0'`).
 */
function flagState(rec: {
  successFlag?: string | number;
  errorCode?: number | string;
  errorMessage?: string;
}): PollerState {
  const sf = rec.successFlag;
  if (sf === '1' || sf === 1) return 'success';

  const ec = rec.errorCode;
  const ecBad = ec !== undefined && ec !== null && ec !== 0 && ec !== '0' && ec !== '';
  if (ecBad || (rec.errorMessage && rec.errorMessage.length > 0)) return 'failed';

  return 'pending';
}

/**
 * The complete SunoAPI client.
 *
 * Grouped by resource (music, sounds, lyrics, style, wav, separation, midi,
 * video, cover, voice, upload, credits) and augmented with ergonomic
 * `waitFor*` pollers that block until a task finishes.
 */
export class SunoAPI {
  /** Low-level HTTP client (exposed for advanced use). */
  readonly http: HttpClient;

  /** Music generation, extension, mashup, covers, personas, section editing. */
  readonly music: MusicResource;
  /** Sound-effect generation. */
  readonly sounds: SoundsResource;
  /** Lyrics generation. */
  readonly lyrics: LyricsResource;
  /** Music-style boosting / description. */
  readonly style: StyleResource;
  /** WAV conversion. */
  readonly wav: WavResource;
  /** Vocal / stem separation. */
  readonly separation: SeparationResource;
  /** MIDI generation from separated stems. */
  readonly midi: MidiResource;
  /** Music-video (MP4) generation. */
  readonly video: VideoResource;
  /** Cover-art generation. */
  readonly cover: CoverResource;
  /** Voice-model validation, training, regeneration, availability. */
  readonly voice: VoiceResource;
  /** File uploads (base64 / URL / stream). */
  readonly upload: UploadResource;
  /** Account credits. */
  readonly credits: CreditsResource;

  /** Generation model enum (`V4`, `V4_5`, `V4_5PLUS`, `V4_5ALL`, `V5`, `V5_5`). */
  static Model = SongGenerationModel;
  /** Sound-generation model enum (`V5`). */
  static SoundModel = SoundGenerationModel;
  /** Vocal gender enum (`male` / `female`). */
  static VocalGender = VocalGender;
  /** Persona model enum (`V3_5`). */
  static PersonaModel = PersonaModel;
  /** Add-instrumental / add-vocals model enum (`V4_5` / `V4_5PLUS`). */
  static AddTrackModel = AddTrackModel;
  /** Musical key enum for sound generation (e.g. `C#m`). */
  static SoundKey = SoundKey;
  /** Vocal-separation type enum (`mixture` / `stems`). */
  static VocalSeparationType = VocalSeparationType;
  /** Individual stem names for vocal separation. */
  static StemName = StemName;
  /** Voice language enum (`en`, `zh`, `ja`, `ko`, `es`, `fr`, …). */
  static VoiceLanguage = VoiceLanguage;
  /** Singer skill level enum (`low` / `medium` / `high`). */
  static SingerSkillLevel = SingerSkillLevel;
  /** Music/lyrics task status enum. */
  static TaskStatus = TaskStatus;
  /** Voice task status enum. */
  static VoiceStatus = VoiceStatus;
  /** Error class thrown for non-2xx / non-success API responses. */
  static SunoAPIError = SunoAPIError;
  /** Error class thrown when a task finishes with a `FAILED` state. */
  static SunoTaskFailedError = SunoTaskFailedError;
  /** Error class thrown when a `waitFor*` poller exceeds `timeoutMs`. */
  static SunoTimeoutError = SunoTimeoutError;
  /** Map of SunoAPI error codes to human-readable descriptions. */
  static ERROR_CODES = ERROR_CODES;

  constructor(options: SunoAPIOptions) {
    this.http = new HttpClient(options);
    this.music = new MusicResource(this.http);
    this.sounds = new SoundsResource(this.http);
    this.lyrics = new LyricsResource(this.http);
    this.style = new StyleResource(this.http);
    this.wav = new WavResource(this.http);
    this.separation = new SeparationResource(this.http);
    this.midi = new MidiResource(this.http);
    this.video = new VideoResource(this.http);
    this.cover = new CoverResource(this.http);
    this.voice = new VoiceResource(this.http);
    this.upload = new UploadResource(this.http);
    this.credits = new CreditsResource(this.http);
  }

  /**
   * Get your remaining subscription credits (USD).
   * @see {@link CreditsResource.getRemaining}
   */
  getCredits(): Promise<number> {
    return this.credits.getRemaining();
  }

  /** Shared polling engine used by every `waitFor*` helper. */
  private async poll<T>(
    fetcher: () => Promise<T>,
    decide: (record: T) => PollerState,
    opts: WaitOptions,
    taskId: string,
    label: string,
  ): Promise<T> {
    const interval = opts.intervalMs ?? 5_000;
    const timeout = opts.timeoutMs ?? 600_000;
    const startedAt = Date.now();

    for (;;) {
      const record = await fetcher();
      const state = decide(record);
      if (state === 'success') return record;
      if (state === 'failed') {
        throw new SunoTaskFailedError(taskId, `${label} task failed`);
      }
      if (Date.now() - startedAt > timeout) {
        throw new SunoTimeoutError(
          `Timed out after ${timeout}ms waiting for ${label} task "${taskId}"`,
          taskId,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  /** Poll a music task until it succeeds or fails. */
  waitForMusic(taskId: string, opts: WaitOptions = {}): Promise<MusicGenerationRecord> {
    return this.poll(
      () => this.music.getRecordInfo(taskId),
      (r) => statusState(r.status),
      opts,
      taskId,
      'music',
    );
  }

  /** Poll a lyrics task until it succeeds or fails. */
  waitForLyrics(taskId: string, opts: WaitOptions = {}): Promise<LyricsGenerationRecord> {
    return this.poll(
      () => this.lyrics.getRecordInfo(taskId),
      (r) => statusState(r.status),
      opts,
      taskId,
      'lyrics',
    );
  }

  /** Poll a WAV conversion task until it succeeds or fails. */
  waitForWav(taskId: string, opts: WaitOptions = {}): Promise<WavConversionRecord> {
    return this.poll(() => this.wav.getRecordInfo(taskId), flagState, opts, taskId, 'wav');
  }

  /** Poll a vocal-separation task until it succeeds or fails. */
  waitForSeparation(taskId: string, opts: WaitOptions = {}): Promise<VocalSeparationRecord> {
    return this.poll(
      () => this.separation.getRecordInfo(taskId),
      flagState,
      opts,
      taskId,
      'separation',
    );
  }

  /** Poll a MIDI generation task until it succeeds or fails. */
  waitForMidi(taskId: string, opts: WaitOptions = {}): Promise<MidiGenerationRecord> {
    return this.poll(() => this.midi.getRecordInfo(taskId), flagState, opts, taskId, 'midi');
  }

  /** Poll a music-video task until it succeeds or fails. */
  waitForVideo(taskId: string, opts: WaitOptions = {}): Promise<MusicVideoRecord> {
    return this.poll(() => this.video.getRecordInfo(taskId), flagState, opts, taskId, 'video');
  }

  /** Poll a cover-art task until it succeeds or fails. */
  waitForCover(taskId: string, opts: WaitOptions = {}): Promise<CoverGenerationRecord> {
    return this.poll(() => this.cover.getRecordInfo(taskId), flagState, opts, taskId, 'cover');
  }

  /** Poll a voice-model generation task until it succeeds or fails. */
  waitForVoice(taskId: string, opts: WaitOptions = {}): Promise<VoiceRecordInfo> {
    return this.poll(
      () => this.voice.getRecordInfo(taskId),
      (r) => statusState(r.status),
      opts,
      taskId,
      'voice',
    );
  }

  /** Poll a voice-validation task until it succeeds or fails. */
  waitForVoiceValidate(taskId: string, opts: WaitOptions = {}): Promise<VoiceValidateInfo> {
    return this.poll(
      () => this.voice.getValidateInfo(taskId),
      (r) => statusState(r.status),
      opts,
      taskId,
      'voice-validate',
    );
  }
}

export default SunoAPI;

// Convenience re-exports so consumers can `import { SongGenerationModel } from 'sunoapi-sdk'`.
export * from './types.js';
export * from './errors.js';
export { HttpClient } from './client.js';
export type { SunoAPIOptions } from './client.js';
export { MusicResource } from './resources/music.js';
export { SoundsResource } from './resources/sounds.js';
export { LyricsResource } from './resources/lyrics.js';
export { StyleResource } from './resources/style.js';
export { WavResource } from './resources/wav.js';
export { SeparationResource } from './resources/separation.js';
export { MidiResource } from './resources/midi.js';
export { VideoResource } from './resources/video.js';
export { CoverResource } from './resources/cover.js';
export { VoiceResource } from './resources/voice.js';
export { UploadResource } from './resources/upload.js';
export { CreditsResource } from './resources/credits.js';
