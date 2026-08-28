/**
 * Music generation & manipulation resource.
 *
 * Covers song generation, extension, mashups, covers from uploads, persona
 * creation, section replacement, and adding instrumental/vocals to uploaded
 * tracks.
 */
import { HttpClient } from '../client.js';
import {
  GenerateMusicParams,
  ExtendMusicParams,
  UploadCoverParams,
  UploadExtendParams,
  MashupParams,
  GeneratePersonaParams,
  ReplaceSectionParams,
  AddInstrumentalParams,
  AddVocalsParams,
  TimestampedLyricsParams,
  TaskCreated,
  MusicGenerationRecord,
  TimestampedLyrics,
} from '../types.js';

export class MusicResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Generate a song from a text prompt.
   * @returns a task id — poll {@link getRecordInfo} or use `api.waitForMusic`.
   */
  generate(params: GenerateMusicParams): Promise<TaskCreated> {
    return this.http.request('POST', '/api/v1/generate', { body: params });
  }

  /**
   * Extend an existing track beyond its current length.
   */
  extend(params: ExtendMusicParams): Promise<TaskCreated> {
    return this.http.request('POST', '/api/v1/generate/extend', { body: params });
  }

  /**
   * Generate a cover version of a song from an **uploaded** audio URL.
   */
  uploadCover(params: UploadCoverParams): Promise<TaskCreated> {
    return this.http.request('POST', '/api/v1/generate/upload-cover', { body: params });
  }

  /**
   * Extend a song from an **uploaded** audio URL.
   */
  uploadExtend(params: UploadExtendParams): Promise<TaskCreated> {
    return this.http.request('POST', '/api/v1/generate/upload-extend', { body: params });
  }

  /**
   * Create a mashup from exactly two uploaded audio URLs.
   */
  mashup(params: MashupParams): Promise<TaskCreated> {
    return this.http.request('POST', '/api/v1/generate/mashup', { body: params });
  }

  /**
   * Generate a reusable Persona (musical identity) from an existing track.
   */
  generatePersona(params: GeneratePersonaParams): Promise<TaskCreated> {
    return this.http.request('POST', '/api/v1/generate/generate-persona', { body: params });
  }

  /**
   * Replace a section of an existing track with new lyrics/music.
   * The replaced interval (`infillEndS - infillStartS`) must be >= 10 seconds.
   */
  replaceSection(params: ReplaceSectionParams): Promise<TaskCreated> {
    return this.http.request('POST', '/api/v1/generate/replace-section', { body: params });
  }

  /**
   * Add an instrumental track to an uploaded audio file.
   */
  addInstrumental(params: AddInstrumentalParams): Promise<TaskCreated> {
    return this.http.request('POST', '/api/v1/generate/add-instrumental', { body: params });
  }

  /**
   * Add vocals to an uploaded instrumental audio file.
   */
  addVocals(params: AddVocalsParams): Promise<TaskCreated> {
    return this.http.request('POST', '/api/v1/generate/add-vocals', { body: params });
  }

  /**
   * Retrieve the details / generated tracks for a music task.
   * @param taskId the id returned by {@link generate} (or similar).
   */
  getRecordInfo(taskId: string): Promise<MusicGenerationRecord> {
    return this.http.request('GET', '/api/v1/generate/record-info', {
      query: { taskId },
    });
  }

  /**
   * Get word-aligned (timestamped) lyrics with waveform data for an audio id.
   */
  getTimestampedLyrics(params: TimestampedLyricsParams): Promise<TimestampedLyrics> {
    return this.http.request('POST', '/api/v1/generate/get-timestamped-lyrics', {
      body: params,
    });
  }
}
