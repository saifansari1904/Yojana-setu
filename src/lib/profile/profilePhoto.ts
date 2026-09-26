/**
 * YOJANA SETU — PROFILE PHOTO PROCESSING (Phase 2E.2 hardening)
 * ---------------------------------------------------------------
 * Single shared pipeline for both profile-photo upload paths
 * (ProfilePhotoModal and ProfileEditModal).
 *
 * Guarantees:
 * 1. Declared MIME allowlist AND magic-byte sniffing — file.type is
 *    spoofable, so the actual bytes must be JPEG / PNG / WebP.
 * 2. Pre-read size cap (3 MB) preserved from the previous behavior.
 * 3. Resize to a max 512px dimension + JPEG re-encode (quality 0.85) on a
 *    white background — the stored payload is bounded and deterministic,
 *    instead of persisting the full original base64.
 * 4. Post-processing payload cap (256 KB): the stored data URL can never
 *    silently balloon profile JSON / localStorage.
 * 5. Every failure mode surfaces as a PhotoProcessError with a stable code
 *    so the UI can show the right message instead of false success.
 *
 * UI identity, avatar defaults, and the ownership model are unchanged.
 */

export const MAX_PHOTO_FILE_BYTES = 3 * 1024 * 1024; // 3 MB pre-read cap (unchanged)
export const MAX_PHOTO_DIMENSION_PX = 512; // avatar display bound
export const PHOTO_JPEG_QUALITY = 0.85;
export const MAX_PHOTO_DATA_URL_BYTES = 256 * 1024; // post-processing payload cap
/** Conservative localStorage budget (typical 5 MB quota minus headroom). */
export const LOCAL_STORAGE_BUDGET_BYTES = Math.floor(4.5 * 1024 * 1024);

export const ALLOWED_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedPhotoMime = (typeof ALLOWED_PHOTO_MIME_TYPES)[number];

export type PhotoProcessErrorCode =
  | 'unsupported-type' // declared MIME not allowed OR magic bytes mismatch
  | 'too-large' // pre-read file size exceeds MAX_PHOTO_FILE_BYTES
  | 'unreadable' // magic bytes ok but the image cannot be decoded
  | 'output-too-large'; // resized output still exceeds MAX_PHOTO_DATA_URL_BYTES

export class PhotoProcessError extends Error {
  readonly code: PhotoProcessErrorCode;
  constructor(code: PhotoProcessErrorCode, message: string) {
    super(message);
    this.name = 'PhotoProcessError';
    this.code = code;
  }
}

export type ImageKind = 'jpeg' | 'png' | 'webp';

/**
 * Magic-byte sniffing. file.type comes from the OS / uploader and is
 * trivially spoofed — only the leading bytes are trustworthy.
 */
export function detectImageKind(bytes: Uint8Array): ImageKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'png';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50 // P
  ) {
    return 'webp';
  }
  return null;
}

/** Byte length of a data URL's payload (base64 decoded size estimate). */
export function dataUrlByteLength(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const cleaned = b64.replace(/\s/g, '');
  const padding = cleaned.endsWith('==') ? 2 : cleaned.endsWith('=') ? 1 : 0;
  return Math.floor((cleaned.length * 3) / 4) - padding;
}

/**
 * Resize math: scale so the longest side is MAX_PHOTO_DIMENSION_PX,
 * never upscale. Pure function — unit-testable without a DOM.
 */
export function calculateTargetDimensions(
  width: number,
  height: number,
  maxDimension: number = MAX_PHOTO_DIMENSION_PX,
): { width: number; height: number } {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new PhotoProcessError('unreadable', 'Image has invalid dimensions.');
  }
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export interface ProcessedPhoto {
  /** Bounded data URL (image/jpeg) ready to persist on the profile. */
  dataUrl: string;
  mimeType: 'image/jpeg';
  width: number;
  height: number;
  /** Original file size in bytes (for UI display). */
  originalBytes: number;
}

function loadImageElement(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new PhotoProcessError('unreadable', 'Image could not be decoded.'));
    img.src = objectUrl;
  });
}

/**
 * Full pipeline: validate → sniff → decode → resize → re-encode → cap.
 * Throws PhotoProcessError on every failure mode; never returns a spoofed
 * or unbounded payload.
 */
export async function processProfilePhoto(file: File): Promise<ProcessedPhoto> {
  // 1. Declared MIME allowlist (fast path; NOT trusted on its own).
  if (!ALLOWED_PHOTO_MIME_TYPES.includes(file.type as AllowedPhotoMime)) {
    throw new PhotoProcessError(
      'unsupported-type',
      `Unsupported declared file type: ${file.type || '(none)'}.`,
    );
  }

  // 2. Pre-read size cap.
  if (file.size > MAX_PHOTO_FILE_BYTES) {
    throw new PhotoProcessError('too-large', `File size ${file.size} exceeds the 3 MB limit.`);
  }

  // 3. Magic-byte sniffing — the actual trust decision.
  const headBuffer = await file.slice(0, 12).arrayBuffer();
  const kind = detectImageKind(new Uint8Array(headBuffer));
  if (!kind) {
    throw new PhotoProcessError(
      'unsupported-type',
      'File content is not a JPEG, PNG, or WebP image (magic-byte check failed).',
    );
  }

  // 4. Decode + resize + re-encode on a white background.
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(objectUrl);
    const { width, height } = calculateTargetDimensions(img.naturalWidth, img.naturalHeight);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new PhotoProcessError('unreadable', 'Canvas 2D context unavailable.');
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', PHOTO_JPEG_QUALITY);
    if (!dataUrl.startsWith('data:image/jpeg')) {
      throw new PhotoProcessError('unreadable', 'JPEG encoding failed.');
    }

    // 5. Post-processing payload cap — belt and braces.
    if (dataUrlByteLength(dataUrl) > MAX_PHOTO_DATA_URL_BYTES) {
      throw new PhotoProcessError(
        'output-too-large',
        'Processed photo still exceeds the storage payload cap.',
      );
    }

    return { dataUrl, mimeType: 'image/jpeg', width, height, originalBytes: file.size };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Maps a processing failure to the existing profile i18n error strings.
 * Returns the i18n key name; the caller resolves it against PROFILE_I18N.
 */
export function photoErrorI18nKey(code: PhotoProcessErrorCode): 'photoTypeError' | 'photoSizeError' {
  switch (code) {
    case 'too-large':
    case 'output-too-large':
      return 'photoSizeError';
    case 'unsupported-type':
    case 'unreadable':
    default:
      return 'photoTypeError';
  }
}
