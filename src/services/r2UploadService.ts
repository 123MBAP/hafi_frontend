import { API_BASE } from '../api/apiClient';

/**
 * Cloudflare R2 Direct Browser Upload Service
 * 
 * Handles:
 * 1. Client-side file type and size validation
 * 2. Requesting short-lived presigned PUT URLs from the backend/Edge Function
 * 3. Direct browser-to-R2 HTTP PUT uploads with live progress
 * 4. Safe media referencing and error handling
 */

export type MediaCategory =
  | 'products'
  | 'services'
  | 'seller_products'
  | 'profile'
  | 'real_estate'
  | 'general';

export interface PresignedUploadResponse {
  success: boolean;
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
  contentType: string;
  maxSizeBytes: number;
  expiresIn: number;
}

export interface UploadedR2File {
  url: string;
  objectKey: string;
  size: number;
  type: 'image' | 'video';
  fileType: 'image' | 'video';
  fileName: string;
  isMain?: boolean;
  isView?: boolean;
}

export interface UploadOptions {
  category: MediaCategory;
  token?: string | null;
  onProgress?: (percent: number) => void;
}

// Supported MIME types and client-side size boundaries
const ALLOWED_MIME_TYPES: Record<string, { maxBytes: number; type: 'image' | 'video' }> = {
  // Images (Max 50MB)
  'image/jpeg': { maxBytes: 50 * 1024 * 1024, type: 'image' },
  'image/jpg': { maxBytes: 50 * 1024 * 1024, type: 'image' },
  'image/png': { maxBytes: 50 * 1024 * 1024, type: 'image' },
  'image/webp': { maxBytes: 50 * 1024 * 1024, type: 'image' },
  'image/gif': { maxBytes: 50 * 1024 * 1024, type: 'image' },
  'image/svg+xml': { maxBytes: 10 * 1024 * 1024, type: 'image' },

  // Videos (Max 500MB)
  'video/mp4': { maxBytes: 500 * 1024 * 1024, type: 'video' },
  'video/webm': { maxBytes: 500 * 1024 * 1024, type: 'video' },
  'video/quicktime': { maxBytes: 500 * 1024 * 1024, type: 'video' },
  'video/x-matroska': { maxBytes: 500 * 1024 * 1024, type: 'video' },
};

/**
 * Validate file before requesting presigned URL.
 */
export function validateMediaFile(file: File): { valid: boolean; error?: string; type: 'image' | 'video' } {
  if (!file) {
    return { valid: false, error: 'No file provided', type: 'image' };
  }

  const mime = (file.type || '').toLowerCase();
  const config = ALLOWED_MIME_TYPES[mime];

  if (!config) {
    return {
      valid: false,
      error: `Unsupported file format: ${file.name} (${file.type || 'unknown'}). Supported formats are: JPG, PNG, WEBP, GIF, SVG, MP4, WEBM, MOV.`,
      type: 'image',
    };
  }

  if (file.size > config.maxBytes) {
    const maxMb = Math.round(config.maxBytes / (1024 * 1024));
    const fileMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File ${file.name} (${fileMb}MB) exceeds the maximum allowed size of ${maxMb}MB.`,
      type: config.type,
    };
  }

  return { valid: true, type: config.type };
}

/**
 * Request a short-lived presigned PUT URL from the backend server.
 */
export async function getPresignedUploadUrl(
  file: File,
  category: MediaCategory,
  token?: string | null
): Promise<PresignedUploadResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const authToken = token || localStorage.getItem('token');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_BASE}/api/media/create-upload-url`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      category,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      fileSize: file.size,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Failed to get upload authorization (HTTP ${res.status})`);
  }

  return data;
}

/**
 * Upload a file directly to Cloudflare R2 using the presigned URL.
 * Uses XMLHttpRequest to monitor upload progress.
 */
export function putFileToR2(
  file: File,
  uploadUrl: string,
  contentType: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);

    // IMPORTANT: Must match the Content-Type used when generating the presigned URL
    xhr.setRequestHeader('Content-Type', contentType);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100);
        resolve();
      } else {
        reject(
          new Error(`Direct storage upload failed with status ${xhr.status}: ${xhr.statusText || 'Upload rejected'}`)
        );
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during direct storage upload. Please check your connection and CORS settings.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Storage upload request timed out. Please try again.'));
    };

    xhr.send(file);
  });
}

/**
 * Complete direct upload workflow for a single file.
 * 
 * 1. Validates file locally.
 * 2. Gets presigned URL from backend.
 * 3. Directly uploads to Cloudflare R2 with progress.
 * 4. Returns media reference `{ url, objectKey, size, type, fileName }`.
 */
export async function uploadFileToR2(
  file: File,
  options: UploadOptions
): Promise<UploadedR2File> {
  const validation = validateMediaFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file');
  }

  // 1. Get presigned upload URL
  const signed = await getPresignedUploadUrl(file, options.category, options.token);

  // 2. Direct upload to R2
  await putFileToR2(file, signed.uploadUrl, signed.contentType, options.onProgress);

  return {
    url: signed.publicUrl,
    objectKey: signed.objectKey,
    size: file.size,
    type: validation.type,
    fileType: validation.type,
    fileName: file.name,
  };
}

/**
 * Upload multiple files to Cloudflare R2 with cumulative progress reporting.
 */
export async function uploadMultipleFilesToR2(
  items: Array<{ file: File; isMain?: boolean; isView?: boolean }>,
  options: UploadOptions
): Promise<UploadedR2File[]> {
  if (!items || items.length === 0) return [];

  const totalBytes = items.reduce((sum, item) => sum + item.file.size, 0);
  const loadedPerFile = new Array(items.length).fill(0);

  const updateOverallProgress = () => {
    if (!options.onProgress) return;
    const loadedTotal = loadedPerFile.reduce((sum, bytes) => sum + bytes, 0);
    const overallPercent = totalBytes > 0 ? Math.min(100, Math.round((loadedTotal / totalBytes) * 100)) : 100;
    options.onProgress(overallPercent);
  };

  const results: UploadedR2File[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const validation = validateMediaFile(item.file);
    if (!validation.valid) {
      throw new Error(validation.error || `Invalid file: ${item.file.name}`);
    }

    const signed = await getPresignedUploadUrl(item.file, options.category, options.token);

    await putFileToR2(
      item.file,
      signed.uploadUrl,
      signed.contentType,
      (filePercent) => {
        loadedPerFile[i] = Math.round((filePercent / 100) * item.file.size);
        updateOverallProgress();
      }
    );

    loadedPerFile[i] = item.file.size;
    updateOverallProgress();

    results.push({
      url: signed.publicUrl,
      objectKey: signed.objectKey,
      size: item.file.size,
      type: validation.type,
      fileType: validation.type,
      fileName: item.file.name,
      isMain: item.isMain,
      isView: item.isView,
    });
  }

  return results;
}

/**
 * Delete a media object from Cloudflare R2 by object key.
 */
export async function deleteR2MediaObject(objectKey: string, token?: string | null): Promise<boolean> {
  if (!objectKey) return false;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const authToken = token || localStorage.getItem('token');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const res = await fetch(`${API_BASE}/api/media/object`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ objectKey }),
    });

    const data = await res.json().catch(() => ({}));
    return Boolean(data.success);
  } catch (err) {
    console.error('Failed to delete R2 media object:', err);
    return false;
  }
}

