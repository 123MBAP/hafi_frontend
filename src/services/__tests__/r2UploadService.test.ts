import { describe, it, expect } from 'vitest';
import { validateMediaFile } from '../r2UploadService';

describe('r2UploadService - Client-side validation', () => {
  it('should accept valid image MIME types', () => {
    const validJpg = new File(['dummy content'], 'photo.jpg', { type: 'image/jpeg' });
    const validPng = new File(['dummy content'], 'artwork.png', { type: 'image/png' });
    const validWebp = new File(['dummy content'], 'product.webp', { type: 'image/webp' });

    expect(validateMediaFile(validJpg)).toEqual({ valid: true, type: 'image' });
    expect(validateMediaFile(validPng)).toEqual({ valid: true, type: 'image' });
    expect(validateMediaFile(validWebp)).toEqual({ valid: true, type: 'image' });
  });

  it('should accept valid video MIME types', () => {
    const validMp4 = new File(['dummy video'], 'demo.mp4', { type: 'video/mp4' });
    const validWebm = new File(['dummy video'], 'recording.webm', { type: 'video/webm' });

    expect(validateMediaFile(validMp4)).toEqual({ valid: true, type: 'video' });
    expect(validateMediaFile(validWebm)).toEqual({ valid: true, type: 'video' });
  });

  it('should reject unsupported file types like exe, pdf, or zip', () => {
    const exeFile = new File(['malicious binary'], 'installer.exe', { type: 'application/x-msdownload' });
    const pdfFile = new File(['doc'], 'document.pdf', { type: 'application/pdf' });
    const zipFile = new File(['archive'], 'files.zip', { type: 'application/zip' });

    expect(validateMediaFile(exeFile).valid).toBe(false);
    expect(validateMediaFile(pdfFile).valid).toBe(false);
    expect(validateMediaFile(zipFile).valid).toBe(false);
  });

  it('should reject oversized image files (> 50MB)', () => {
    // Mock a 55MB file
    const oversizedFile = new File(['x'], 'huge.jpg', { type: 'image/jpeg' });
    Object.defineProperty(oversizedFile, 'size', { value: 55 * 1024 * 1024 });

    const result = validateMediaFile(oversizedFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds the maximum allowed size of 50MB');
  });

  it('should reject oversized video files (> 500MB)', () => {
    // Mock a 550MB file
    const oversizedVideo = new File(['x'], 'long_movie.mp4', { type: 'video/mp4' });
    Object.defineProperty(oversizedVideo, 'size', { value: 550 * 1024 * 1024 });

    const result = validateMediaFile(oversizedVideo);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds the maximum allowed size of 500MB');
  });
});

