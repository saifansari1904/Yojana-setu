/**
 * YOJANA SETU — PHASE 2E.2 PROFILE PHOTO HARDENING TESTS
 * ---------------------------------------------------------
 *   H1. Magic-byte sniffing recognizes JPEG / PNG / WebP headers and
 *       rejects garbage, truncated, and spoofed content.
 *   H2. Declared file.type is never trusted alone: a file declaring
 *       image/png but carrying non-image bytes is rejected as
 *       'unsupported-type'.
 *   H3. Pre-read size cap: files over 3 MB are rejected before any read.
 *   H4. Resize math: longest side capped at 512px, aspect preserved,
 *       never upscaled; invalid dimensions throw 'unreadable'.
 *   H5. Payload accounting: dataUrlByteLength decodes base64 size
 *       correctly (payload cap enforcement relies on it).
 *   H6. Error-code → i18n-key mapping covers every failure mode.
 *
 * The canvas/Image re-encode step needs a DOM and is exercised in the
 * browser; everything trust-relevant below it is pure and tested here.
 */

import {
  detectImageKind,
  calculateTargetDimensions,
  dataUrlByteLength,
  photoErrorI18nKey,
  processProfilePhoto,
  PhotoProcessError,
  MAX_PHOTO_FILE_BYTES,
  MAX_PHOTO_DIMENSION_PX,
  MAX_PHOTO_DATA_URL_BYTES,
  ALLOWED_PHOTO_MIME_TYPES,
} from './profilePhoto';

let passed = 0;
let failed = 0;

function assert(name: string, cond: boolean): void {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error(`❌ FAIL: ${name}`);
  }
}

async function assertThrowsCode(
  name: string,
  fn: () => Promise<unknown>,
  code: string,
): Promise<void> {
  try {
    await fn();
    failed++;
    console.error(`❌ FAIL: ${name} — expected throw, got success`);
  } catch (err) {
    if (err instanceof PhotoProcessError && err.code === code) {
      passed++;
    } else {
      failed++;
      console.error(
        `❌ FAIL: ${name} — expected code '${code}', got '${err instanceof PhotoProcessError ? err.code : String(err)}'`,
      );
    }
  }
}

const JPEG_HEAD = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
const PNG_HEAD = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const WEBP_HEAD = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);
const GARBAGE = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
const TRUNCATED = new Uint8Array([0xff, 0xd8]); // too short for any signature

function makeFile(bytes: Uint8Array, type: string, size?: number): File {
  const blob = new Blob([bytes as unknown as BlobPart], { type });
  // Spoof a larger size without allocating: override via a File-like object
  // cast — processProfilePhoto only reads .type, .size, .slice().
  const file = new File([blob], 'spoof.bin', { type });
  if (size !== undefined) {
    Object.defineProperty(file, 'size', { value: size });
  }
  return file;
}

async function run(): Promise<void> {
  /* H1. Magic-byte sniffing */
  assert('H1. JPEG header recognized', detectImageKind(JPEG_HEAD) === 'jpeg');
  assert('H1. PNG header recognized', detectImageKind(PNG_HEAD) === 'png');
  assert('H1. WebP header recognized', detectImageKind(WEBP_HEAD) === 'webp');
  assert('H1. PDF bytes rejected', detectImageKind(GARBAGE) === null);
  assert('H1. truncated header rejected', detectImageKind(TRUNCATED) === null);
  assert('H1. empty input rejected', detectImageKind(new Uint8Array(0)) === null);
  // RIFF without WEBP marker is not WebP
  const riffNotWebp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x41, 0x56, 0x49, 0x20]);
  assert('H1. RIFF non-WebP rejected', detectImageKind(riffNotWebp) === null);

  /* H2. Declared type never trusted alone */
  await assertThrowsCode(
    'H2. declared image/png with PDF bytes → unsupported-type',
    () => processProfilePhoto(makeFile(GARBAGE, 'image/png')),
    'unsupported-type',
  );
  await assertThrowsCode(
    'H2. undeclared type → unsupported-type',
    () => processProfilePhoto(makeFile(JPEG_HEAD, 'application/octet-stream')),
    'unsupported-type',
  );
  await assertThrowsCode(
    'H2. empty declared type → unsupported-type',
    () => processProfilePhoto(makeFile(JPEG_HEAD, '')),
    'unsupported-type',
  );

  /* H3. Pre-read size cap */
  await assertThrowsCode(
    'H3. 3MB+1 file rejected before read',
    () => processProfilePhoto(makeFile(JPEG_HEAD, 'image/jpeg', MAX_PHOTO_FILE_BYTES + 1)),
    'too-large',
  );
  assert('H3. cap is 3MB', MAX_PHOTO_FILE_BYTES === 3 * 1024 * 1024);

  /* H4. Resize math */
  const land = calculateTargetDimensions(2000, 1000);
  assert('H4. landscape longest side capped', land.width === 512 && land.height === 256);
  const port = calculateTargetDimensions(1000, 2000);
  assert('H4. portrait longest side capped', port.width === 256 && port.height === 512);
  const small = calculateTargetDimensions(100, 80);
  assert('H4. small images never upscaled', small.width === 100 && small.height === 80);
  const square = calculateTargetDimensions(512, 512);
  assert('H4. exact-bound square unchanged', square.width === 512 && square.height === 512);
  assert('H4. max dimension constant is 512', MAX_PHOTO_DIMENSION_PX === 512);
  try {
    calculateTargetDimensions(0, 100);
    failed++;
    console.error('❌ FAIL: H4. zero width should throw');
  } catch (err) {
    assert('H4. zero width throws unreadable', err instanceof PhotoProcessError && err.code === 'unreadable');
  }

  /* H5. Payload accounting */
  // 'aGVsbG8=' is base64 for 'hello' (5 bytes)
  assert('H5. base64 size decoded', dataUrlByteLength('data:image/jpeg;base64,aGVsbG8=') === 5);
  assert('H5. unpadded base64 size decoded', dataUrlByteLength('data:image/jpeg;base64,aGVsbG8') === 5);
  assert('H5. payload cap is 256KB', MAX_PHOTO_DATA_URL_BYTES === 256 * 1024);

  /* H6. Error → i18n mapping */
  assert('H6. unsupported-type → photoTypeError', photoErrorI18nKey('unsupported-type') === 'photoTypeError');
  assert('H6. unreadable → photoTypeError', photoErrorI18nKey('unreadable') === 'photoTypeError');
  assert('H6. too-large → photoSizeError', photoErrorI18nKey('too-large') === 'photoSizeError');
  assert('H6. output-too-large → photoSizeError', photoErrorI18nKey('output-too-large') === 'photoSizeError');
  assert(
    'H6. allowlist covers jpeg/png/webp',
    ALLOWED_PHOTO_MIME_TYPES.length === 3 &&
      (ALLOWED_PHOTO_MIME_TYPES as readonly string[]).includes('image/webp'),
  );

  console.log(`\n--- PROFILE PHOTO HARDENING: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error('❌ FAIL: photo suite crashed', err);
  process.exitCode = 1;
});
