import OSS from "ali-oss";
import { StatusCodes } from "http-status-codes";
import config from "../config";
import AppError from "../errors/AppError";
import sharp from "sharp";

// ---------------------------------------------------------------------------
// OSS client singleton
// ---------------------------------------------------------------------------

//const ossClient = new OSS({
//  region: config.aliOssRegion, // e.g. "oss-cn-hangzhou"
//  accessKeyId: config.aliAccessKeyId as string,
//  accessKeySecret: config.aliAccessKeySecret as string,
//  bucket: config.aliOssBucketName,
//  authorizationV4: true,
//});

// Public base URL for the bucket
const ossBaseUrl = `https://${config.aliOssBucketName}.${config.aliOssRegion}.aliyuncs.com`;

// ---------------------------------------------------------------------------
// Internal: compress images before upload
// ---------------------------------------------------------------------------

const compressFile = async (buffer: Buffer, maxWidth = 1920): Promise<Buffer> => {
  return await sharp(buffer)
    .resize(maxWidth, null, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
};

// ---------------------------------------------------------------------------
// Upload a single file
// ---------------------------------------------------------------------------

export const uploadToS3 = async ({
  file,
  fileName,
}: {
  file: any;
  fileName: string;
}): Promise<string | null> => {
  try {
    const originalBuffer: Buffer = Buffer.isBuffer(file) ? file : file?.buffer;

    if (!originalBuffer) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid file buffer");
    }

    const mimeType = file?.mimetype || "application/octet-stream";
    const isImage = mimeType.startsWith("image/");

    const finalBuffer: Buffer = isImage ? await compressFile(originalBuffer, 800) : originalBuffer;

    //await ossClient.put(fileName, finalBuffer, {
    //  mime: mimeType,
    //  headers: { "x-oss-object-acl": "public-read" },
    //});

    return `${ossBaseUrl}/${fileName}`;
  } catch (error: any) {
    console.error("OSS Upload Error:", error);
    throw new AppError(StatusCodes.BAD_REQUEST, `File Upload failed: ${error.message}`);
  }
};

// ---------------------------------------------------------------------------
// Delete a single file
// ---------------------------------------------------------------------------

export const deleteFromS3 = async (key: string): Promise<void> => {
  try {
    //await ossClient.delete(key);
  } catch (error) {
    console.error("OSS Delete Error:", error);
    throw new Error("OSS file delete failed");
  }
};

// ---------------------------------------------------------------------------
// Upload multiple files in parallel
// ---------------------------------------------------------------------------

export const uploadManyToS3 = async (
  files: { file: any; path: string; key?: string }[],
): Promise<{ url: string; key: string }[]> => {
  try {
    const uploadPromises = files?.map(async ({ file, path }) => {
      const originalBuffer: Buffer = Buffer.isBuffer(file) ? file : file?.buffer;

      if (!originalBuffer) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Invalid file buffer");
      }

      const mimeType = file?.mimetype || "application/octet-stream";
      const isImage = mimeType.startsWith("image/");

      const finalBuffer: Buffer = isImage
        ? await compressFile(originalBuffer, 800)
        : originalBuffer;

      //await ossClient.put(path, finalBuffer, {
      //  mime: mimeType,
      //  headers: { "x-oss-object-acl": "public-read" },
      //});

      return { url: `${ossBaseUrl}/${path}`, key: path };
    });

    return await Promise.all(uploadPromises);
  } catch (error: any) {
    console.error("uploadManyToOSS error:", error);
    throw new Error("File Upload failed");
  }
};

// ---------------------------------------------------------------------------
// Delete multiple files
// ---------------------------------------------------------------------------

export const deleteManyFromS3 = async (keys: string[]): Promise<void> => {
  try {
    //await ossClient.deleteMulti(keys, { quiet: true });
  } catch (error) {
    console.error("OSS DeleteMulti Error:", error);
    throw new AppError(StatusCodes.BAD_REQUEST, "OSS file delete failed");
  }
};
