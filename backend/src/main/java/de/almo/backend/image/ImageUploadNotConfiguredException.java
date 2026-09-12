package de.almo.backend.image;

/**
 * Thrown when an upload is attempted without CLOUDINARY_URL set - deliberately no local-disk
 * fallback (see Sprint 5 decision in docs/backlog.md), so this surfaces as a clear error instead of
 * silently doing something the spec explicitly ruled out.
 */
public class ImageUploadNotConfiguredException extends RuntimeException {

  public ImageUploadNotConfiguredException() {
    super("Image upload is not configured (CLOUDINARY_URL is not set)");
  }
}
