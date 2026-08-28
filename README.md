# sunoapi-sdk

A community-maintained, unofficial **Node.js / TypeScript** SDK for [SunoAPI.org](https://sunoapi.org) — the simplest and most ergonomic way to generate music, lyrics, sounds, voices, videos and more from code.

- ✅ **TypeScript** with full types and JSDoc on every method.
- ✅ **Zero dependencies**: uses only native Node 18+ `fetch` (plus `FormData`/`Blob`).
- ✅ **ESM + CJS**: works with `import` and with `require`.
- ✅ **The whole API**: 35 endpoints across music, lyrics, sounds, voice, stem separation, MIDI, WAV, video, cover art, style, file upload and credits.
- ✅ **Ergonomic**: automatic response unwrapping (`{code,msg,data}` → `data`), retry with backoff, error mapping and ready-to-use `waitFor*` pollers.

> Requires **Node 18+** (uses `globalThis.fetch`).

---

## Installation

```bash
npm install sunoapi-sdk
# or: pnpm add sunoapi-sdk / yarn add sunoapi-sdk
```

Get your API key at <https://sunoapi.org> (the *API Keys* section). It is sent as
`Authorization: Bearer <API_KEY>`.

```ts
import { SunoAPI } from 'sunoapi-sdk';

const suno = new SunoAPI({ apiKey: process.env.SUNO_API_KEY! });
```

With CommonJS:

```js
const { SunoAPI } = require('sunoapi-sdk');
const suno = new SunoAPI({ apiKey: process.env.SUNO_API_KEY });
```

---

## Quick start

Generate a song and wait for it to be ready:

```ts
const { taskId } = await suno.music.generate({
  prompt: 'A relaxing lo-fi ballad about morning coffee',
  style: 'lo-fi, chill, acoustic',
  title: 'Morning Coffee',
  customMode: true,
  instrumental: false,
  model: SunoAPI.Model.V4_5, // or 'V4_5', 'V5', 'V5_5'...
  callBackUrl: 'https://your-webhook.com/suno', // optional
});

// Built-in polling: resolves when status === 'SUCCESS', throws on 'FAILED'
const record = await suno.waitForMusic(taskId);
const track = record.response.sunoData[0];

console.log(track.title);
console.log(track.audioUrl);   // MP3 URL
console.log(track.streamAudioUrl);
console.log(track.imageUrl);   // cover art
```

`suno.waitForMusic` is equivalent to:

```ts
const record = await suno.music.getRecordInfo(taskId); // one-off check
```

…but with automatic retries until generation finishes.

---

## Client: options

```ts
new SunoAPI({
  apiKey: string,                  // required
  baseURL?: string,                // default https://api.sunoapi.org
  uploadBaseURL?: string,          // default https://sunoapiorg.redpandaai.co
  timeoutMs?: number,              // per-request timeout (default 60_000)
  maxRetries?: number,             // retries on 429/5xx (default 3)
  retryDelayMs?: number,           // base backoff wait (default 600)
});
```

Every request carries `Authorization: Bearer <apiKey>` and retries with exponential
backoff on `429` (rate limit) and 5xx errors.

---

## API surface

The `suno` object exposes one **resource** per domain. Every creation method returns
`{ taskId }` and every `getRecordInfo` method returns the full task state.

### 🎵 Music — `suno.music`

| Method | Endpoint | Description |
|---|---|---|
| `generate(params)` | `POST /api/v1/generate` | Generate a song from prompt/style. |
| `extend(params)` | `POST /api/v1/generate/extend` | Extend an existing song. |
| `uploadCover(params)` | `POST /api/v1/generate/upload-cover` | Generate using an uploaded cover (`uploadUrl`). |
| `uploadExtend(params)` | `POST /api/v1/generate/upload-extend` | Extend a song from an uploaded audio. |
| `mashup(params)` | `POST /api/v1/generate/mashup` | Mix several audios (`uploadUrlList`). |
| `generatePersona(params)` | `POST /api/v1/generate/generate-persona` | Create a reusable vocal *persona* from a track. |
| `replaceSection(params)` | `POST /api/v1/generate/replace-section` | Replace a section of the lyrics (*infill*). |
| `addInstrumental(params)` | `POST /api/v1/generate/add-instrumental` | Add instrumentation to an uploaded audio. |
| `addVocals(params)` | `POST /api/v1/generate/add-vocals` | Add vocals to an uploaded audio. |
| `getRecordInfo(taskId)` | `GET /api/v1/generate/record-info` | Generation status. |
| `getTimestampedLyrics(params)` | `POST /api/v1/generate/get-timestamped-lyrics` | Word-level timed lyrics. |

```ts
// Extend a song at second 60
const { taskId } = await suno.music.extend({
  audioId: '9b2f...',
  defaultParamFlag: false,
  model: SunoAPI.Model.V4_5,
  continueAt: '60',
  callBackUrl: 'https://your-webhook.com/suno',
});

// Mashup of two already-uploaded audios
await suno.music.mashup({
  uploadUrlList: ['https://.../a.mp3', 'https://.../b.mp3'],
  customMode: true,
  model: SunoAPI.Model.V4_5,
  callBackUrl: 'https://your-webhook.com/suno',
  title: 'My Mix',
});
```

### 🎤 Sounds — `suno.sounds`

| Method | Endpoint | Description |
|---|---|---|
| `generate(params)` | `POST /api/v1/generate/sounds` | Generate sound effects (model `V5`). |

```ts
const { taskId } = await suno.sounds.generate({
  prompt: 'rain on a window at night',
  model: SunoAPI.SoundModel.V5,
  callBackUrl: 'https://your-webhook.com/suno',
});
```

### 📝 Lyrics — `suno.lyrics`

| Method | Endpoint | Description |
|---|---|---|
| `generate(params)` | `POST /api/v1/lyrics` | Generate lyrics from a prompt. |
| `getRecordInfo(taskId)` | `GET /api/v1/lyrics/record-info` | Lyrics generation status. |

```ts
const { taskId } = await suno.lyrics.generate({
  prompt: 'A punk song about robots learning to smile',
  callBackUrl: 'https://your-webhook.com/suno',
});
const lyricsRecord = await suno.waitForLyrics(taskId);
console.log(lyricsRecord.response.data);
```

### ✨ Style — `suno.style`

| Method | Endpoint | Description |
|---|---|---|
| `boost(params)` | `POST /api/v1/style/generate` | Improve/expand a music style description. |

```ts
const suggestion = await suno.style.boost({ content: 'alternative rock with synths' });
```

### 🎚️ WAV — `suno.wav`

| Method | Endpoint | Description |
|---|---|---|
| `generate(params)` | `POST /api/v1/wav/generate` | Convert a track to WAV. |
| `getRecordInfo(taskId)` | `GET /api/v1/wav/record-info` | Conversion status. |

### 🎛️ Vocal / stem separation — `suno.separation`

| Method | Endpoint | Description |
|---|---|---|
| `generate(params)` | `POST /api/v1/vocal-removal/generate` | Split stems (vocals, drums, bass, guitar…). |
| `getRecordInfo(taskId)` | `GET /api/v1/vocal-removal/record-info` | Separation status. |

```ts
const { taskId } = await suno.separation.generate({
  audioId: '9b2f...',
  type: 'mixture', // or 'stems'
  callBackUrl: 'https://your-webhook.com/suno',
});
const sep = await suno.waitForSeparation(taskId);
console.log(sep.response.vocalUrl, sep.response.drumsUrl);
```

### 🎹 MIDI — `suno.midi`

| Method | Endpoint | Description |
|---|---|---|
| `generate(params)` | `POST /api/v1/midi/generate` | Extract MIDI (notes per instrument) from a track. |
| `getRecordInfo(taskId)` | `GET /api/v1/midi/record-info` | Extraction status. |

### 🎬 Video (MP4) — `suno.video`

| Method | Endpoint | Description |
|---|---|---|
| `generate(params)` | `POST /api/v1/mp4/generate` | Create a music video from a track. |
| `getRecordInfo(taskId)` | `GET /api/v1/mp4/record-info` | Video status. |

### 🖼️ Cover art — `suno.cover`

| Method | Endpoint | Description |
|---|---|---|
| `generate(params)` | `POST /api/v1/suno/cover/generate` | Generate cover art from a track. |
| `getRecordInfo(taskId)` | `GET /api/v1/suno/cover/record-info` | Generation status. |

### 🗣️ Voice — `suno.voice`

| Method | Endpoint | Description |
|---|---|---|
| `validate(params)` | `POST /api/v1/voice/validate` | Validate a voice clip and return `taskId`. |
| `getValidateInfo(taskId)` | `GET /api/v1/voice/validate-info` | Validation status. |
| `generate(params)` | `POST /api/v1/voice/generate` | Generate a voice from the validated clip. |
| `getRecordInfo(taskId)` | `GET /api/v1/voice/record-info` | Voice generation status. |
| `regenerate(params)` | `POST /api/v1/voice/regenerate` | Regenerate a voice (`calBackUrl`). |
| `checkVoice(params)` | `POST /api/v1/voice/check-voice` | Check voice availability. |

```ts
// 1) Validate a clip
const { taskId } = await suno.voice.validate({
  voiceUrl: 'https://.../my-voice.mp3',
  vocalStartS: 5,
  vocalEndS: 20,
});
await suno.waitForVoiceValidate(taskId);

// 2) Generate the voice
const { taskId: voiceTaskId } = await suno.voice.generate({
  taskId,
  verifyUrl: 'https://.../my-voice.mp3',
  voiceName: 'My Voice',
  description: 'Warm and deep',
  callBackUrl: 'https://your-webhook.com/suno',
});
const voice = await suno.waitForVoice(voiceTaskId);
console.log(voice.voiceId);
```

### 📤 File upload — `suno.upload`

Upload uses a **different base URL** (`https://sunoapiorg.redpandaai.co`). The SDK handles it for you.

| Method | Endpoint | Description |
|---|---|---|
| `fromBase64(params)` | `POST /api/file-base64-upload` | Upload a base64 file. |
| `fromUrl(params)` | `POST /api/file-url-upload` | Upload from an external URL. |
| `fromStream(params)` | `POST /api/file-stream-upload` | Upload a `Buffer`/`Uint8Array`/`Blob` (multipart). |

```ts
// Upload a Buffer (e.g. read from disk)
import { readFileSync } from 'node:fs';
const file = await suno.upload.fromStream({
  file: readFileSync('./voice.mp3'),
  uploadPath: '/test',
  fileName: 'voice.mp3',
});
const uploadUrl = file.downloadUrl; // use it in uploadCover / mashup / etc.
```

### 💳 Credits — `suno.credits` / `suno.getCredits()`

| Method | Endpoint | Description |
|---|---|---|
| `credits.getRemaining()` | `GET /api/v1/account/subscription/remain` | Returns the number of remaining credits. |

```ts
const credits = await suno.getCredits();
console.log(`You have ${credits} credits left`);
```

---

## `waitFor*` helpers

Every generation is asynchronous. Instead of polling manually, use the built-in
pollers. They resolve with the full record when the task finishes and throw
`SunoTaskFailedError` on failure.

```ts
suno.waitForMusic(taskId, opts?)       // music
suno.waitForLyrics(taskId, opts?)      // lyrics
suno.waitForWav(taskId, opts?)         // WAV
suno.waitForSeparation(taskId, opts?)  // stem separation
suno.waitForMidi(taskId, opts?)        // MIDI
suno.waitForVideo(taskId, opts?)       // MP4 video
suno.waitForCover(taskId, opts?)       // cover art
suno.waitForVoice(taskId, opts?)       // voice
suno.waitForVoiceValidate(taskId, opts?) // voice validation
```

Options (`WaitOptions`):

```ts
{
  intervalMs?: number,  // time between polls (default 3000)
  timeoutMs?: number,   // cancel and throw SunoTimeoutError (default 300000 = 5 min)
}
```

```ts
try {
  const record = await suno.waitForMusic(taskId, { intervalMs: 2000, timeoutMs: 120_000 });
} catch (err) {
  if (err instanceof SunoAPI.SunoTimeoutError) {
    console.warn('Taking too long, check getRecordInfo() later');
  }
}
```

---

## Error handling

All errors extend `Error` and carry the HTTP/API code:

```ts
import { SunoAPI } from 'sunoapi-sdk';
const { SunoAPIError, SunoTaskFailedError, SunoTimeoutError } = SunoAPI;

try {
  await suno.music.generate({ /* ... */ });
} catch (err) {
  if (err instanceof SunoAPIError) {
    console.error(err.code, err.message); // e.g. 401 'Unauthorized'
  } else if (err instanceof SunoTaskFailedError) {
    console.error('Task failed:', err.taskId, err.reason);
  } else if (err instanceof SunoTimeoutError) {
    console.error('Timed out waiting for task:', err.taskId);
  }
}
```

Error codes returned by the API (mapped in `SunoAPI.ERROR_CODES`):

| Code | Meaning |
|---|---|
| 200 | OK |
| 400 | Invalid parameters |
| 401 | Unauthorized (invalid API key) |
| 404 | Resource not found |
| 405 | Method not allowed |
| 413 | File too large |
| 429 | Too many requests (rate limit) |
| 430 | Insufficient credits |
| 455 | Unsupported audio length |
| 500 | Internal server error |

---

## Types and enums

All types are re-exported from the package. Enums are available both as **runtime
objects** (`SunoAPI.Model.V4_5PLUS`) and as **types** (`SongGenerationModel`).

```ts
import { SunoAPI } from 'sunoapi-sdk';

SunoAPI.Model.V4;        // 'V4'
SunoAPI.Model.V4_5;      // 'V4_5'
SunoAPI.Model.V4_5PLUS;  // 'V4_5PLUS'
SunoAPI.Model.V4_5ALL;   // 'V4_5ALL'
SunoAPI.Model.V5;        // 'V5'
SunoAPI.Model.V5_5;      // 'V5_5'

SunoAPI.VocalGender.Male;       // 'm'
SunoAPI.VocalGender.Female;     // 'f'
SunoAPI.PersonaModel.Style;      // 'style_persona'
SunoAPI.PersonaModel.Voice;      // 'voice_persona'
SunoAPI.SoundModel.V5;           // 'V5'
SunoAPI.VoiceLanguage.English;   // 'en'
SunoAPI.VoiceLanguage.Spanish;   // 'es'
SunoAPI.SingerSkillLevel.Beginner;     // 'beginner'
SunoAPI.SingerSkillLevel.Intermediate; // 'intermediate'
SunoAPI.SingerSkillLevel.Advanced;     // 'advanced'
SunoAPI.SingerSkillLevel.Professional; // 'professional'
```

Key types: `GenerateMusicParams`, `ExtendMusicParams`, `UploadCoverParams`,
`MashupParams`, `GeneratePersonaParams`, `ReplaceSectionParams`, `AddInstrumentalParams`,
`AddVocalsParams`, `GenerateSoundsParams`, `GenerateLyricsParams`, `ConvertToWavParams`,
`SeparateVocalsParams`, `GenerateMidiParams`, `CreateMusicVideoParams`, `GenerateCoverParams`,
`BoostMusicStyleParams`, `ValidateVoiceParams`, `GenerateVoiceParams`, `UploadFileParams`,
`TaskCreated`, `MusicGenerationRecord`, `LyricsGenerationRecord`, `WavConversionRecord`,
`VocalSeparationRecord`, `MidiGenerationRecord`, `MusicVideoRecord`, `CoverGenerationRecord`,
`VoiceValidateInfo`, `VoiceRecordInfo`, `UploadFileResponse`, `AudioTrack`, … (all with JSDoc).

```ts
import type { GenerateMusicParams, AudioTrack } from 'sunoapi-sdk';
```

---

## Webhooks (callBackUrl)

Every creation method accepts a `callBackUrl`. When the task finishes, SunoAPI
does a `POST` to that URL with the result. The callback body uses *snake_case*
(`audio_url`, `task_id`, …) unlike `record-info` which uses *camelCase*
(`audioUrl`, `taskId`). The SDK covers both cases: poll with `waitFor*`
or receive the push via webhook.

---

## Complete example (ESM, TypeScript)

```ts
import { SunoAPI } from 'sunoapi-sdk';

const suno = new SunoAPI({ apiKey: process.env.SUNO_API_KEY! });

// 1) Generate
const { taskId } = await suno.music.generate({
  prompt: 'Energetic tech-house for working out',
  style: 'tech-house, energetic, driving',
  title: 'Gym Fuel',
  customMode: true,
  instrumental: true,
  model: SunoAPI.Model.V5,
});

// 2) Wait
const record = await suno.waitForMusic(taskId);
const track = record.response.sunoData[0];

// 3) Enjoy
console.log(`✅ ${track.title} ready: ${track.audioUrl}`);
```

---

## Development

```bash
git clone <repo> && cd Suno
npm install
npm run build     # tsc ESM -> dist/esm , tsc CJS -> dist/cjs
```

- `dist/esm` is published as ESM (`"type": "module"`).
- `dist/cjs` is published as CommonJS (includes `dist/cjs/package.json`).
- Types (`.d.ts`) are generated for both.

---

## Complete API reference

Every method returns the **unwrapped `data`** from the `{code,msg,data}` envelope
(or `{success,code,msg,data}` for uploads). If `code !== 200` (or `success !== true`)
a `SunoAPIError` is thrown.

| Resource | Method | Endpoint | Returns |
|---|---|---|---|
| `music` | `generate` | `POST /api/v1/generate` | `TaskCreated` |
| `music` | `extend` | `POST /api/v1/generate/extend` | `TaskCreated` |
| `music` | `uploadCover` | `POST /api/v1/generate/upload-cover` | `TaskCreated` |
| `music` | `uploadExtend` | `POST /api/v1/generate/upload-extend` | `TaskCreated` |
| `music` | `mashup` | `POST /api/v1/generate/mashup` | `TaskCreated` |
| `music` | `generatePersona` | `POST /api/v1/generate/generate-persona` | `TaskCreated` |
| `music` | `replaceSection` | `POST /api/v1/generate/replace-section` | `TaskCreated` |
| `music` | `addInstrumental` | `POST /api/v1/generate/add-instrumental` | `TaskCreated` |
| `music` | `addVocals` | `POST /api/v1/generate/add-vocals` | `TaskCreated` |
| `music` | `getRecordInfo(taskId)` | `GET /api/v1/generate/record-info` | `MusicGenerationRecord` |
| `music` | `getTimestampedLyrics(taskId, audioId)` | `POST /api/v1/generate/get-timestamped-lyrics` | `TimestampedLyrics` |
| `sounds` | `generate` | `POST /api/v1/generate/sounds` | `TaskCreated` |
| `lyrics` | `generate` | `POST /api/v1/lyrics` | `TaskCreated` |
| `lyrics` | `getRecordInfo(taskId)` | `GET /api/v1/lyrics/record-info` | `LyricsGenerationRecord` |
| `style` | `boost(content)` | `POST /api/v1/style/generate` | `Record<string, unknown>` |
| `wav` | `generate` | `POST /api/v1/wav/generate` | `TaskCreated` |
| `wav` | `getRecordInfo(taskId)` | `GET /api/v1/wav/record-info` | `WavConversionRecord` |
| `separation` | `generate` | `POST /api/v1/vocal-removal/generate` | `TaskCreated` |
| `separation` | `getRecordInfo(taskId)` | `GET /api/v1/vocal-removal/record-info` | `VocalSeparationRecord` |
| `midi` | `generate` | `POST /api/v1/midi/generate` | `TaskCreated` |
| `midi` | `getRecordInfo(taskId)` | `GET /api/v1/midi/record-info` | `MidiGenerationRecord` |
| `video` | `generate` | `POST /api/v1/mp4/generate` | `TaskCreated` |
| `video` | `getRecordInfo(taskId)` | `GET /api/v1/mp4/record-info` | `MusicVideoRecord` |
| `cover` | `generate` | `POST /api/v1/suno/cover/generate` | `TaskCreated` |
| `cover` | `getRecordInfo(taskId)` | `GET /api/v1/suno/cover/record-info` | `CoverGenerationRecord` |
| `voice` | `validate` | `POST /api/v1/voice/validate` | `TaskCreated` |
| `voice` | `getValidateInfo(taskId)` | `GET /api/v1/voice/validate-info` | `VoiceValidateInfo` |
| `voice` | `generate` | `POST /api/v1/voice/generate` | `TaskCreated` |
| `voice` | `getRecordInfo(taskId)` | `GET /api/v1/voice/record-info` | `VoiceRecordInfo` |
| `voice` | `regenerate(taskId, calBackUrl)` | `POST /api/v1/voice/regenerate` | `TaskCreated` |
| `voice` | `checkVoice(taskId)` | `POST /api/v1/voice/check-voice` | `CheckVoiceResponse` |
| `upload` | `fromBase64` | `POST /api/file-base64-upload` | `UploadFileResponse` |
| `upload` | `fromUrl` | `POST /api/file-url-upload` | `UploadFileResponse` |
| `upload` | `fromStream` | `POST /api/file-stream-upload` | `UploadFileResponse` |
| `credits` | `getRemaining()` | `GET /api/v1/account/subscription/remain` | `number` |

> The `upload` resource uses a **different base URL** (`https://sunoapiorg.redpandaai.co`)
> managed automatically by the SDK.

### Music from an uploaded audio (`uploadCover` / `uploadExtend`)

```ts
// Generate a cover of a song from an already-uploaded MP3 (uploadUrl is the upload's downloadUrl)
const { taskId } = await suno.music.uploadCover({
  uploadUrl: 'https://sunoapiorg.redpandaai.co/.../my-track.mp3',
  customMode: true,
  instrumental: false,
  model: SunoAPI.Model.V4_5PLUS,
  title: 'My version',
  style: 'indie rock, dreamy',
  callBackUrl: 'https://myapp.com/webhooks/suno',
});

// Extend a track you already have
const ext = await suno.music.uploadExtend({
  uploadUrl: 'https://sunoapiorg.redpandaai.co/.../base.mp3',
  defaultParamFlag: false,
  model: SunoAPI.Model.V4_5PLUS,
  continueAt: '60',                 // second to continue from
  prompt: 'more energy, bigger drop',
  callBackUrl: 'https://myapp.com/webhooks/suno',
});
```

### Persona, infill and adding tracks (`generatePersona` / `replaceSection` / `addInstrumental` / `addVocals`)

```ts
// Create a reusable vocal "persona" from an audio
await suno.music.generatePersona({
  taskId, audioId,
  name: 'Lucia', description: 'warm voice, mid register',
  vocalStart: 12, vocalEnd: 38,
  style: 'latin pop',
});

// Rewrite a section (infill) of a lyric
await suno.music.replaceSection({
  fullLyrics: '[full verses...]',
  infillStartS: 30, infillEndS: 45,
  prompt: 'bridge with bagpipes',
  tags: 'celtic, epic',
  title: 'Paths',
  negativeTags: 'metal',
});

// Add instrumentation to an instrumental audio
await suno.music.addInstrumental({
  uploadUrl: dl,
  title: 'With strings',
  tags: 'orchestral, cinematic',
  negativeTags: 'synth',
  callBackUrl: CB,
});

// Add vocals to an instrumental
await suno.music.addVocals({
  uploadUrl: dl,
  prompt: 'female vocal, breathy',
  title: 'With voice',
  style: 'ambient pop',
  negativeTags: 'rap',
  callBackUrl: CB,
});
```

### Timed lyrics (`getTimestampedLyrics`)

```ts
const tl = await suno.music.getTimestampedLyrics(taskId, audioId);
tl.alignedWords.forEach(w => console.log(`${w.word} [${w.startS}s–${w.endS}s]`));
```

### Sounds / SFX (`sounds.generate`)

```ts
const { taskId } = await suno.sounds.generate({
  prompt: 'rain in the forest at dawn',
  model: SunoAPI.SoundModel.V5,
  soundLoop: true,
  soundTempo: 90,
  soundKey: SunoAPI.SoundKey.C,
  grabLyrics: false,
  callBackUrl: CB,
});
```

### Lyrics (`lyrics.generate` + `lyrics.getRecordInfo`)

```ts
const { taskId } = await suno.lyrics.generate({
  prompt: 'a ballad about coming home',
  callBackUrl: CB,
});
const lyrics = await suno.waitForLyrics(taskId);
console.log(lyrics.response.data);
```

### Style (`style.boost`)

```ts
const suggestion = await suno.style.boost('a nostalgic synthwave song');
console.log(suggestion);
```

### WAV, vocal separation, MIDI, video and cover art

```ts
// WAV from a generated song
const wav = await suno.wav.generate({ taskId, audioId, callBackUrl: CB });
const wavRec = await suno.waitForWav(wav.taskId);
console.log(wavRec.response.audioWavUrl);

// Split stems (vocals / instrumental / drums / bass…)
const sep = await suno.separation.generate({
  callBackUrl: CB,
  audioId,                       // or type: 'url' + stemName: 'vocals'
});
const sepRec = await suno.waitForSeparation(sep.taskId);
console.log(sepRec.response.vocalUrl, sepRec.response.instrumentalUrl);

// MIDI
const midi = await suno.midi.generate({ taskId, callBackUrl: CB });
const midiRec = await suno.waitForMidi(midi.taskId);
console.log(midiRec.midiData.instruments);

// Music video (mp4)
const vid = await suno.video.generate({ taskId, audioId, callBackUrl: CB });
const vidRec = await suno.waitForVideo(vid.taskId);
console.log(vidRec.response.videoUrl);

// Cover art
const cov = await suno.cover.generate({ taskId, callBackUrl: CB });
const covRec = await suno.waitForCover(cov.taskId);
console.log(covRec.response.images);
```

### Custom voice (`voice`)

```ts
// 1) Validate a voice clip
const v = await suno.voice.validate({
  voiceUrl: 'https://.../voice.wav',
  vocalStartS: 2, vocalEndS: 10,
  language: SunoAPI.VoiceLanguage.Spanish,
  callBackUrl: CB,
});
const info = await suno.voice.getValidateInfo(v.taskId);
const { voiceId } = await suno.waitForVoiceValidate(v.taskId);

// 2) Generate the voice model
const g = await suno.voice.generate({
  taskId: v.taskId,
  verifyUrl: info.validateInfo,        // verification URL from step 1
  voiceName: 'My Voice',
  style: 'warm, intimate',
  singerSkillLevel: SunoAPI.SingerSkillLevel.Professional,
  callBackUrl: CB,
});
const voiceRec = await suno.waitForVoice(g.taskId);
console.log(voiceRec.voiceId);

// 3) Regenerate / check availability
await suno.voice.regenerate(g.taskId, CB);
const availability = await suno.voice.checkVoice(g.taskId);  // { isAvailable: true }
```

### File uploads (`upload.fromBase64` / `fromUrl` / `fromStream`)

```ts
// From an external URL (the easiest case)
const up = await suno.upload.fromUrl({
  fileUrl: 'https://.../track.mp3',
  uploadPath: 'mp3',
});
console.log(up.downloadUrl);     // use as uploadUrl in music.uploadCover, etc.

// From base64
const up2 = await suno.upload.fromBase64({
  base64Data: 'data:audio/mpeg;base64,SUQz...',
  uploadPath: 'mp3',
});

// From a buffer / stream (Node) — multipart
import { readFileSync } from 'node:fs';
const up3 = await suno.upload.fromStream({
  file: readFileSync('track.mp3'),
  uploadPath: 'mp3',
  fileName: 'track.mp3',
});
```

### Credits

```ts
const remaining = await suno.credits.getRemaining();
console.log(`You have ${remaining} credits left`);
// or directly:
const remaining2 = await suno.getCredits();
```

### All `waitFor*`

```ts
await suno.waitForMusic(taskId);        // MusicGenerationRecord
await suno.waitForLyrics(taskId);       // LyricsGenerationRecord
await suno.waitForWav(taskId);          // WavConversionRecord
await suno.waitForSeparation(taskId);   // VocalSeparationRecord
await suno.waitForMidi(taskId);         // MidiGenerationRecord
await suno.waitForVideo(taskId);        // MusicVideoRecord
await suno.waitForCover(taskId);        // CoverGenerationRecord
await suno.waitForVoice(taskId);        // VoiceRecordInfo
await suno.waitForVoiceValidate(taskId);// VoiceValidateInfo
// all accept { intervalMs, timeoutMs, signal }
```

---

## License

MIT.
