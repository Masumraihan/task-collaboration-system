import sharp from "sharp";
import imagemin from "imagemin";
import imageminMozjpeg from "imagemin-mozjpeg";
import imageminWebp from "imagemin-webp";

export const compressImageWithImagemin = async (buffer: Buffer, mimeType: string) => {
  if (!mimeType?.startsWith("image/")) return buffer;

  // ✅ Resize (critical)
  let img = sharp(buffer).resize({
    width: 1280,
    withoutEnlargement: true,
  });

  // ✅ PNG → Sharp (NO pngquant)
  if (mimeType === "image/png") {
    return img
      .png({
        compressionLevel: 9,
        palette: true,
      })
      .toBuffer();
  }

  const resizedBuffer = await img.toBuffer();

  // ✅ JPEG & WebP → Imagemin
  const plugins = [];

  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    plugins.push(imageminMozjpeg({ quality: 70 }));
  }

  if (mimeType === "image/webp") {
    plugins.push(imageminWebp({ quality: 70 }));
  }

  if (!plugins.length) return resizedBuffer;

  return imagemin.buffer(resizedBuffer, { plugins });
};
