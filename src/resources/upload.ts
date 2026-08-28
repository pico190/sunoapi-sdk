/**
 * File-upload resource.
 *
 * Upload audio files (via base64, a public URL, or a raw binary stream) so the
 * returned `downloadUrl` can be fed into upload-based endpoints (e.g.
 * {@link MusicResource.uploadCover}, `addInstrumental`, `addVocals`).
 *
 * > Uploaded files are temporary and deleted after **3 days**.
 */
import { HttpClient } from '../client.js';
import {
  UploadFileBase64Params,
  UploadFileUrlParams,
  UploadFileStreamParams,
  UploadFileResponse,
} from '../types.js';

export class UploadResource {
  constructor(private readonly http: HttpClient) {}

  /** Upload a file from base64-encoded content. */
  fromBase64(params: UploadFileBase64Params): Promise<UploadFileResponse> {
    return this.http.requestUpload('POST', '/api/file-base64-upload', { body: params });
  }

  /** Upload a file by providing a publicly reachable URL. */
  fromUrl(params: UploadFileUrlParams): Promise<UploadFileResponse> {
    return this.http.requestUpload('POST', '/api/file-url-upload', { body: params });
  }

  /**
   * Upload a file via a raw binary stream (multipart/form-data).
   * Accepts a `Buffer`, `Uint8Array`, `Blob`, or `string`.
   */
  fromStream(params: UploadFileStreamParams): Promise<UploadFileResponse> {
    const form = new FormData();
    const file = params.file;

    if (typeof file === 'string') {
      form.append('file', file, params.fileName ?? 'file');
    } else if (typeof Blob !== 'undefined' && file instanceof Blob) {
      form.append('file', file, params.fileName ?? 'file');
    } else {
      // Buffer / Uint8Array → wrap in a Blob.
      const blob = new Blob([file as Uint8Array]);
      form.append('file', blob, params.fileName ?? 'file');
    }

    form.append('uploadPath', params.uploadPath);
    if (params.fileName) form.append('fileName', params.fileName);

    return this.http.requestUpload('POST', '/api/file-stream-upload', { form });
  }
}
