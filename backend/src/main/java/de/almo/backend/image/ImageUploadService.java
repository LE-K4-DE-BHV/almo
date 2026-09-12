package de.almo.backend.image;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.io.IOException;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Admin-only (see AdminProductController) upload of product images to Cloudinary - the backend
 * never stores the file itself, only forwards it and keeps the URL Cloudinary hands back (see spec:
 * images live outside the VPS, only a link goes in image_refs).
 */
@Service
public class ImageUploadService {

  /** Null when CLOUDINARY_URL isn't set - see ImageUploadNotConfiguredException. */
  private final Cloudinary cloudinary;

  public ImageUploadService(org.springframework.core.env.Environment environment) {
    String cloudinaryUrl = environment.getProperty("CLOUDINARY_URL", "");
    this.cloudinary = cloudinaryUrl.isBlank() ? null : new Cloudinary(cloudinaryUrl);
  }

  public String upload(long productId, MultipartFile file) {
    if (cloudinary == null) {
      throw new ImageUploadNotConfiguredException();
    }
    try {
      Map<?, ?> result =
          cloudinary
              .uploader()
              .upload(file.getBytes(), ObjectUtils.asMap("folder", "almo/products/" + productId));
      return (String) result.get("secure_url");
    } catch (IOException e) {
      throw new IllegalStateException("Failed to upload image to Cloudinary", e);
    }
  }
}
